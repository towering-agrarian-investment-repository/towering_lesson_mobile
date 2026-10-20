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
import { useNetworkStatus } from "@/lib/hook/useNetworkStatus";
import {
  getMemberReservationDetailQueryOptions,
  useMemberReservations,
} from "@/lib/hook/useReservation";
import type { MemberReservationType } from "@/service/reservation.service";
import type { MemberReservationResponse } from "@/types/member-reservation";
import { Button, Host } from "@expo/ui";
import {
  defaultMinSize,
  fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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

export function ReservationTabScene({
  type,
  referenceTime,
}: ReservationTabSceneProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLocked, runWithNavigationLock } = useNavigationLock();
  const { isOnline } = useNetworkStatus();
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

  const renderReservationItem = useCallback(
    ({ item }: { item: MemberReservationResponse }) => (
      <ReservationCard
        reservation={item}
        referenceTime={referenceTime}
        disabled={isLocked}
        onPress={handleReservationPress}
      />
    ),
    [handleReservationPress, isLocked, referenceTime],
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
          title={
            isOnline === false
              ? t("common.offlineTitle")
              : t("reservations.failedListTitle")
          }
          message={
            isOnline === false
              ? t("common.offlineMessage")
              : t("common.pullToRefreshAndTryAgain")
          }
          actionLabel={
            isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")
          }
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
      ItemSeparatorComponent={ReservationItemSeparator}
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

function ReservationLoadingState() {
  return (
    <View className="flex-col gap-4 pb-10 pt-5">
      <ReservationListHeaderSkeleton />

      <View className="flex-col gap-5">
        {Array.from({ length: 3 }, (_, index) => (
          <ReservationCardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
}

function ReservationItemSeparator() {
  return <View className="h-5" />;
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
    <View className="overflow-hidden rounded-xl border border-border bg-card p-4">
      <View className="flex-col gap-4">
        <View className="flex-row items-center gap-3">
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="h-5 flex-1 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </View>

        <Skeleton className="h-px w-full rounded-none" />

        <View className="flex-row items-center gap-3">
          <View className="h-[82px] w-[72px] flex-col gap-3 rounded-lg bg-muted px-3 py-3">
            <Skeleton className="h-4 w-8 rounded-full" />
            <Skeleton className="h-8 w-12 rounded-full" />
          </View>

          <View className="flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </View>

          <Skeleton className="h-5 w-4 rounded-full" />
        </View>
      </View>
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
    <View className="flex-col gap-2 pb-4">
      <View className="flex-row items-center justify-between gap-2">
        <NativeText
          variant="count"
          style={{ flex: 1, minWidth: 0 }}
          textStyle={{ color: uiColors.foreground + "bf" }}
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
