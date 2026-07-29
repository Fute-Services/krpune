// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import fitoutplan_img from '../../assets/fitout/img.png';
// import backImg from '../../assets/back.png';
// import logo from '../../assets/logo.png';
// import vectorImg from '../../assets/fitout/Vector 122.png';
// import { useNavigate } from 'react-router-dom';
// import {
//   MdDesktopWindows,
//   MdPeople,
//   MdGroups,
//   MdMeetingRoom,
//   MdDirectionsRun,
//   MdWoman,
//   MdMan,
//   MdAcUnit,
// } from 'react-icons/md';
// import { IconType } from 'react-icons';

// import ahuIcon from '../../assets/fitout/Group 163.png';
// import boardRoomIcon from '../../assets/fitout/Group 161.png';

// interface FitoutProps {
//   isOpen?: boolean;
//   onClose?: () => void;
// }

// interface LegendItem {
//   name: string;
//   Icon?: IconType;
//   imageSrc?: string;
//   iconImageSrc?: string;
// }

// const legendItems: LegendItem[] = [
//   { name: 'LINEAR WORKSTATION',    Icon: MdDesktopWindows },
//   { name: '4 SEATER MEETING ROOM', Icon: MdPeople },
//   { name: '8 SEATER MEETING ROOM', Icon: MdPeople },
//   { name: '10 SEATER MEETING ROOM', Icon: MdGroups },
//   { name: '16 SEATER MEETING ROOM', Icon: MdGroups },
//   { name: 'BOARD ROOM',             iconImageSrc: boardRoomIcon },
//   { name: 'FIRE ESCAPE STAIRCASE',  Icon: MdDirectionsRun },
//   { name: "LADIES REST ROOM",      Icon: MdWoman },
//   { name: "GENTS REST ROOM",       Icon: MdMan },
//   { name: 'AHU ROOM',               imageSrc: ahuIcon },
// ];

// const Fitout: React.FC<FitoutProps> = ({ isOpen = true, onClose }) => {
//   const navigate = useNavigate();

//   const handleClose = () => {
//     if (onClose) {
//       onClose();
//     } else {
//       navigate(-1);
//     }
//   };

//   // Common variant for bottom-to-top motion
//   const slideUpVariant = {
//     initial: { y: '100%', opacity: 0 },
//     animate: { y: 0, opacity: 1 },
//     transition: { type: 'spring', damping: 25, stiffness: 100 }
//   };

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 z-[2000] w-full h-full flex overflow-hidden font-[Poppins,sans-serif] text-white"
//           style={{ background: 'radial-gradient(circle at center, #15457a 0%, #061c36 100%)' }}
//         >
//           {/* Back Button - Static */}
//           <button
//             className="absolute top-5 left-5 sm:top-8 sm:left-8 w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[30%] bg-white hover:bg-gray-100 transition-colors border-none flex items-center justify-center z-20 cursor-pointer shadow-lg"
//             onClick={handleClose}
//             aria-label="Go back"
//           >
//             <img src={backImg} alt="Back" className="w-[18px] h-[18px] sm:w-[24px] sm:h-[24px]" />
//           </button>

//           {/* Top Right Branding - Static */}
//           <div className="absolute top-5 right-5 sm:top-8 sm:right-10 flex flex-col items-center gap-6 z-20">
//             <img src={logo} alt="K Raheja Corp" className="w-[60px] sm:w-[80px] object-contain" />
//           </div>

//           {/* Main 3D Fitout Image - Animation Added */}
//           <div className="absolute inset-0 flex items-center justify-center p-10 mt-[5vh] ml-[15%]">
//             <motion.img
//               variants={slideUpVariant}
//               initial="initial"
//               animate="animate"
//               transition={{ ...slideUpVariant.transition, delay: 0.2 }}
//               src={fitoutplan_img}
//               alt="Fitout Plan"
//               className="w-auto h-auto max-w-[85%] max-h-[75vh] object-contain select-none"
//               draggable={false}
//             />
//           </div>

