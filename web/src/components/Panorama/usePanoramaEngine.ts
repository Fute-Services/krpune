import { useEffect, useRef, useState } from "react";
import PanoramaEngine from "./PanoramaEngine";
import type { EngineOptions } from "./types";

/**
 * Create a PanoramaEngine bound to a container element.
 *
 * The engine is created once the container actually has a size. That matters
 * because both viewers mount inside a route crossfade (RootLayout stacks the
 * outgoing and incoming pages absolutely), and a WebGL canvas created at 0×0
 * ends up with a 0×0 viewport — the cause of the black-screen bug the old VR
 * page papered over with repeated forced resizes.
 */
export default function usePanoramaEngine(
    containerRef: React.RefObject<HTMLDivElement | null>,
    options: EngineOptions
) {
    const [engine, setEngine] = useState<PanoramaEngine | null>(null);
    // Options are read once at construction; keeping them in a ref avoids
    // rebuilding the whole renderer because a caller passed a new object.
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let instance: PanoramaEngine | null = null;
        let frame = 0;
        let cancelled = false;

        const tryCreate = () => {
            if (cancelled) return;
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                instance = new PanoramaEngine(container, optionsRef.current);
                setEngine(instance);
                return;
            }
            frame = requestAnimationFrame(tryCreate);
        };
        tryCreate();

        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
            instance?.dispose();
            setEngine(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return engine;
}
