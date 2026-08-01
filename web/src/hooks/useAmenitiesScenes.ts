import { useEffect, useState } from "react";
import { getAmenities } from "@/data/offlineApi";
import { loadManifest, resolveSource } from "@/components/Panorama/assets";

type Scene = {
  id: string;
  label: string;
  imageUrl: string;
};

type Item = {
  _id: string;
  name: string;
  image: string;
};

type Category = {
  slug: string;
  items: Item[];
};

type ApiResponse = {
  categories: Category[];
};

export const useAmenitiesScenes = (slug: string) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScenes = async () => {
      try {
        // getAmenities() is typed `any` (it stands in for the old axios call),
        // so name the shape here — otherwise every callback parameter below is
        // an implicit any and the ApiResponse type sits unused.
        const res = (await getAmenities()) as { data: ApiResponse[] };

        const category = res.data[0]?.categories?.find(
          (cat: Category) => cat.slug === slug
        );

        if (!category) {
          console.warn(`${slug} category not found`);
          setScenes([]);
          return;
        }

        const formatted: Scene[] = category.items.map((item) => ({
          id: item._id,
          label: item.name,
          imageUrl: item.image.trim(),
        }));

        setScenes(formatted);

        // Preload every panorama into the browser cache so switching scenes is
        // instant (no black gap while the next texture downloads).
        //
        // Through resolveSource, not the raw path: the raw amenities panoramas
        // are superseded by optimized siblings and are therefore *not* in the
        // offline media manifest. Preloading them fetched a second ~8 MB copy
        // of every scene online, and offline every one of those requests 404'd
        // — so the preload that exists to prevent the black gap did nothing at
        // all, which is exactly the gap it was written to close.
        await loadManifest();
        formatted.forEach((s) => {
          if (!s.imageUrl) return;
          const source = resolveSource(s.imageUrl);
          for (const url of [source.preview, source.full]) {
            if (!url) continue;
            const img = new Image();
            img.src = url;
          }
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchScenes();
  }, [slug]);

  return { scenes, loading };
};