//           {/* Left Legend Panel - Animation Added */}
//           <motion.div
//             variants={slideUpVariant}
//             initial="initial"
//             animate="animate"
//             transition={{ ...slideUpVariant.transition, delay: 0.1 }}
//             className="absolute left-[3%] top-28 sm:top-32 bg-[#021326]/40 backdrop-blur-md border border-[#2B6CA7] rounded-[30px] p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col gap-4 text-white"
//             style={{ width: 'min(290px, 90vw)' }}
//           >
//             <div className="bg-[#B5D3F1] text-[#0A2643] text-center py-2 px-4 rounded-full font-semibold text-[12px] sm:text-[13px] tracking-wide self-center select-none shadow-md w-full max-w-[95%]">
//               LEGEND / DESCRIPTION
//             </div>

//             <div className="relative flex flex-col gap-3 mt-1 px-1">
//               <div 
//                 className="absolute left-[40px] top-2 bottom-2 w-[1px]" 
//                 style={{ background: 'linear-gradient(180deg, rgba(28,108,188,0) 0%, #1C6CBC 15%, #1C6CBC 85%, rgba(13,49,86,0) 100%)' }}
//               />

//               {legendItems.map(({ name, Icon, imageSrc, iconImageSrc }, idx) => (
//                 <div key={name} className="relative flex items-center gap-3 cursor-default z-10">
//                   {Icon || iconImageSrc ? (
//                     <div className="w-[30px] h-[30px] rounded-full border border-[#2B6CA7]/80 bg-[#06182C] flex items-center justify-center shrink-0 shadow-inner">
//                       {Icon && <Icon style={{ width: 14, height: 14, color: '#E0E7FF' }} />}
//                       {iconImageSrc && <img src={iconImageSrc} alt="" className="w-4 h-4 object-contain opacity-90" />}
//                     </div>
//                   ) : imageSrc ? (
//                     <img src={imageSrc} alt="" className="w-[30px] h-[30px] object-contain shrink-0" />
//                   ) : null}
//                   <span className="font-medium text-[11px] sm:text-[12px] tracking-wide text-white/95 leading-tight font-[Poppins,sans-serif]">
//                     {name}
//                   </span>
//                   {idx < legendItems.length - 1 && (
//                     <div 
//                       className="absolute left-[40px] right-0 -bottom-[6px] h-[1px]" 
//                       style={{ background: 'linear-gradient(90deg, rgba(28,108,188,0) 0%, #1C6CBC 22%, #1C6CBC 78%, rgba(13,49,86,0) 100%)' }}
//                     />
//                   )}
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           {/* Bottom Vector Graphic - Static */}
//           <img
//             src={vectorImg}
//             alt=""
//             className="absolute bottom-[-150px] left-1/2 -translate-x-1/2 z-[5] pointer-events-none object-contain"
//             style={{ maxHeight: '60vh', width: 'auto' }}
//           />

//           {/* Bottom Title - Centered & Animated */}
//           <motion.div
//             variants={slideUpVariant}
//             initial="initial"
//             animate="animate"
//             transition={{ ...slideUpVariant.transition, delay: 0.3 }}
//             className="absolute bottom-[6%] left-0 right-0 flex justify-center z-10 select-none"
//           >
//             <div
//               className="text-3xl sm:text-5xl font-sans tracking-wide font-bold whitespace-nowrap"
//               style={{
//                 background: 'linear-gradient(138deg, #71B7FF 23.76%, #FFF 135.75%)',
//                 backgroundClip: 'text',
//                 WebkitBackgroundClip: 'text',
//                 WebkitTextFillColor: 'transparent',
//               }}
//             >
//               Fit out plan 1:60
//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// };

// export default Fitout;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import fitoutplan_img from '../../assets/fitout/img.png';
import backImg from '../../assets/back.png';
import logo from '../../assets/logo.png';
import vectorImg from '../../assets/fitout/Vector 122.png';
import { useNavigate } from 'react-router-dom';
import {
  MdDesktopWindows,
  MdPeople,
  MdGroups,
  MdMeetingRoom,
  MdDirectionsRun,
  MdWoman,
  MdMan,
  MdAcUnit,
} from 'react-icons/md';
import { IconType } from 'react-icons';

import ahuIcon from '../../assets/fitout/Group 163.png';
import boardRoomIcon from '../../assets/fitout/Group 161.png';

