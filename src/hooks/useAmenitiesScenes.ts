import { useEffect, useState } from "react";
import { getAmenities } from "@/data/offlineApi";

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
        const res = await getAmenities();

        const category = res.data[0]?.categories?.find(
          (cat) => cat.slug === slug
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
        formatted.forEach((s) => {
          if (s.imageUrl) {
            const img = new Image();
            img.src = s.imageUrl;
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