// import { useState } from 'react';
// import 'tippy.js/dist/tippy.css';
// import MapboxMap from './MapboxMap';
// import "./style.css";
// import { FaArrowLeft } from 'react-icons/fa6';

// type LocationMapProps = {
//   onViewChange?: (view: string) => void;
// };

// export default function LocationMap({ onViewChange }: LocationMapProps) {
//   const [activeFilter, setActiveFilter] = useState<string>('Neighbourhood');

//   const filters = [ 'Neighbourhood', 'Network Road'];

//   return (
//     <div
//       className="location-page"
//       style={{
//         position: 'relative',
//         width: '100vw',
//         height: '100vh',
//         overflow: 'hidden',
//       }}
//     >
//       {/* Back Button */}
//       {/* <button
//         onClick={() => onViewChange?.('Home')}
//         style={{
//           position: 'absolute', top: '30px', left: '30px', zIndex: 50,
//           width: '50px', height: '50px', borderRadius: '50%',
//           background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer', color: '#000'
//         }}
//       >
//         <FaArrowLeft size={20} />
//       </button> */}

//       {/* Filter Buttons */}
//       <div className="location-filters" style={{ zIndex: 10, position: 'relative' }}>
//         {filters.map((filter) => (
//           <button
//             key={filter}
//             onClick={() => setActiveFilter(filter)}
//             className={`location-filter-btn ${
//               activeFilter === filter ? 'location-filter-active' : ''
//             }`}
//           >
//             {filter}
//           </button>
//         ))}
//       </div>

//       {/* Mapbox Map */}
//       <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
//         <MapboxMap activeFilter={activeFilter} />
//       </div>
//     </div>
//   );
// }

import { useState } from 'react';
import MapboxMap from './MapboxMap';

type LocationMapProps = {
  onViewChange?: (view: string) => void;
};

export default function LocationMap({ onViewChange }: LocationMapProps) {
  const [activeFilter, setActiveFilter] = useState<string>('Social Infra');

  const filters = ['Social Infra', 'Transport Infra'];

  return (
    <div className="relative w-full h-[100vh] overflow-hidden z-20 bg-cover bg-center">
      
      {/* Filter Buttons */}
      <div className="location-filters absolute top-16 left-1/2 -translate-x-1/2 z-30 flex justify-center items-center gap-2 p-1.5 max-w-[90vw] overflow-x-auto overflow-y-hidden whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#2A3441]/70 border border-white/20 rounded-full shadow-lg">
  {filters.map((filter) => (
    <button
      key={filter}
      onClick={() => setActiveFilter(filter)}
      className={`location-filter-btn shrink-0 min-w-[120px] px-[24px] py-[10px] outline-none cursor-pointer text-[14px] font-medium text-white rounded-full transition-all duration-300 ease-in-out ${
        activeFilter === filter
          ? 'bg-[#4581C4] border-[1.5px] border-white shadow-md'
          : 'bg-[#485460] border-[1.5px] border-transparent hover:bg-[#4581C4]/80'
      }`}
    >
      {filter}
    </button>
  ))}
</div>

      {/* Mapbox Map */}
      <div className="absolute inset-0 z-[1]">
        <MapboxMap activeFilter={activeFilter} />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .location-filters {
            top: 5.5rem !important;
            gap: 0.6rem !important;
          }
          .location-filter-btn {
            font-size: 12px !important;
            min-width: 100px !important;
            padding: 8px 12px !important;
          }
        }
        @media (max-width: 480px) {
          .location-filters {
            justify-content: flex-start !important;
            padding-left: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}