import React, { useState, useRef, useEffect } from "react";
// 1. Updated import to point to a video file
import droneVideo from "../../assets/Location_Video.mp4";
import highlightImg from "../../assets/location-logo.png";

type MapProps = {
  activeFilter?: string;
};

// 1. Updated Type to support responsive coordinates
type ResponsiveCoord = {
  base: string; // Mobile
  md: string;   // Tablet
  lg: string;   // Desktop
};

type BoxDirType = "left" | "right" | "center";

type Marker = {
  top: ResponsiveCoord;
  left: ResponsiveCoord;
  label: string;
  direction?: "up" | "down" | "left" | "right";
  // Allow boxDirection to be responsive
  boxDirection?: BoxDirType | { base: BoxDirType; md: BoxDirType; lg: BoxDirType };
  image?: string;
};

export default function MapBoxMap({ activeFilter }: MapProps) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const filter = activeFilter || "Social Infra";

  const [minZoom, setMinZoom] = useState(1);
  // Track screen size for responsive box direction
  const [screenSize, setScreenSize] = useState<"base" | "md" | "lg">("lg");

  useEffect(() => {
    const calculateMinZoom = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Fitting logic to ensure image doesn't zoom out past its boundaries
      const imageAspectRatio = 1.33; 
      let calculatedMin;
      if (containerWidth / containerHeight > imageAspectRatio) {
        calculatedMin = containerHeight / (containerWidth / imageAspectRatio);
      } else {
        calculatedMin = containerWidth / (containerHeight * imageAspectRatio);
      }
      
      const finalMin = Math.max(calculatedMin, 1);
      setMinZoom(finalMin);
      setZoom(finalMin);

      // Update screen size state
      if (window.innerWidth < 768) {
        setScreenSize("base");
      } else if (window.innerWidth < 1024) {
        setScreenSize("md");
      } else {
        setScreenSize("lg");
      }
    };

    calculateMinZoom();
    window.addEventListener('resize', calculateMinZoom);
    return () => window.removeEventListener('resize', calculateMinZoom);
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, minZoom));
  const handleReset = () => setZoom(minZoom);

  // 2. Data Array with responsive coordinates for every marker
  const data: Record<string, Marker[]> = {
    "Social Infra": [
      { top: { base: "50%", md: "50%", lg: "50%" }, left: { base: "60%", md: "56%", lg: "53%" }, label: "Raheja IT Park", direction: "up", boxDirection: "center", image: highlightImg },
      { top: { base: "23%", md: "23%", lg: "17%" }, left: { base: "55%", md: "55%", lg: "55%" }, label: "Manipal Hospital - 06 Mins", direction: "down", boxDirection: "center" },
      { top: { base: "38%", md: "40%", lg: "30%" }, left: { base: "135%", md: "125%", lg: "115%" }, label: "Westend Mall - 17 Mins", direction: "left", boxDirection: "right" },
      { top: { base: "8%", md: "8%", lg: "8%" }, left: { base: "1%", md: "1%", lg: "1%" }, label: "Radisson Blu - 18 Mins", direction: "right", boxDirection: "left" },
      { top: { base: "86%", md: "86%", lg: "86%" }, left: { base: "1%", md: "1%", lg: "23%" }, label: "Orchid International School - 08 Mins", direction: "right", boxDirection: "left" },
      { top: { base: "8%", md: "8%", lg: "8%" }, left: { base: "45%", md: "30%", lg: "30%" }, label: "Tip Top Hotel - 07 Mins", direction: "right", boxDirection: "left" },
      { top: { base: "85%", md: "75%", lg: "90%" }, left: { base: "150%", md: "135%", lg: "120%" }, label: "MIT World Peace University  - 25 Mins", direction: "left", boxDirection: "right" },
      { top: { base: "19%", md: "24%", lg: "17%" }, left: { base: "60%", md: "22%", lg: "34%" }, label: "Puraniks Aldea Espanola - 05 Mins", direction: "down", boxDirection: { base: "left", md: "center", lg: "center" } },
    ],
    "Transport Infra": [
      { top: { base: "50%", md: "50%", lg: "50%" }, left: { base: "60%", md: "56%", lg: "53%" }, label: "Raheja IT Park", direction: "up", boxDirection: "center", image: highlightImg },
      
      { top: { base: "36%", md: "65%", lg: "80%" }, left: { base: "50%", md: "75%", lg: "66%" }, label: "Mumbai - Bangalore Highway - 02 Mins", direction: "up", boxDirection: "center" },
      { top: { base: "21%", md: "25%", lg: "20%" }, left: { base: "148%", md: "130%", lg: "118%" }, label: "Dapodi Metro Station - 18 Mins", direction: "left", boxDirection: "right" },
      
      { top: { base: "60%", md: "35%", lg: "45%" }, left: { base: "153%", md: "135%", lg: "120%" }, label: "Pune International Airport - 40 Mins", direction: "left", boxDirection: "right" },
      { top: { base: "8%", md: "8%", lg: "8%" }, left: { base: "1%", md: "1%", lg: "1%" }, label: "Navi Mumbai Airport - 1 hr 51 Mins", direction: "right", boxDirection: "left" },
    ],
  };

  const activeMarkers = data[filter] || [];

  return (
    <div ref={containerRef} className="relative w-full h-[100dvh] overflow-hidden bg-black">
      
      {/* MAP WRAPPER */}
      <div 
        ref={mapRef}
        className="w-full h-full transition-transform duration-300 ease-out origin-center"
        style={{ transform: `scale(${zoom})` }}
      >
        {/* 2. Replaced img with auto-playing video */}
        <video
          src={droneVideo}
          className="w-full h-full object-cover"
          autoPlay 
          loop 
          muted 
          playsInline 
        />

        {activeMarkers.map((item, index) => {
          const dir = item.direction || "up";
          // Evaluate box direction based on current screen size
          const rawBoxDir = item.boxDirection || "right";
          const boxDir = typeof rawBoxDir === "object" ? rawBoxDir[screenSize] : rawBoxDir;

          return (
            <div
              key={`${filter}-${index}`}
              // 3. Tailwind responsive classes reading the CSS variables
              className="absolute top-[var(--top-base)] md:top-[var(--top-md)] lg:top-[var(--top-lg)] left-[var(--left-base)] md:left-[var(--left-md)] lg:left-[var(--left-lg)]"
              style={{
                // 4. Injecting the coordinates
                "--top-base": item.top.base,
                "--top-md": item.top.md,
                "--top-lg": item.top.lg,
                "--left-base": item.left.base,
                "--left-md": item.left.md,
                "--left-lg": item.left.lg,
                animation: `fade-${dir} 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                animationDelay: `${index * 300}ms`,
              } as React.CSSProperties}
            >
              {boxDir === "center" && (
                <div className={`absolute flex ${dir === "up" || dir === "down" ? "flex-col items-center -translate-x-1/2" : "flex-row items-center -translate-y-1/2"} ${dir === "up" ? "-translate-y-full" : dir === "left" ? "-translate-x-full" : ""}`}>
                  
                  {/* UP DIRECTION */}
                  {dir === "up" && (
                    <>
                      {item.image ? (
                        <img 
                          src={item.image} 
                          className="mb-1 md:mb-1.5 lg:mb-2 object-contain block h-[40px] md:h-[55px] lg:h-[70px] w-auto max-w-[80px] md:max-w-[100px] lg:max-w-[120px]" 
                          alt="location marker"
                        />
                      ) : (
                        <Label text={item.label} boxDirection="center" />
                      )}
                      <Line /><Dot />
                    </>
                  )}

                  {/* DOWN DIRECTION */}
                  {dir === "down" && (
                    <>
                      <Dot /><Line />
                      {item.image ? (
                        <img 
                          src={item.image} 
                          className="mt-1 md:mt-1.5 lg:mt-2 object-contain block h-[40px] md:h-[55px] lg:h-[70px] w-auto max-w-[80px] md:max-w-[100px] lg:max-w-[120px]" 
                          alt="location marker"
                        />
                      ) : (
                        <Label text={item.label} boxDirection="center" />
                      )}
                    </>
                  )}

                  {/* LEFT DIRECTION */}
                  {dir === "left" && (
                    <>
                      {item.image ? (
                        <img 
                          src={item.image} 
                          className="mr-1 md:mr-1.5 lg:mr-2 object-contain block h-[40px] md:h-[55px] lg:h-[70px] w-auto max-w-[80px] md:max-w-[100px] lg:max-w-[120px]" 
                          alt="location marker"
                        />
                      ) : (
                        <Label text={item.label} boxDirection="center" />
                      )}
                      <Line horizontal /><Dot />
                    </>
                  )}

                  {/* RIGHT DIRECTION */}
                  {dir === "right" && (
                    <>
                      <Dot /><Line horizontal />
                      {item.image ? (
                        <img 
                          src={item.image} 
                          className="ml-1 md:ml-1.5 lg:ml-2 object-contain block h-[40px] md:h-[55px] lg:h-[70px] w-auto max-w-[80px] md:max-w-[100px] lg:max-w-[120px]" 
                          alt="location marker"
                        />
                      ) : (
                        <Label text={item.label} boxDirection="center" />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Text Labels handling for non-center box directions */}
              {dir === "up" && (
                <div className="flex flex-col items-center -translate-x-1/2 -translate-y-full">
                  {boxDir !== "center" && <Label text={item.label} boxDirection={boxDir} />}
                  {boxDir !== "center" && <><Line /><Dot /></>}
                </div>
              )}
              {dir === "down" && (
                <div className="flex flex-col items-center -translate-x-1/2">
                  {boxDir !== "center" && <><Dot /><Line /></>}
                  {boxDir !== "center" && <Label text={item.label} boxDirection={boxDir} />}
                </div>
              )}
              {dir === "left" && (
                <div className="flex items-center -translate-y-1/2 -translate-x-full">
                  {boxDir !== "center" && <Label text={item.label} boxDirection={boxDir} />}
                  {boxDir !== "center" && <><Line horizontal /><Dot /></>}
                </div>
              )}
              {dir === "right" && (
                <div className="flex items-center -translate-y-1/2">
                  {boxDir !== "center" && <><Dot /><Line horizontal /></>}
                  {boxDir !== "center" && <Label text={item.label} boxDirection={boxDir} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* STYLED ZOOM CONTROLS */}
      <div className="absolute bottom-[160px] md:bottom-[160px] lg:bottom-12 left-8 md:left-12 lg:left-20 z-50 flex flex-col lg:flex-row gap-2 md:gap-3 lg:gap-4 items-center">
  {/* Zoom Controls Container */}
  <div 
    className="flex flex-col lg:flex-row gap-1 md:gap-1.5 p-1 rounded-full border border-black shadow-lg"
    style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)" }}
  >
    <button 
      onClick={handleZoomIn}
      className="flex items-center justify-center px-4 md:px-5 lg:px-6 py-2 lg:py-3 rounded-full text-white font-medium text-base lg:text-lg border border-black/40 transition-all hover:scale-105 active:scale-95"
      style={{ background: "linear-gradient(164deg, #105CA847 28%, rgba(6,36,66,0.55) 100%)" }}
    >
      +
    </button>
    <button 
      onClick={handleZoomOut}
      className="flex items-center justify-center px-4 md:px-5 lg:px-6 py-2 lg:py-3 rounded-full text-white/90 font-medium text-base lg:text-lg border border-black/40 transition-all hover:scale-105 active:scale-95"
      style={{ background: "linear-gradient(164deg, #105CA847 28%, rgba(6,36,66,0.55) 100%)" }}
    >
      -
    </button>
  </div>
  
  {/* Reset Button */}
  <button 
    onClick={handleReset}
    className="px-4 md:px-5 lg:px-6 py-2 lg:py-3 text-white font-medium text-xs md:text-sm rounded-full border border-black/40 transition-all hover:scale-105 active:scale-95 shadow-lg"
    style={{ 
      background: "linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)",
      backdropFilter: "blur(4px)" 
    }}
  >
    Reset
  </button>
</div>

      <style>
        {`
          @keyframes fade-up {
            0% { opacity: 0; transform: translate(-50%, -100%) translateY(-20px); }
            100% { opacity: 1; transform: translate(-50%, -100%) translateY(0); }
          }
          @keyframes fade-down {
            0% { opacity: 0; transform: translate(-50%, 0%) translateY(20px); }
            100% { opacity: 1; transform: translate(-50%, 0%) translateY(0); }
          }
          @keyframes fade-left {
            0% { opacity: 0; transform: translate(-100%, -50%) translateX(-20px); }
            100% { opacity: 1; transform: translate(-100%, -50%) translateX(0); }
          }
          @keyframes fade-right {
            0% { opacity: 0; transform: translate(0%, -50%) translateX(20px); }
            100% { opacity: 1; transform: translate(0%, -50%) translateX(0); }
          }
        `}
      </style>
    </div>
  );
}

function Label({ text, boxDirection }: { text: string; boxDirection: string }) {
  return (
    <div
      className="text-white text-[10px] md:text-[12px] lg:text-[14px] tracking-[0.08em] px-3 md:px-4 lg:px-5 py-1 md:py-1.5 lg:py-2 bg-black/60 backdrop-blur-md border border-white/80 shadow-lg whitespace-nowrap rounded-md"
      style={{
        clipPath: boxDirection === "left" ? "polygon(8% 0, 100% 0, 100% 100%, 8% 100%, 0 50%)" : boxDirection === "right" ? "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)" : "none",
      }}
    >
      {text}
    </div>
  );
}

function Line({ horizontal }: { horizontal?: boolean }) {
  return horizontal ? <div className="w-4 md:w-6 lg:w-8 h-[1px] bg-white/90"></div> : <div className="w-[1px] h-4 md:h-6 lg:h-8 bg-white/90"></div>;
}

function Dot() {
  return <div className="w-[6px] md:w-[8px] lg:w-[10px] h-[6px] md:h-[8px] lg:h-[10px] rounded-full bg-white border border-black shadow"></div>;
}