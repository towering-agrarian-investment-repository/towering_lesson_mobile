import ReservationCard, {
  ReservationCardSkeleton,
} from "@/components/golf/ReservationCard";
import {
  ActionButton,
  EmptyState,
  ErrorState,
  Skeleton,
  StateList,
} from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import { AppText } from "@/design-system/components/AppText";
import { useTheme } from "@/design-system/utils/theme";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
  getMemberReservationDetailQueryOptions,
  useMemberReservations,
} from "@/lib/hook/useReservation";
import type { MemberReservationType } from "@/service/reservation.service";
import type { MemberReservationResponse } from "@/types/member-reservation";
import { formatDateValue } from "@/utils/time-helper";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

export const RESERVATION_TABS: MemberReservationType[] = [
  "all",
  "bay",
  "private",
  "group",
  "program",
];

const reservationKeyExtractor = (item: MemberReservationResponse) =>
  `${item.reservationType}:${item.id}`;
const RESERVATION_LIST_CONTENT_STYLE = {
  paddingTop: 8,
  paddingBottom: 40,
} as const;

function ReservationSeparator() {
  return <View className="h-2.5" />;
}

type ReservationTabSceneProps = {
  type: MemberReservationType;
  referenceTime: number;
  from?: string;
  to?: string;
  period: "all" | "upcoming" | "past";
  onPeriodChange: (period: "all" | "upcoming" | "past") => void;
};

function ReservationTabSceneContent({
  type,
  referenceTime,
  from,
  to,
  period,
  onPeriodChange,
}: ReservationTabSceneProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLocked, runWithNavigationLock } = useNavigationLock();
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const refreshLocked = useRef(false);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useMemberReservations(type, from, to);

  const reservations = useMemo(() => {
    const seenKeys = new Set<string>();

    return (data?.items ?? []).filter((reservation) => {
      const key = reservationKeyExtractor(reservation);

      if (seenKeys.has(key)) {
        return false;
      }

      seenKeys.add(key);
      return true;
    });
  }, [data?.items]);
  const dateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const reservation of reservations) {
      counts.set(reservation.reservationDate, (counts.get(reservation.reservationDate) ?? 0) + 1);
    }
    return counts;
  }, [reservations]);

  const handleReservationPress = useCallback(
    (reservation: MemberReservationResponse) => {
      void queryClient.prefetchQuery(
        getMemberReservationDetailQueryOptions(
          reservation.id,
          reservation.reservationType,
        ),
      );
      runWithNavigationLock(() => {
        router.push({
          pathname: "/reservation/[id]",
          params: {
            id: String(reservation.id),
            type: reservation.reservationType,
          },
        });
      });
    },
    [queryClient, router, runWithNavigationLock],
  );

  const getReservationItemType = useCallback(
    (item: MemberReservationResponse, index: number) =>
      index === 0 || reservations[index - 1]?.reservationDate !== item.reservationDate
        ? "header-card"
        : "card",
    [reservations],
  );

  const renderReservationItem = useCallback(
    ({ item, index }: { item: MemberReservationResponse; index: number }) => (
      <View className="gap-2.5">
        {index === 0 || reservations[index - 1].reservationDate !== item.reservationDate ? (
          <ReservationDateHeader
            startTime={item.startTime}
            count={dateCounts.get(item.reservationDate) ?? 1}
            isFirst={index === 0}
          />
        ) : null}
        <ReservationCard
          reservation={item}
          referenceTime={
            item.reservationStatus.toUpperCase() === "RESERVED"
              ? referenceTime
              : undefined
          }
          disabled={isLocked}
          onPress={handleReservationPress}
        />
      </View>
    ),
    [dateCounts, handleReservationPress, isLocked, referenceTime, reservations],
  );

  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetching && !refreshLocked.current) {
      void fetchNextPage({ cancelRefetch: false });
    }
  }, [fetchNextPage, hasNextPage, isFetching]);

  const handleEndReached = useCallback(() => {
    if (!isFetchNextPageError) handleFetchNextPage();
  }, [handleFetchNextPage, isFetchNextPageError]);

  const handleRefetch = useCallback(async () => {
    if (refreshLocked.current || isFetching) return;
    refreshLocked.current = true;
    setIsPullRefreshing(true);
    try {
      await refetch({ cancelRefetch: false });
    } finally {
      refreshLocked.current = false;
      setIsPullRefreshing(false);
    }
  }, [isFetching, refetch]);

  if (isLoading) {
    return <ReservationLoadingState />;
  }

  if (isError && !data) {
    return (
      <StateList
        refreshing={isPullRefreshing}
        onRefresh={handleRefetch}
      >
        <ErrorState
          title={t("reservations.failedListTitle")}
          message={t("common.pullToRefreshAndTryAgain")}
          actionLabel={
            isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")
          }
          actionPending={isRefetching}
          onAction={handleRefetch}
        />
      </StateList>
    );
  }

  if (reservations.length === 0) {
    return (
      <StateList
        refreshing={isPullRefreshing}
        onRefresh={handleRefetch}
      >
        <EmptyState
          title={t(period === "past" ? "reservations.noPastReservationsTitle" : period === "upcoming" ? "reservations.noUpcomingReservationsTitle" : "reservations.noReservationsTitle")}
          message={t(period === "past" ? "reservations.noPastReservationsMessage" : period === "upcoming" ? "reservations.noUpcomingReservationsMessage" : "reservations.noReservationsMessage")}
          actionLabel={t(period === "all" ? "common.refresh" : "reservations.showAll")}
          actionPending={period === "all" && isRefetching}
          onAction={period === "all" ? handleRefetch : () => onPeriodChange("all")}
        />
      </StateList>
    );
  }

  return (
    <FlashList
      data={reservations}
      keyExtractor={reservationKeyExtractor}
      getItemType={getReservationItemType}
      renderItem={renderReservationItem}
      ItemSeparatorComponent={ReservationSeparator}
      refreshControl={
        <RefreshControl
          refreshing={isPullRefreshing}
          onRefresh={handleRefetch}
        />
      }
      contentContainerStyle={RESERVATION_LIST_CONTENT_STYLE}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <ReservationListHeader
          count={reservations.length}
          hasMore={hasNextPage}
          isUpdating={isFetching && !isFetchingNextPage}
          hasRefreshError={isError && !isFetching && !isFetchNextPageError}
        />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ReservationListFooter />
        ) : isFetchNextPageError ? (
          <ReservationListFooter
            onRetry={handleFetchNextPage}
            retrying={isFetching || isFetchingNextPage}
          />
        ) : undefined
      }
    />
  );
}

