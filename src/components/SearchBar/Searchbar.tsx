import { useState, useRef, useEffect } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import "./searchbar.css";

// 👉 your API
import { getFloors } from "@/api/floorServices";

export default function SearchBar() {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [floorData, setFloors] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // ✅ Normalize function (IMPORTANT 🔥)


  // ✅ Fetch floors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getFloors();
        setFloors(res.data.data || []);
        console.log("FloorData", res.data.data);
      } catch (err) {
        console.error("Error fetching floors", err);
      }
    };
    fetchData();
  }, []);

  // ✅ Focus input
  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  // ✅ Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".search-container")) {
        setExpanded(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ Filter floors (FIXED ✅ only one)
  // const filteredFloors = floorData.filter((f: any) =>
  //   normalize(f.name || "").includes(normalize(query))
  // );

  const normalize = (str: string) =>
    str.trim().toLowerCase().replace(/[\s-]/g, "");

  // 👇 create short form like "f1"
  const shortName = (str: string) => {
    const parts = str.toLowerCase().split(/[\s-]+/);
    return parts.map(p => p[0]).join(""); // Floor 1 → f1
  };

  const filteredFloors = floorData.filter((f: any) => {
    const name = f.name || "";

    return (
      normalize(name).includes(normalize(query)) ||   // normal match
      shortName(name).includes(normalize(query))      // short match (f1)
    );
  });

  // ✅ Navigate
  const goToFloor = (floor: any) => {
    navigate(`/unitplan/${floor.id}`);
    setQuery("");
    setExpanded(false);
  };

  // ✅ Enter key search (also normalized)
  const handleSearch = () => {
    const found = floorData.find((f: any) =>
      normalize(f.name || "").includes(normalize(query))
    );

    if (found) {
      goToFloor(found);
    } else {
      alert("Floor not found");
    }
  };



  return (<>
   <style>
    {`
      .custom-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scroll::-webkit-scrollbar-thumb {
        background: rgba(184,179,179,0.4);
        border-radius: 10px;
      }
      .custom-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(162,159,159,0.6);
      }
    `}
  </style>

  
     {/* 🔽 Dropdown */}
      {expanded && query && (
        <div className="absolute custom-scroll top-56 w-64 bg-white/15  backdrop-blur-xl
         rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
          {filteredFloors.length > 0 ? (
            filteredFloors.map((floor: any) => (
              <div
                key={floor.id}
                onClick={() => goToFloor(floor)}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100/20 hover:text-black/80
                 text-gray-200"
              >
                {floor.name}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
  
    <div className={`search-container ${expanded ? "expanded" : ""}`}>

    


      {/* 🔍 ICON */}
      <button
        className="search-icon"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(true);
        }}
      >
        <FaMagnifyingGlass />
      </button>

      {/* 🔍 INPUT  */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Search floor..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
      />

      {/* 🔽 DROPDOWN */}
      {expanded && query && (
        <div className="search-results">
          {filteredFloors.length > 0 ? (
            filteredFloors.map((floor: any) => (
              <div
                key={floor.id}
                className="search-item"
                onClick={() => goToFloor(floor)}
              >
                {floor.name}
              </div>
            ))
          ) : (
            <div className="search-item">No results found</div>
          )}
        </div>
      )}
    </div>
  </>);
}