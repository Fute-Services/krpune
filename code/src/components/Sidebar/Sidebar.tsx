import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import HomeIcon from "../../assets/home-icon.png";
import LocationIcon from "../../assets/location.png";
import AmenitiesIcon from "../../assets/sparkling.png";
import ProjectIcon from "../../assets/project details.png"
import VrIcon from "../../assets/vr mode.png";

const navItems = [
  { path: "/", icon: HomeIcon, label: "Project Overview" },
  { path: "/location", icon: LocationIcon, label: "Location" },
  { path: "/amenities", icon: AmenitiesIcon, label: "Amenities" },
  { path: "/project_details", icon: ProjectIcon, label: "Inventory" },
  { path: "/vr", icon: VrIcon, label: "VR" },
];

// Labels that need a line break on small screens
const BREAK_LABELS = ["Project Overview", "Project Details"];

// White icon filter — desktop மற்றும் mobile இரண்டுக்கும் same
const WHITE_ICON_FILTER =
  "brightness(0) invert(1)";

export default function Sidebar() {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // ── Screen size detection ──────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsMobile(w < 640);
      setIsTablet(w >= 640 && w < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

// Sidebar now visible on VR page - hiding disabled

  const isSmallScreen = isMobile || isTablet;

  // ── Active index ───────────────────────────────────────────────────────────
  const activeIndex = navItems.findIndex((item) =>
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.path)
  );

  const displayIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;

  // Helper — render label with line break if needed
  const renderLabel = (label: string) => {
    if (BREAK_LABELS.includes(label)) {
      const [first, ...rest] = label.split(" ");
      return (
        <>
          {first}
          <br />
          {rest.join(" ")}
        </>
      );
    }
    return label;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE / TABLET  →  Bottom Navigation Bar
  // ─────────────────────────────────────────────────────────────────────────
  if (isSmallScreen) {
    const barH  = isMobile ? 64  : 72;
    const pillH = isMobile ? 52  : 60;
    const pillW = isMobile ? 58  : 68;

    return (
      <div
        style={{
          position: "fixed",
          bottom: isMobile ? "14px" : "18px",
          left: "50%",
          transform: "translateX(-50%)",
          width: isMobile ? "calc(100vw - 28px)" : "calc(100vw - 60px)",
          maxWidth: isMobile ? "380px" : "520px",
          height: `${barH}px`,
          borderRadius: "20px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-evenly",
          padding: "0 6px",
          background: "linear-gradient(164deg, #105CA847 28%, rgba(6,36,66,0.55) 100%)",
          border: "2px solid rgba(255,255,255,0.25)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Glass reflection top */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "40%",
            borderRadius: "20px",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)",
            pointerEvents: "none",
          }}
        />

        {navItems.map((item, index) => {
          const isActive = index === displayIndex;
          return (
            <NavLink
              key={index}
              to={item.path}
              end={item.path === "/"}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={() => setHoveredIndex(index)}
              onTouchEnd={() => setHoveredIndex(null)}
              style={{
                position: "relative",
                zIndex: 1,
                flex: "1 1 0",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                textDecoration: "none",
              }}
            >
              {/* Active pill */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: `${pillW}px`,
                    height: `${pillH}px`,
                    borderRadius: "14px",
                    background: "linear-gradient(153deg, #407BB6 0%, #76ACE2 100%)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    zIndex: -1,
                  }}
                />
              )}

              {/* ✅ WHITE FILTER — இங்கே fix பண்ணினோம் */}
              <img
                src={item.icon}
                alt={item.label}
                style={{
                  width: isMobile ? "20px" : "22px",
                  height: isMobile ? "20px" : "22px",
                  transition: "transform 0.3s",
                  transform: isActive ? "scale(1.12)" : "scale(1)",
                  filter: WHITE_ICON_FILTER,   // ← black → white
                  flexShrink: 0,
                }}
              />

              {/* Label */}
              <span
                style={{
                  fontSize: isMobile ? "8px" : "9px",
                  letterSpacing: "1px",
                  color: "white",
                  textAlign: "center",
                  lineHeight: "10px",
                  whiteSpace: "normal",
                }}
              >
                {renderLabel(item.label)}
              </span>
            </NavLink>
          );
        })}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DESKTOP  →  Original left sidebar
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed top-1/2 left-[90px] -translate-y-1/2 
                 w-[80px] h-[420px] flex flex-col items-center gap-8 
                 rounded-[20px] z-[1000] pt-5"
      style={{
        background: `linear-gradient(164deg, #105CA847 28%, rgba(6,36,66,0.55) 100%)`,
        border: "2px solid rgba(255, 255, 255, 0.25)",
      }}
    >
      {/* GLASS REFLECTION */}
      <div className="absolute top-0 left-0 w-full rounded-[40px] bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

      {/* ACTIVE GLASS SLIDER */}
      <div
        className="absolute left-[7px] w-[65px] h-[70px] rounded-[20px]"
        style={{
          top: `${displayIndex * 79 + 13}px`,
          transition: "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
          background: `linear-gradient(153deg, #407BB6 0%, #76ACE2 100%)`,
          border: "1px solid rgba(255,255,255,0.4)",
        }}
      />

      {/* NAV ITEMS */}
      {navItems.map((item, index) => (
        <NavLink
          key={index}
          to={item.path}
          end={item.path === "/"}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="relative z-10 w-[50px] h-[50px] flex flex-col items-center justify-center gap-2"
        >
          {/* ✅ Desktop — same WHITE_ICON_FILTER constant use பண்றோம் */}
          <img
            src={item.icon}
            alt={item.label}
            className={`w-[24px] h-[24px] transition-all duration-300
              ${index === displayIndex ? "scale-110" : "scale-100"}`}
            style={{ filter: WHITE_ICON_FILTER }}
          />
          <span className="text-[9px] tracking-[1.5px] text-white text-center leading-[12px]">
            {renderLabel(item.label)}
          </span>
        </NavLink>
      ))}
    </div>
  );
}