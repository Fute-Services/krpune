// import { useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { ChevronUp } from 'lucide-react';

// interface VRLink {
//   label: string;
//   url: string;
// }

// interface NavbarProps {
//   links: VRLink[];
//   onSelect: (url: string) => void;
//   activeUrl: string;
// }

// export default function BottomNavbar({ links, onSelect, activeUrl }: NavbarProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const navigate = useNavigate();
//   const location = useLocation();

//   const levels = [
//     { name: 'Terrace Level', path: '/terrace-level' },
//     { name: 'Podium Level', path: '/podium-level' },
//     { name: 'Lobby Reception', path: '/lobby-reception' },
//     { name: 'Ground Level', path: '/ground-level' },
//   ];

//   const currentLevel = levels.find(l => l.path === location.pathname)?.name || "Levels";

//   return (
//     <>
//       {/* ===== DESKTOP / TABLET (md and above) ===== */}
//       <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 items-end gap-3 z-[1000] w-max">

//         {/* Level Switcher */}
//         <div className="relative">
//           {isOpen && (
//             <div className="absolute bottom-[115%] left-0 w-full flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
//               {levels.map((level) => (
//                 <button
//                   key={level.path}
//                   onClick={() => { navigate(level.path); setIsOpen(false); }}
//                   className={`
//                     px-6 py-3 text-white text-sm font-medium text-center
//                     bg-[linear-gradient(179deg,rgba(16,92,168,0.16)_1.11%,rgba(6,36,66,0.57)_110.86%)]
//                     backdrop-blur-[6.6px] rounded-[25.163px]
//                     transition-all duration-200 hover:scale-105 active:scale-95
//                     ${location.pathname === level.path ? 'ring-1 ring-white/60' : ''}
//                   `}
//                 >
//                   {level.name}
//                 </button>
//               ))}
//             </div>
//           )}
//           <button
//             onClick={() => setIsOpen(!isOpen)}
//             className="
//               h-[55px] min-w-[160px] px-8
//               bg-[linear-gradient(179deg,rgba(16,92,168,0.16)_1.11%,rgba(6,36,66,0.57)_110.86%)]
//               backdrop-blur-[6.6px] rounded-[25.163px]
//               flex items-center justify-between gap-4
//               text-white shadow-xl transition-all duration-300
//               hover:brightness-110
//             "
//           >
//             <span className="text-sm font-semibold tracking-wide whitespace-nowrap">{currentLevel}</span>
//             <ChevronUp className={`w-5 h-5 transition-transform duration-500 ease-out ${isOpen ? 'rotate-180' : ''}`} />
//           </button>
//         </div>

//         {/* VR Links */}
//         <div className="h-[55px] flex items-center gap-2 px-2 shadow-2xl
//           bg-[linear-gradient(179deg,rgba(16,92,168,0.16)_1.11%,rgba(6,36,66,0.57)_110.86%)]
//           backdrop-blur-[6.17px] rounded-[25.163px]">
//           {links.map((link, index) => {
//             const isActive = activeUrl === link.url;
//             return (
//               <button
//                 key={index}
//                 onClick={() => onSelect(link.url)}
//                 className={`px-6 py-3 text-sm font-medium transition-all duration-300 whitespace-nowrap
//                   ${isActive
//                     ? 'rounded-[21.35px] bg-[rgba(16,92,168,0.50)] text-white'
//                     : 'rounded-[21.35px] text-white hover:opacity-100'
//                   }`}
//               >
//                 {link.label}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* ===== MOBILE (below md) ===== */}
//       <div className="flex md:hidden fixed bottom-4 left-0 right-0 z-[1000] flex-col items-center gap-2 px-3">

//         {/* Level Switcher Dropdown (opens upward) */}
//         {isOpen && (
//           <div className="flex flex-col gap-2 w-full max-w-[200px] self-start animate-in fade-in slide-in-from-bottom-3 duration-300">
//             {levels.map((level) => (
//               <button
//                 key={level.path}
//                 onClick={() => { navigate(level.path); setIsOpen(false); }}
//                 className={`
//                   px-4 py-2.5 text-white text-sm font-medium text-center
//                   bg-[linear-gradient(179deg,rgba(16,92,168,0.16)_1.11%,rgba(6,36,66,0.57)_110.86%)]
//                   backdrop-blur-[6.6px] rounded-[25.163px]
//                   transition-all duration-200 active:scale-95
//                   ${location.pathname === level.path ? 'ring-1 ring-white/60' : ''}
//                 `}
//               >
//                 {level.name}
//               </button>
//             ))}
//           </div>
//         )}

//         {/* Bottom Row: Level toggle + scrollable VR links */}
//         <div className="flex items-center gap-2 w-full">

//           {/* Level toggle button — fixed width, never shrinks */}
//           <div className="flex-shrink-0">
//             <button
//               onClick={() => setIsOpen(!isOpen)}
//               className="
//                 h-[46px] px-4
//                 bg-[linear-gradient(179deg,rgba(16,92,168,0.16)_1.11%,rgba(6,36,66,0.57)_110.86%)]
//                 backdrop-blur-[6.6px] rounded-[25.163px]
//                 flex items-center gap-2
//                 text-white shadow-xl transition-all duration-300
//               "
//             >
//               <span className="text-xs font-semibold tracking-wide whitespace-nowrap">{currentLevel}</span>
//               <ChevronUp className={`w-4 h-4 flex-shrink-0 transition-transform duration-500 ease-out ${isOpen ? 'rotate-180' : ''}`} />
//             </button>
//           </div>