interface FitoutProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface LegendItem {
  name: string;
  Icon?: IconType;
  imageSrc?: string;
  iconImageSrc?: string;
}

const legendItems: LegendItem[] = [
  { name: 'Linear Workstation',    Icon: MdDesktopWindows },
  { name: '4 Seater Meeting Room', Icon: MdPeople },
  { name: '8 Seater Meeting Room', Icon: MdPeople },
  { name: '10 Seater Meeting Room', Icon: MdGroups },
  { name: '16 Seater Meeting Room', Icon: MdGroups },
  { name: 'Board Room',             iconImageSrc: boardRoomIcon },
  { name: 'Fire Escape Staircase',  Icon: MdDirectionsRun },
  { name: "Ladies Rest Room",      Icon: MdWoman },
  { name: "Gents Rest Room",       Icon: MdMan },
  { name: 'AHU Room',               imageSrc: ahuIcon },
];

const Fitout: React.FC<FitoutProps> = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const slideUpVariant = {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { type: 'spring', damping: 25, stiffness: 100 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] w-full h-full flex overflow-hidden font-[Poppins,sans-serif] text-white"
          style={{ background: 'radial-gradient(circle at center, #15457a 0%, #061c36 100%)' }}
        >
          {/* Back Button */}
          <button
            className="absolute top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-8 w-9 h-9 md:w-11 md:h-11 lg:w-[50px] lg:h-[50px] rounded-[30%] bg-white hover:bg-gray-100 transition-colors border-none flex items-center justify-center z-[60] cursor-pointer shadow-lg"
            onClick={handleClose}
            aria-label="Go back"
          >
            <img src={backImg} alt="Back" className="w-[14px] h-[14px] md:w-[18px] md:h-[18px] lg:w-[24px] lg:h-[24px]" />
          </button>

          {/* Top Right Branding */}
          <div className="absolute top-4 right-4 md:top-6 md:right-8 lg:top-8 lg:right-10 flex flex-col items-center gap-6 z-[60]">
            <img src={logo} alt="K Raheja Corp" className="w-[45px] md:w-[60px] lg:w-[80px] object-contain" />
          </div>

          {/* 
            DYNAMIC LAYOUT WRAPPER 
            Mobile (base): flex-col-reverse (Stacks image on top, legend on bottom)
            Tablet (md): flex-row (Side-by-side)
            Laptop (lg): Flex row, but Legend becomes absolute (Untouched behavior)
          */}
          <div className="absolute inset-0 flex flex-col-reverse md:flex-row items-center justify-center gap-4 md:gap-8 pt-[60px] pb-[80px] lg:p-10 z-30 pointer-events-none">
            
            {/* Left Legend Panel */}
            <motion.div
              variants={slideUpVariant}
              initial="initial"
              animate="animate"
              transition={{ ...slideUpVariant.transition, delay: 0.1 }}
              className="pointer-events-auto bg-[#021326]/40 backdrop-blur-md border border-[#2B6CA7] rounded-[20px] lg:rounded-[30px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col text-white overflow-y-auto
                /* Base (Mobile): Relative, Bottom of column */
                relative w-[90%] max-w-[320px] max-h-[35vh] p-3 gap-2 
                /* Tablet (md): Relative, Left side of row */
                md:w-[260px] md:max-h-[60vh] md:p-4 md:gap-3 
                /* Laptop (lg): Untouched (Absolute positioned, pops out of flex flow) */
                lg:absolute lg:top-32 lg:left-[3%] lg:max-h-none lg:p-5 lg:gap-4 lg:w-[min(290px,90vw)]"
              style={{ 
                msOverflowStyle: 'none',  
                scrollbarWidth: 'none'    
              }}
            >
              <style>{`.overflow-y-auto::-webkit-scrollbar { display: none; }`}</style>

              <div className="bg-[#B5D3F1] text-[#0A2643] text-center rounded-full font-semibold tracking-wide self-center select-none shadow-md w-full max-w-[95%]
                py-1.5 px-2 text-[9px] 
                md:py-2 md:px-3 md:text-[11px] 
                lg:py-2 lg:px-4 lg:text-[13px]">
                LEGEND / DESCRIPTION
              </div>

              <div className="relative flex flex-col gap-2 md:gap-2.5 lg:gap-3 mt-1 px-1">
                <div 
                  className="absolute w-[1px]
                    left-[24px] top-1 bottom-1
                    md:left-[30px] md:top-1.5 md:bottom-1.5
                    lg:left-[40px] lg:top-2 lg:bottom-2" 
                  style={{ background: 'linear-gradient(180deg, rgba(28,108,188,0) 0%, #1C6CBC 15%, #1C6CBC 85%, rgba(13,49,86,0) 100%)' }}
                />

                {legendItems.map(({ name, Icon, imageSrc, iconImageSrc }, idx) => (
                  <div key={name} className="relative flex items-center cursor-default z-10 gap-2 md:gap-2.5 lg:gap-3">
                    {Icon || iconImageSrc ? (
                      <div className="rounded-full border border-[#2B6CA7]/80 bg-[#06182C] flex items-center justify-center shrink-0 shadow-inner
                        w-[20px] h-[20px] 
                        md:w-[24px] md:h-[24px] 
                        lg:w-[30px] lg:h-[30px]">
                        {Icon && <Icon className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-[14px] lg:h-[14px] text-[#E0E7FF]" />}
                        {iconImageSrc && <img src={iconImageSrc} alt="" className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 object-contain opacity-90" />}
                      </div>
                    ) : imageSrc ? (
                      <img src={imageSrc} alt="" className="object-contain shrink-0
                        w-[20px] h-[20px] 
                        md:w-[24px] md:h-[24px] 
                        lg:w-[30px] lg:h-[30px]" />
                    ) : null}
                    <span className="font-medium tracking-wide text-white/95 leading-tight font-[Poppins,sans-serif]
                      text-[8px] md:text-[10px] lg:text-[12px]">
                      {name}
                    </span>
                    {idx < legendItems.length - 1 && (
                      <div 
                        className="absolute right-0 h-[1px]
                          left-[24px] -bottom-[4px]
                          md:left-[30px] md:-bottom-[5px]
                          lg:left-[40px] lg:-bottom-[6px]" 
                        style={{ background: 'linear-gradient(90deg, rgba(28,108,188,0) 0%, #1C6CBC 22%, #1C6CBC 78%, rgba(13,49,86,0) 100%)' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Main 3D Fitout Image */}
            <motion.img
              variants={slideUpVariant}
              initial="initial"
              animate="animate"
              transition={{ ...slideUpVariant.transition, delay: 0.2 }}
              src={fitoutplan_img}
              alt="Fitout Plan"
              className="pointer-events-auto object-contain select-none w-auto h-auto
                /* Base (Mobile): Top of column */
                relative max-w-[95%] max-h-[45vh] mt-0 ml-0 
                /* Tablet (md): Right side of row */
                md:relative md:max-w-[55%] md:max-h-[60vh] 
                /* Laptop (lg): Untouched (Absolute centered with specific margins) */
                lg:max-w-[85%] lg:max-h-[75vh] lg:mt-[5vh] lg:ml-[15%]"
              draggable={false}
            />

          </div>

          {/* Bottom Vector Graphic */}
          <img
            src={vectorImg}
            alt=""
            className="absolute left-1/2 -translate-x-1/2 z-[5] pointer-events-none object-contain
              bottom-[-60px] max-h-[40vh] w-[150%]
              md:bottom-[-100px] md:max-h-[50vh] md:w-auto
              lg:bottom-[-150px] lg:max-h-[60vh] lg:w-auto"
          />

          {/* Bottom Title */}
          <motion.div
            variants={slideUpVariant}
            initial="initial"
            animate="animate"
            transition={{ ...slideUpVariant.transition, delay: 0.3 }}
            className="absolute left-0 right-0 flex justify-center z-20 select-none
              bottom-[4%] md:bottom-[5%] lg:bottom-[6%]"
          >
            <div
              className="font-sans tracking-wide font-bold whitespace-nowrap
                text-2xl md:text-4xl lg:text-5xl"
              style={{
                background: 'linear-gradient(138deg, #71B7FF 23.76%, #FFF 135.75%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Fit out plan 1:60
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Fitout;