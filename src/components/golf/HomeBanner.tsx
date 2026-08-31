import bannerFallback from "@/assets/images/banner.png";
import type { PublishedBanner } from "@/types/banner";
import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Linking, Pressable, View } from "react-native";

const BANNER_ASPECT_RATIO = 993 / 250;
const AUTO_ROTATE_MS = 5000;

export function HomeBanner({ banners = [] }: { banners?: PublishedBanner[] }) {
    const router = useRouter();
    const listRef = useRef<FlatList<PublishedBanner>>(null);
    const [width, setWidth] = useState(0);
    const [, setIndex] = useState(0);

    const items = useMemo(() => {
        const ordered = [...banners].sort((a, b) => a.displayOrder - b.displayOrder);

        return ordered.length > 0
            ? ordered
            : [{ id: 0, title: "Banner", targetUrl: null } as PublishedBanner];
    }, [banners]);

    useEffect(() => {
        if (__DEV__) {
            console.log("[HomeBanner] image URLs:", items.map((banner) => ({
                id: banner.id,
                imageUrl: banner.imageUrl,
            })));
        }
    }, [items]);

    useEffect(() => {
        setIndex(0);
        listRef.current?.scrollToIndex({ index: 0, animated: false });
    }, [items.length]);

    useEffect(() => {
        if (items.length < 2 || width === 0) return;

        const timer = setInterval(() => {
            setIndex((current) => {
                const next = (current + 1) % items.length;
                listRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, AUTO_ROTATE_MS);

        return () => clearInterval(timer);
    }, [items.length, width]);

    const openBanner = (targetUrl: string | null) => {
        if (!targetUrl) return;
        if (/^https?:\/\//i.test(targetUrl)) void Linking.openURL(targetUrl);
        else router.push(targetUrl as Href);
    };

    if (items.length === 0) return null;

    return (
        <View
            className="self-stretch gap-3"
            style={{ marginHorizontal: -20 }}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        >
            <FlatList
                ref={listRef}
                data={items}
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
                    const imageUrl = banner.isActive ? banner.imageUrl : null;
                    const image = (
                        <Image
                            source={imageUrl ? { uri: imageUrl } : bannerFallback}
                            contentFit="contain"
                            style={{ width: "100%", aspectRatio: BANNER_ASPECT_RATIO }}
                            accessibilityLabel={banner.title || "Banner"}
                        />
                    );

                    return (
                        <View style={{ width: width || "100%" }}>
                            {banner.targetUrl ? (
                                <Pressable
                                    accessibilityRole="link"
                                    accessibilityLabel={banner.title || "Banner"}
                                    className="active:opacity-85"
                                    onPress={() => openBanner(banner.targetUrl)}
                                >
                                    {image}
                                </Pressable>
                            ) : image}
                        </View>
                    );
                }}
                onMomentumScrollEnd={(event) => {
                    if (width > 0) setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
                }}
            />

        </View>
    );
}