//           {/* Scrollable VR links — pill is the scroll container itself */}
//           <div
//             className="flex-1 min-w-0 h-[46px] flex items-center gap-1.5 px-2 shadow-2xl
//               bg-[linear-gradient(179deg,rgba(16,92,168,0.16)_1.11%,rgba(6,36,66,0.57)_110.86%)]
//               backdrop-blur-[6.17px] rounded-[25.163px]
//               overflow-x-auto scrollbar-hide"
//           >
//             {links.map((link, index) => {
//               const isActive = activeUrl === link.url;
//               return (
//                 <button
//                   key={index}
//                   onClick={() => onSelect(link.url)}
//                   className={`px-4 py-2 text-xs font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0
//                     ${isActive
//                       ? 'rounded-[21.35px] bg-[rgba(16,92,168,0.50)] text-white'
//                       : 'rounded-[21.35px] text-white/80 hover:text-white'
//                     }`}
//                 >
//                   {link.label}
//                 </button>
//               );
//             })}
//           </div>

//         </div>
//       </div>

//       {/* Hide scrollbar utility */}
//       <style>{`
//         .scrollbar-hide::-webkit-scrollbar { display: none; }
//         .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
//       `}</style>
//     </>
//   );
// }

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';

interface VRLink {
  label: string;
  url: string;
}

interface NavbarProps {
  links: VRLink[];
  onSelect: (url: string) => void;
  activeUrl: string;
}

export default function BottomNavbar({ links, onSelect, activeUrl }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const levels = [
    { name: 'Terrace Level', path: '/terrace-level' },
    { name: 'Podium Level', path: '/podium-level' },
    { name: 'Lobby Reception', path: '/lobby-reception' },
    { name: 'Ground Level', path: '/ground-level' },
  ];

  const currentLevel = levels.find(l => l.path === location.pathname)?.name || "Levels";

  return (
    <>
      {/* Responsive Container (Figma Auto-Layout Equivalent):
        - w-max: "Hug Contents" horizontally.
        - left-1/2 & -translate-x-1/2: Perfectly centers the hugging container.
        - max-w-[96vw]: Ensures it never overflows the physical screen.
      */}
      <div className="fixed z-[1000] flex items-center bottom-2 md:bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 w-max max-w-[96vw] gap-1 md:gap-2 lg:gap-3 lg:items-end">

        {/* Level Switcher (Fixed width shrink-0 to protect its layout) */}
        <div className="relative flex-shrink-0">
          
          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute bottom-[115%] left-0 w-[110px] md:w-[130px] lg:w-full flex flex-col gap-1 md:gap-1.5 lg:gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {levels.map((level) => (
                <button
                  key={level.path}
                  onClick={() => { navigate(level.path); setIsOpen(false); }}
                  className={`
                    px-2 py-1.5 text-[9px] md:px-3 md:py-2 md:text-[10px] lg:px-6 lg:py-3 lg:text-sm font-medium text-center
                    bg-[linear-gradient(179deg,rgba(16,92,168,0.16)_1.11%,rgba(6,36,66,0.57)_110.86%)]
                    backdrop-blur-[6.6px] rounded-[16px] md:rounded-[20px] lg:rounded-[25.163px]
                    transition-all duration-200 hover:scale-105 active:scale-95
                    ${location.pathname === level.path ? 'ring-1 ring-white/60' : ''}
                  `}
                >
                  {level.name}
                </button>
              ))}
            </div>
          )}

          {/* Dropdown Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="
              h-[36px] px-2 min-w-[90px] gap-1
              md:h-[44px] md:px-4 md:min-w-[130px] md:gap-2
              lg:h-[55px] lg:px-8 lg:min-w-[160px] lg:gap-4
              bg-[linear-gradient(179deg,rgba(16,92,168,0.16)_1.11%,rgba(6,36,66,0.57)_110.86%)]
              backdrop-blur-[6.6px] rounded-[16px] md:rounded-[20px] lg:rounded-[25.163px]
              flex items-center justify-between
              text-white shadow-xl transition-all duration-300
              hover:brightness-110
            "
          >
            <span className="text-[9px] md:text-[11px] lg:text-sm font-semibold tracking-wide whitespace-nowrap">
              {currentLevel}
            </span>
            <ChevronUp 
              className={`w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 flex-shrink-0 transition-transform duration-500 ease-out ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>

        {/* VR Links Wrapper 
            - flex-shrink min-w-0: Allows this section to compress and scroll ONLY IF it hits the max-w-[96vw] boundary of the parent.
        */}
        <div className="flex-shrink min-w-0 flex items-center overflow-x-auto scrollbar-hide
          h-[36px] px-1 gap-1
          md:h-[44px] md:px-1.5 md:gap-1.5
          lg:h-[55px] lg:px-2 lg:gap-2 
          shadow-2xl bg-[linear-gradient(179deg,rgba(16,92,168,0.16)_1.11%,rgba(6,36,66,0.57)_110.86%)] 
          backdrop-blur-[6.17px] rounded-[16px] md:rounded-[20px] lg:rounded-[25.163px]"
        >
          {links.map((link, index) => {
            const isActive = activeUrl === link.url;
            return (
              <button
                key={index}
                onClick={() => onSelect(link.url)}
                className={`
                  px-2 py-1 text-[9px] 
                  md:px-3 md:py-1.5 md:text-[11px] 
                  lg:px-6 lg:py-3 lg:text-sm 
                  font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 
                  rounded-[12px] md:rounded-[16px] lg:rounded-[21.35px]
                  ${isActive
                    ? 'bg-[rgba(16,92,168,0.50)] text-white'
                    : 'text-white/80 hover:text-white lg:hover:opacity-100'
                  }
                `}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hide scrollbar utility for the mobile swipeable links */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}