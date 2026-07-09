import { useState } from "react";
import "tippy.js/dist/tippy.css";
import "./style.css";
import MapBoxMap from "../../pages/Location/MapboxMap";

type LocationMapProps = {
  onViewChange?: (view: string) => void;
};

export default function LocationMap({ onViewChange }: LocationMapProps) {
  const [activeFilter, setActiveFilter] = useState<string>("Site Location");

  const filters = ["Site Location", "Neighbourhood", "Network Road"];

  return (
    <div className="location-page">

      {/* ✅ Map Component with state */}
      <MapBoxMap activeFilter={activeFilter} />

      {/* ✅ Filter Buttons */}
      <div className="location-filters">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`location-filter-btn ${
              activeFilter === filter ? "location-filter-active" : ""
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

    </div>
  );
}