export const ReservationTabScene = memo(ReservationTabSceneContent);

function ReservationLoadingState() {
  return (
    <View className="flex-1 flex-col gap-3 overflow-hidden pb-10 pt-5">
      <ReservationListHeaderSkeleton />
      <View className="flex-row items-baseline justify-between px-0.5 pt-2">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-3.5 w-16 rounded-full" />
      </View>
      <View className="gap-2.5">
        {Array.from({ length: 5 }, (_, index) => (
          <ReservationCardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
}

function ReservationDateHeader({
  startTime,
  count,
  isFirst = false,
}: {
  startTime: string;
  count: number;
  isFirst?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <View
      className={
        isFirst
          ? "flex-row items-baseline justify-between gap-2 px-0.5 pt-1"
          : "flex-row items-baseline justify-between gap-2 px-0.5 pt-3.5"
      }
    >
      <AppText
        variant="label"
        numberOfLines={1}
        style={{ flex: 1, minWidth: 0 }}
        textStyle={{ fontWeight: "700" }}
      >
        {formatDateValue(startTime, "EEE, MMM d, yyyy")}
      </AppText>
      <AppText variant="caption" color="mutedForeground" wrap={false} numberOfLines={1}>
        {t("reservations.count", { count })}
      </AppText>
    </View>
  );
}

function ReservationListHeaderSkeleton() {
  return (
    <View className="flex-row items-center justify-between px-0.5">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="h-3.5 w-16 rounded-full" />
    </View>
  );
}

function ReservationListHeader({
  count,
  hasMore,
  isUpdating,
  hasRefreshError,
}: {
  count: number;
  hasMore: boolean;
  isUpdating: boolean;
  hasRefreshError: boolean;
}) {
  const { colors: uiColors } = useTheme();
  const { t } = useTranslation();

  return (
    <View className="flex-col gap-2 pb-2">
      <View className="flex-row items-center justify-between gap-2">
        <NativeText
          variant="label"
          style={{ flex: 1, minWidth: 0 }}
          textStyle={{ color: uiColors.foreground, fontWeight: "600" }}
        >
          {t(hasMore ? "reservations.showingCount" : "reservations.count", {
            count,
          })}
        </NativeText>

        {isUpdating ? (
          <NativeText
            variant="meta"
            wrap={false}
            textStyle={{ color: uiColors.foreground + "bf" }}
          >
            {t("reservations.updating")}
          </NativeText>
        ) : null}
      </View>

      {hasRefreshError ? (
        <NativeText variant="meta" color="mutedForeground">
          {t("common.pullToRefreshAndTryAgain")}
        </NativeText>
      ) : null}
    </View>
  );
}

function ReservationListFooter({
  onRetry,
  retrying = false,
}: {
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const { t } = useTranslation();

  if (!onRetry) {
    return (
      <View className="py-3">
        <ReservationCardSkeleton />
      </View>
    );
  }

  return (
    <View className="items-center gap-3 py-5">
      <NativeText variant="meta" color="mutedForeground" align="center">
        {t("reservations.failedMoreTitle")}
      </NativeText>
      <ActionButton
        label={t("common.refreshTryAgain")}
        appearance="outlined"
        disabled={retrying}
        loading={retrying}
        onPress={onRetry}
      />
    </View>
  );
}
