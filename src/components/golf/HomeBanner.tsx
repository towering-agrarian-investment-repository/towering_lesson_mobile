import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { showAppToast } from "@/lib/toast/toast";
import type { PublishedBanner } from "@/types/banner";
import { Image } from "expo-image";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, FlatList, Linking, Pressable, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

const BANNER_ASPECT_RATIO = 993 / 250;
const AUTO_ROTATE_MS = 5000;
const EMPTY_BANNERS: PublishedBanner[] = [];
const bannerKeyExtractor = (banner: PublishedBanner) => String(banner.id);

const BannerSlide = memo(function BannerSlide({
    banner,
    width,
    disabled,
    reducedMotion,
    onOpen,
    onImageError,
}: {
    banner: PublishedBanner;
    width: number;
    disabled: boolean;
    reducedMotion: boolean;
    onOpen: (targetUrl: string | null) => void;
    onImageError: (imageUrl: string) => void;
}) {
    const imageUrl = banner.imageUrl || banner.imageExternalUrl;
    if (!imageUrl) return null;

    const image = (
        <Image
            source={{ uri: imageUrl }}
            cachePolicy="memory-disk"
            recyclingKey={imageUrl}
            contentFit="cover"
            transition={reducedMotion ? 0 : 150}
            className="bg-muted"
            style={{
                width: "100%",
                height: "100%",
                borderRadius: 16,
                borderCurve: "continuous",
            }}
            onError={() => onImageError(imageUrl)}
            accessibilityLabel={banner.title}
        />
    );

    return (
        <View style={{ width: width || "100%", height: "100%" }}>
            {banner.targetUrl ? (
                <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={banner.title}
                    disabled={disabled}
                    className="active:opacity-85 disabled:opacity-60"
                    style={{ flex: 1 }}
                    onPress={() => onOpen(banner.targetUrl)}
                >
                    {image}
                </Pressable>
            ) : (
                image
            )}
        </View>
    );
});

export function HomeBanner({ banners = EMPTY_BANNERS }: { banners?: PublishedBanner[] }) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const router = useRouter();
    const { isLocked, runWithNavigationLock, unlock } = useNavigationLock();
    const listRef = useRef<FlatList<PublishedBanner>>(null);
    const [width, setWidth] = useState(0);
    const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);
    const indexRef = useRef(0);

    const items = useMemo(
        () =>
            [...banners]
                .filter((banner) => {
                    const imageUrl = banner.imageUrl || banner.imageExternalUrl;
                    return imageUrl ? !failedImageUrls.includes(imageUrl) : false;
                })
                .sort((a, b) => a.displayOrder - b.displayOrder),
        [banners, failedImageUrls],
    );

    useEffect(() => {
        indexRef.current = 0;
        listRef.current?.scrollToIndex({ index: 0, animated: false });
    }, [items.length]);

    useFocusEffect(
        useCallback(() => {
            if (reducedMotion || items.length < 2 || width === 0) return;

            let timer: ReturnType<typeof setInterval> | undefined;
            const stop = () => {
                if (timer !== undefined) clearInterval(timer);
                timer = undefined;
            };
            const syncTimer = () => {
                stop();
                if (AppState.currentState !== "active") return;
                timer = setInterval(() => {
                    const next = (indexRef.current + 1) % items.length;
                    indexRef.current = next;
                    listRef.current?.scrollToIndex({ index: next, animated: true });
                }, AUTO_ROTATE_MS);
            };
            syncTimer();
            const subscription = AppState.addEventListener("change", syncTimer);

            return () => {
                stop();
                subscription.remove();
            };
        }, [items.length, reducedMotion, width]),
    );

    const openBanner = useCallback(
        (targetUrl: string | null) => {
            if (!targetUrl) return;

            runWithNavigationLock(() => {
                if (/^https?:\/\//i.test(targetUrl)) {
                    void Linking.openURL(targetUrl)
                        .catch(() => {
                            showAppToast({
                                message: t("common.unableToOpenLink", {
                                    defaultValue: "Unable to open this link.",
                                }),
                                type: "error",
                            });
                        })
                        .finally(unlock);
                    return;
                }

                router.push(targetUrl as Href);
            });
        },
        [router, runWithNavigationLock, t, unlock],
    );

    const handleImageError = useCallback((imageUrl: string) => {
        setFailedImageUrls((previous) =>
            previous.includes(imageUrl) ? previous : [...previous, imageUrl],
        );
    }, []);

    const getItemLayout = useCallback(
        (_: ArrayLike<PublishedBanner> | null | undefined, itemIndex: number) => ({
            length: width,
            offset: width * itemIndex,
            index: itemIndex,
        }),
        [width],
    );

    const renderBannerItem = useCallback(
        ({ item }: { item: PublishedBanner }) => (
            <BannerSlide
                banner={item}
                width={width}
                disabled={isLocked}
                reducedMotion={reducedMotion}
                onOpen={openBanner}
                onImageError={handleImageError}
            />
        ),
        [handleImageError, isLocked, openBanner, reducedMotion, width],
    );

    const extraData = useMemo(
        () => ({ width, isLocked }),
        [isLocked, width],
    );

    if (items.length === 0) return null;

    return (
        <View
            className="self-stretch"
            style={{ aspectRatio: BANNER_ASPECT_RATIO }}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        >
            <FlatList
                ref={listRef}
                data={items}
                style={{ flex: 1 }}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                keyExtractor={bannerKeyExtractor}
                extraData={extraData}
                getItemLayout={getItemLayout}
                renderItem={renderBannerItem}
                onMomentumScrollEnd={(event) => {
                    if (width > 0) {
                        indexRef.current = Math.round(
                            event.nativeEvent.contentOffset.x / width,
                        );
                    }
                }}
            />
        </View>
    );
}
