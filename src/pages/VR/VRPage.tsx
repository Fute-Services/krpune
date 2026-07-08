import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import backImg from "../../assets/back.png";
import { getVrTour } from "@/data/offlineApi";

declare global {
    interface Window {
        pannellum: any;
    }
}

export default function Vr() {
    const navigate = useNavigate();
    const viewerRef = useRef<any>(null);

    const [scenes, setScenes] = useState<any>({});
    const [currentScene, setCurrentScene] = useState<string>("");
    const [error, setError] = useState(false);

    // 🔥 Fetch API + preload every panorama so scene switches are instant (no black)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getVrTour();

                setScenes(data.scenes);
                setCurrentScene(data.default.firstScene);

                // Preload all panorama images into the browser cache in the
                // background. Once cached, pannellum's crossfade is instant and
                // never shows a black frame between scenes.
                Object.keys(data.scenes).forEach((key) => {
                    const s = data.scenes[key];
                    if (s?.panorama) {
                        const img = new Image();
                        img.src = import.meta.env.BASE_URL + s.panorama;
                    }
                });
            } catch (err) {
                console.error(err);
                setError(true);
            }
        };

        fetchData();
    }, []);

    // ✅ Custom Arrow
    const createCustomHotspot = (div: any, h: any) => {
        div.classList.add("custom-hotspot-main");

        const img = document.createElement("img");
        img.src = import.meta.env.BASE_URL + "VR/arrowfinal.png";
        img.className = "custom-arrow-asset";

        const angle = h.createTooltipArgs?.rotation || 0;
        img.style.transform = `rotate(${angle}deg)`;

        const span = document.createElement("span");
        span.innerHTML = h.createTooltipArgs?.text || "";
        span.className = "hotspot-label";

        div.appendChild(img);
        div.appendChild(span);

        img.onclick = () => {
            // pannellum crossfades between scenes via `sceneFadeDuration` below,
            // so no manual overlay is needed.
            viewerRef.current?.loadScene(h.createTooltipArgs.next);
            setCurrentScene(h.createTooltipArgs.next);
        };
    };

    // 🔥 INIT VIEWER ONCE ONLY
    useEffect(() => {
        let intervalId: any;

        const checkAndInit = () => {
            if (window.pannellum && currentScene && !viewerRef.current) {
                const scene = scenes[currentScene];
                if (!scene) return;

                viewerRef.current = window.pannellum.viewer("pan-container", {
                    // Smooth 1s crossfade on load + every scene switch → no black flash
                    sceneFadeDuration: 1000,
                    default: {
                        firstScene: currentScene,
                        autoLoad: true,
                        autoRotate: -5,
                        autoRotateInactivityDelay: 1000,
                        showControls: false,
                    },

                    scenes: Object.keys(scenes).reduce((acc: any, key) => {
                        const s = scenes[key];

                        acc[key] = {
                            panorama: import.meta.env.BASE_URL + s.panorama,
                            yaw: s.yaw || 0,
                            pitch: s.pitch || 0,
                            hotSpots: s.hotSpots?.map((h: any) => ({
                                pitch: h.pitch,
                                yaw: h.yaw,
                                type: "custom",
                                createTooltipFunc: (div: any) =>
                                    createCustomHotspot(div, h),
                            })),
                        };

                        return acc;
                    }, {}),
                });

                viewerRef.current.on("error", () => setError(true));

                if (intervalId) clearInterval(intervalId);
            }
        };

        checkAndInit();

        if (!viewerRef.current && currentScene) {
            intervalId = setInterval(checkAndInit, 100);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [scenes, currentScene]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (viewerRef.current) {
                try {
                    viewerRef.current.destroy();
                } catch (e) {
                    console.error("Error destroying viewer:", e);
                }
                viewerRef.current = null;
            }
        };
    }, []);

    // 🔍 Controls
    const zoomIn = () => {
        viewerRef.current?.setHfov(viewerRef.current.getHfov() - 10);
    };

    const zoomOut = () => {
        viewerRef.current?.setHfov(viewerRef.current.getHfov() + 10);
    };

    const getName = (id: string) => {
        const map: any = {
            entrygate: "GROUND LEVEL",
            dropoff: "DROP OFF",
            reception: "RECEPTION",
            cafeteria:"CAFETERIA",
            liftlobby: "LIFT LOBBY",
            podium1: "PODIUM 1",
            podium2: "PODIUM 2",
            terrace: "MULTIPURPOSE COURT",
            terrace1: "TERRACE AMENITIES",
            terrace2: "FOOD COURT",
            terrace_sports: "SPORTS ZONE",
            retail: "RETAIL ZONE",
        };
        return map[id] || id;
    };

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden">

            <style>{`
                /* ── Hotspot container ── */
                .custom-hotspot-main {
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    pointer-events: auto !important;
                }

                /* ── Arrow — Desktop ── */
                .custom-arrow-asset {
                    width: 90px !important;
                    height: 90px !important;
                    min-width: 90px !important;
                    min-height: 90px !important;
                    cursor: pointer !important;
                    display: block !important;
                    transition: transform 0.3s ease !important, opacity 0.2s ease !important;
                    opacity: 0.6;
                    user-select: none !important;
                    -webkit-user-drag: none !important;
                }
                .custom-arrow-asset:hover { opacity: 1; }

                /* ── Arrow — Mobile ── */
                @media (max-width: 768px) {
                    .custom-arrow-asset {
                        width: 30px !important;
                        height: 30px !important;
                        min-width: 30px !important;
                        min-height: 30px !important;
                    }
                }

                /* ── Hotspot label ── */
                .hotspot-label {
                    visibility: hidden;
                    position: absolute;
                    bottom: 100px;
                    background: rgba(0,0,0,0.85);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    white-space: nowrap;
                    font-weight: bold;
                    border: 1px solid rgba(255,255,255,0.2);
                    pointer-events: none;
                }
                @media (max-width: 768px) {
                    .hotspot-label {
                        font-size: 11px;
                        padding: 5px 10px;
                        bottom: 60px;
                    }
                }
                .custom-hotspot-main:hover .hotspot-label { visibility: visible; }

                /* ── Pannellum overrides ── */
                .pnlm-hotspot-base { background: none !important; }
                .pnlm-load-box, .pnlm-loading { display: none !important; }
            `}</style>

            {/* 🔙 Back Button */}
             <button
                            className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 lg:top-[24px] lg:left-[24px] xl:top-[30px] xl:left-[40px] w-[38px] h-[38px] sm:w-11 sm:h-11 lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px] rounded-[30%] bg-white/95 backdrop-blur-md border border-white/20 flex items-center justify-center z-20 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                            onClick={() => navigate(-1)}
                        >
                            <img src={backImg} alt="Back" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
                        </button>

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black">
                    <div className="text-white text-xl mb-4">Unable to load Virtual Tour</div>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* 🎥 Viewer */}
            <div id="pan-container" className="w-full h-full"></div>

            {/* 🔍 Zoom Controls */}
            <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 md:gap-4">
                <button
                    onClick={zoomIn}
                    className="
                        w-9 h-9 md:w-12 md:h-12
                        bg-white/10 backdrop-blur-md border border-white/20 rounded-full
                        text-white text-lg md:text-2xl
                        flex items-center justify-center
                        hover:bg-white hover:text-black transition-all shadow-lg
                    "
                >+</button>
                <button
                    onClick={zoomOut}
                    className="
                        w-9 h-9 md:w-12 md:h-12
                        bg-white/10 backdrop-blur-md border border-white/20 rounded-full
                        text-white text-lg md:text-2xl
                        flex items-center justify-center
                        hover:bg-white hover:text-black transition-all shadow-lg
                    "
                >−</button>
            </div>

            {/* 📍 Scene Name Badge */}
            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-black/70 text-white px-5 py-2 md:px-8 md:py-3 rounded-full text-xs md:text-sm tracking-wide">
                    {getName(currentScene)}
                </div>
            </div>
        </div>
    );
}