import ReservationCard from "@/components/golf/ReservationCard";
import {
  CircleLoader,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { useTheme } from "@/design-system/utils/theme";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
  useMemberReservations,
} from "@/lib/hook/useReservation";
import type { MemberReservationType } from "@/service/reservation.service";
import type { MemberReservationResponse } from "@/types/member-reservation";
import { formatDateValue } from "@/utils/time-helper";
import { Button, Host } from "@expo/ui";
import {
  defaultMinSize,
  fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { FlatList, RefreshControl } from "react-native-gesture-handler";

export const RESERVATION_TABS: MemberReservationType[] = [
  "all",
  "bay",
  "private",
  "group",
  "program",
];

const reservationKeyExtractor = (item: MemberReservationResponse) =>
  `${item.reservationType}:${item.id}`;

type ReservationTabSceneProps = {
  type: MemberReservationType;
  referenceTime: number;
};

function ReservationTabSceneContent({
  type,
  referenceTime,
}: ReservationTabSceneProps) {
  const { t } = useTranslation();
  const router = useRouter();
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
  } = useMemberReservations(type);

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
    [router, runWithNavigationLock],
  );

  const renderReservationItem = useCallback(
    ({ item, index }: { item: MemberReservationResponse; index: number }) => (
      <View>
        {index === 0 || reservations[index - 1].reservationDate !== item.reservationDate ? (
          <ReservationDateHeader startTime={item.startTime}
            count={dateCounts.get(item.reservationDate) ?? 1} />
        ) : null}
        <ReservationCard
          reservation={item}
          referenceTime={referenceTime}
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
      <ReservationStateList
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
      </ReservationStateList>
    );
  }

  if (reservations.length === 0) {
    return (
      <ReservationStateList
        refreshing={isPullRefreshing}
        onRefresh={handleRefetch}
      >
        <EmptyState
          title={t("reservations.noReservationsTitle")}
          message={t("reservations.noReservationsMessage")}
          actionLabel={t("common.refresh")}
          actionPending={isRefetching}
          onAction={handleRefetch}
        />
      </ReservationStateList>
    );
  }

  return (
    <FlatList
      data={reservations}
      keyExtractor={reservationKeyExtractor}
      renderItem={renderReservationItem}
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={isPullRefreshing}
          onRefresh={handleRefetch}
        />
      }
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: 40,
      }}
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
          <ReservationListFooter onRetry={handleFetchNextPage} />
        ) : undefined
      }
    />
  );
}

export const ReservationTabScene = memo(ReservationTabSceneContent);

function ReservationLoadingState() {
  return (
    <View className="flex-col gap-3 pb-10 pt-5">
      <ReservationListHeaderSkeleton />
      <Skeleton className="h-9 w-full rounded-xl" />
      <View>
        {Array.from({ length: 3 }, (_, index) => (
          <ReservationCardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
}

function ReservationDateHeader({ startTime, count }: { startTime: string; count: number }) {
  const { t, i18n } = useTranslation();
  return (
    <View className="mb-1 mt-4 flex-row items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2.5">
      <NativeText variant="eyebrow" color="mutedForeground" numberOfLines={1}
        style={{ flex: 1, minWidth: 0 }}
        textStyle={{ letterSpacing: 0.2 }}>
        {formatDateValue(startTime, "EEE, MMM d, yyyy").toLocaleUpperCase(i18n.language)}
      </NativeText>
      <NativeText variant="meta" color="mutedForeground" wrap={false} numberOfLines={1}>
        {t("reservations.count", { count })}
      </NativeText>
    </View>
  );
}

function ReservationListHeaderSkeleton() {
  return (
    <View className="flex-row items-center justify-between">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="h-4 w-20 rounded-full" />
    </View>
  );
}

function ReservationCardSkeleton() {
  return (
    <View className="flex-row items-center gap-2.5 border-b border-border bg-card px-3 py-3">
      <View className="w-[72px] gap-2 border-r border-border pr-2">
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="h-3 w-12 rounded-full" />
      </View>
      <Skeleton className="h-10 w-10 rounded-xl" />
      <View className="min-w-0 flex-1 gap-2.5">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </View>
      <Skeleton className="h-4 w-4 rounded-full" />
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

function ReservationListFooter({ onRetry }: { onRetry?: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View className="items-center gap-3 py-5">
      {onRetry ? (
        <>
          <NativeText variant="meta" color="mutedForeground" align="center">
            {t("reservations.failedMoreTitle")}
          </NativeText>
          <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
            <Button
              variant="outlined"
              label={t("common.refreshTryAgain")}
              onPress={onRetry}
              style={getNativeButtonStyle(colors, "outlined")}
              modifiers={
                process.env.EXPO_OS === "ios"
                  ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                  : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]
              }
            />
          </Host>
        </>
      ) : (
        <CircleLoader />
      )}
    </View>
  );
}

function ReservationStateList({
  children,
  refreshing,
  onRefresh,
}: {
  children: React.ReactElement;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <FlatList
      style={{ flex: 1 }}
      data={[]}
      renderItem={() => null}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={children}
      showsVerticalScrollIndicator={false}
    />
  );
}
