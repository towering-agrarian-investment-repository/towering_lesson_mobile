import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { showAppToast } from "@/lib/toast/toast";
import type { PublishedBanner } from "@/types/banner";
import { Image } from "expo-image";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, FlatList, Linking, Pressable, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

const BANNER_ASPECT_RATIO = 993 / 250;
const AUTO_ROTATE_MS = 5000;
const EMPTY_BANNERS: PublishedBanner[] = [];

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
        () => [...banners]
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

    useFocusEffect(useCallback(() => {
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
    }, [items.length, reducedMotion, width]));

    const openBanner = (targetUrl: string | null) => {
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
    };

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
                keyExtractor={(banner) => String(banner.id)}
                extraData={width}
                getItemLayout={(_, itemIndex) => ({
                    length: width,
                    offset: width * itemIndex,
                    index: itemIndex,
                })}
                renderItem={({ item: banner }) => {
                    const imageUrl = banner.imageUrl || banner.imageExternalUrl;
                    if (!imageUrl) return null;

                    const image = (
                        <Image
                            source={{ uri: imageUrl }}
                            contentFit="cover"
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: 16,
                                borderCurve: "continuous",
                            }}
                            onError={() => setFailedImageUrls((previous) =>
                                previous.includes(imageUrl) ? previous : [...previous, imageUrl]
                            )}
                            accessibilityLabel={banner.title}
                        />
                    );

                    return (
                        <View style={{ width: width || "100%", height: "100%" }}>
                            {banner.targetUrl ? (
                                <Pressable
                                    accessibilityRole="link"
                                    accessibilityLabel={banner.title}
                                    disabled={isLocked}
                                    className="active:opacity-85 disabled:opacity-60"
                                    style={{ flex: 1 }}
                                    onPress={() => openBanner(banner.targetUrl)}
                                >
                                    {image}
                                </Pressable>
                            ) : (
                                image
                            )}
                        </View>
                    );
                }}
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
