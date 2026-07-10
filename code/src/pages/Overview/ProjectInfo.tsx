// import React from 'react';
// import { motion, Variants } from 'framer-motion';
// import Sidebar from "../Sidebar/Sidebar";
// import BackButton from './BackButton';
// import info1 from "../../assets/info1.png";
// import info2 from "../../assets/info2.png";
// import info3 from "../../assets/info3.png";

// const ProjectInfo = () => {
//   const animDuration = 1.4;

//   // Animation Variants (Kept exactly as requested)
//   const topDown: Variants = {
//     hidden: { opacity: 0, y: -150 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: {
//         duration: animDuration,
//         ease: "easeOut"
//       }
//     }
//   };

//   const leftIn: Variants = {
//     hidden: { opacity: 0, x: -300 },
//     visible: {
//       opacity: 1,
//       x: 0,
//       transition: {
//         duration: animDuration,
//         ease: "easeOut"
//       }
//     }
//   };

//   const rightIn: Variants = {
//     hidden: { opacity: 0, x: 300 },
//     visible: {
//       opacity: 1,
//       x: 0,
//       transition: {
//         duration: animDuration,
//         ease: "easeOut"
//       }
//     }
//   };

//   return (
//     <div className="relative h-screen w-full bg-[#062442] text-[#a5b4fc] font-sans overflow-hidden flex justify-center pl-[110px] pr-8 py-16 box-border z-0">
      
//       {/* Navigation Components */}
//       <div className="absolute top-10 left-8 z-50">
//         <BackButton />
//       </div>
//       {/* <div className="absolute top-1/2 -translate-y-1/2 left-2 z-50">
//         <Sidebar />
//       </div> */}

//       {/* Background Decorative Elements */}
//       <div 
//         className="absolute inset-0 z-0 opacity-20 pointer-events-none"
//         style={{
//           backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
//           backgroundSize: '40px 40px'
//         }}
//       />
      
//       {/* Faded Circles on Bottom Left */}
//       <div className="absolute -bottom-[55%] -right-[16%] w-[500px] h-[450px] rounded-full border border-[#719BC5] z-0 pointer-events-none" />
//       <div className="absolute -bottom-[40%] -right-[22%] w-[400px] h-[500px] rounded-full border border-[#719BC5] z-0 pointer-events-none" />

//       <motion.div 
//         initial="hidden"
//         animate="visible"
//         className="relative z-10 w-full max-w-[1400px] flex flex-col"
//       >
//         {/* TOP SECTION */}
//         <motion.section variants={topDown} className="text-center max-w-5xl mx-auto mb-10 ">
//           <p className="text-[15px] leading-relaxed font-poppins text-white tracking-wide mt-[-30px]">
//   Spread across <span className="font-bold text-[20px]">9 acres</span>, this premium commercial development offers approximately <span className="font-bold text-[20px]">2.7 million sq. ft.</span> of leasable area, designed to meet the evolving needs of modern IT/ITES enterprises. <br />
//   The campus features state-of-the-art office spaces with a strong emphasis on flexibility, efficiency, and workplace innovation. 
//   Designed as a green building campus, it is LEED Gold certified (Core & Shell), ensuring sustainability, energy efficiency, and a superior working environment.
// </p>
//         </motion.section>

//         {/* MIDDLE SECTION - Grid Layout */}
//         <div className="flex flex-col lg:flex-row justify-between items-start w-full gap-4">
          
//           {/* LEFT SIDE GROUP */}
//           <motion.div variants={leftIn} className="flex flex-col w-full lg:w-[55%] gap-12 relative z-10">
            
//             {/* Strategic Location */}
//             <div className="flex flex-row items-center gap-8">
//               {/* Image - Smaller and Centered */}
//               <div className="w-44 h-44 rounded-full overflow-hidden shrink-0 border-[3px] border-white/10">
//                 <img 
//                   src={info1} 
//                   alt="Strategic Location" 
//                   className="w-full h-full object-cover" 
//                 />
//               </div>
              
//               <div className="flex-1 flex flex-col">
//                 {/* Header Row with Line */}
//                 <div className="flex items-center gap-4 mb-5">
//                   <h2 className="text-3xl text-white font-normal tracking-wide whitespace-nowrap">Strategic Location</h2>
//                   <div className="flex-1 h-[1px] bg-gradient-to-r from-[#3b82f6] to-transparent flex items-center">
//                       <div className="w-1.5 h-1.5 bg-[#3b82f6] rotate-45 ml-auto mr-12 opacity-80" />
//                   </div>
//                 </div>
//                 {/* Bracket Box */}
//                 <div className="relative border-l border-b border-[#3b82f6]/40 p-5 pl-6 ">
//                   {/* <div className="absolute top-0 left-0 w-4 h-[1px] bg-[#3b82f6]/40" /> */}
//                   <p className="text-white text-[13px] leading-relaxed mb-3">
//                     Situated in one of Pune's fastest-growing IT and automobile corridors, the site offers excellent connectivity and accessibility:
//                   </p>
//                   <ul className="text-white text-[13px] leading-relaxed list-disc pl-5 space-y-1">
//   <li>Direct access via a service road off the Mumbai-Pune Highway</li>
//   <li>Additional access from a wide parallel road, ensuring smooth traffic flow</li>
//   <li>Prominent highway frontage enhancing visibility and accessibility</li>
// </ul>
//                 </div>
//               </div>
//             </div>

//             {/* Connectivity */}
//             <div className="flex flex-row items-end gap-4 relative">
//               {/* Image - Larger and Pushed Down */}
//               <div className="w-56 h-56 rounded-full overflow-hidden shrink-0 border-[3px] border-white/10 translate-y-16">
//                 <img 
//                   src={info2} 
//                   alt="Connectivity" 
//                   className="w-full h-full object-cover" 
//                 />
//               </div>
              
//               <div className="flex-1 flex flex-col pb-4">
//                 {/* Header Row with Line */}
//                 <div className="flex items-center gap-4 mb-5">
//                   <h2 className="text-3xl text-white font-normal tracking-wide whitespace-nowrap">Connectivity</h2>
//                   <div className="flex-1 h-[1px] bg-gradient-to-r from-[#3b82f6] to-transparent flex items-center">
//                     <div className="w-1.5 h-1.5 bg-[#3b82f6] rotate-45 ml-auto mr-12 opacity-80" />
//                   </div>
//                 </div>
//                 {/* Bracket Box */}
//                 <div className="relative border-l border-b border-[#3b82f6]/40 p-5 pl-6">
//                   {/* <div className="absolute top-0 left-0 w-4 h-[1px] bg-[#3b82f6]/40" /> */}
//                   <div className="flex justify-between items-center max-w-[350px] mb-4">
//                     <span className="text-white text-[15px]">Pune Airport –</span>
//                     <span className="text-white font-bold text-xl flex items-baseline gap-2">
//                       17 km <span className="text-white font-normal text-xs">(~40 minutes)</span>
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center max-w-[350px]">
//                     <span className="text-white text-[15px]">Pune Railway Station –</span>
//                     <span className="text-white font-bold text-xl flex items-baseline gap-2">
//                       11 km <span className="text-white font-normal text-xs">(~30 minutes)</span>
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//           </motion.div>

//           {/* RIGHT SIDE GROUP - Design Excellence */}
//           <motion.div variants={rightIn} className="flex flex-row w-full lg:w-[50%] relative mt-20 lg:mt-[110px] z-10">
            
//             {/* Text Container - Offset below the top of the image */}
//             <div className="flex flex-col flex-1 relative z-20 pt-16 pr-[250px]">
//               {/* Header Row with Line */}
//               <div className="flex items-center gap-4 mb-5">
//                 <h2 className="text-3xl text-white font-normal tracking-wide whitespace-nowrap">Design Excellence</h2>
//                 <div className="w-[80px] h-[1px] bg-gradient-to-r from-[#3b82f6] to-transparent flex items-center">
//                   <div className="w-1.5 h-1.5 bg-[#3b82f6] rotate-45 ml-auto opacity-80" />
//                 </div>
//               </div>
              
//               {/* Bracket Box */}
//               <div className="relative border-l border-b border-[#3b82f6]/40 p-3 pl-6">
//                 {/* <div className="absolute top-0 left-0 w-4 h-[1px] bg-[#3b82f6]/40" /> */}
//                 <p className="text-white text-sm leading-relaxed mb-3">
//                   The project is thoughtfully planned to deliver maximum efficiency and user comfort:
//                 </p>
//                 <ul className="text-white text-[13px] leading-relaxed list-disc pl-4 space-y-1">
//   <li>Optimized core design to enhance internal space utilization</li>
//   <li>Efficient vertical transportation systems for seamless movement</li>
//   <li>Maximized usable office areas for superior workplace layouts</li>
//   <li>Integrated recreational and office spaces to support employee well-being</li>
//   <li>Optimized floor plates for flexibility and better space utility</li>
// </ul>
//               </div>
//             </div>

//             {/* Large Trailing Image - Pushed outside the viewport on the right */}
//             <div className="absolute bottom-48 -right-[10%] w-[320px] h-[320px] rounded-full overflow-hidden border-[3px] border-white/10 z-10">
//               <img 
//                 src={info3} 
//                 alt="Design Excellence" 
//                 className="w-full h-full object-cover" 
//               />
//             </div>
            
//           </motion.div>

//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default ProjectInfo;

import React from 'react';
import { motion, Variants } from 'framer-motion';
import Sidebar from "../Sidebar/Sidebar";
import BackButton from './BackButton';
import info1 from "../../assets/info1.png";
import info2 from "../../assets/info2.png";
import info3 from "../../assets/info3.png";

const ProjectInfo = () => {
  const animDuration = 1.4;

  // Animation Variants (Kept exactly as requested)
  const topDown: Variants = {
    hidden: { opacity: 0, y: -150 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: animDuration,
        ease: "easeOut"
      }
    }
  };

  const leftIn: Variants = {
    hidden: { opacity: 0, x: -300 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: animDuration,
        ease: "easeOut"
      }
    }
  };

  const rightIn: Variants = {
    hidden: { opacity: 0, x: 300 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: animDuration,
        ease: "easeOut"
      }
    }
  };

  return (
  
    <div className="relative min-h-screen lg:h-screen w-full bg-[#062442] text-[#a5b4fc] font-sans overflow-x-hidden overflow-y-auto lg:overflow-hidden flex justify-center px-6 py-20 md:px-12 lg:pl-[110px] lg:pr-8 lg:py-16 box-border z-0">
      
      {/* Navigation Components */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 lg:top-10 lg:left-8 z-50">
        <BackButton />
      </div>
      {/* <div className="absolute top-1/2 -translate-y-1/2 left-2 z-50">
        <Sidebar />
      </div> */}

      {/* Background Decorative Elements */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Faded Circles on Bottom Left - Hidden on mobile/tablet to prevent layout overlap */}
      <div className="hidden lg:block absolute -bottom-[55%] -right-[16%] w-[500px] h-[450px] rounded-full border border-[#719BC5] z-0 pointer-events-none" />
      <div className="hidden lg:block absolute -bottom-[40%] -right-[22%] w-[400px] h-[500px] rounded-full border border-[#719BC5] z-0 pointer-events-none" />

      <motion.div 
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[1400px] flex flex-col pt-8 md:pt-4 lg:pt-0"
      >
        {/* TOP SECTION */}
        <motion.section variants={topDown} className="text-center max-w-5xl mx-auto mb-10 lg:mb-10">
          <p className="text-sm md:text-base lg:text-[15px] leading-relaxed font-poppins text-white tracking-wide mt-0 lg:mt-[-30px]">
            Spread across <span className="font-bold text-lg lg:text-[20px]">9 acres</span>, this premium commercial development offers approximately <span className="font-bold text-lg lg:text-[20px]">2.7 million sq. ft.</span> of leasable area, designed to meet the evolving needs of modern IT/ITES enterprises. <br className="hidden md:block" />
            The campus features state-of-the-art office spaces with a strong emphasis on flexibility, efficiency, and workplace innovation. 
            Designed as a green building campus, it is LEED Gold certified (Core & Shell), ensuring sustainability, energy efficiency, and a superior working environment.
          </p>
        </motion.section>

        {/* MIDDLE SECTION - Grid Layout */}
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start w-full gap-12 lg:gap-4">
          
          {/* LEFT SIDE GROUP */}
          <motion.div variants={leftIn} className="flex flex-col w-full lg:w-[55%] gap-12 lg:gap-12 relative z-10">
            
            {/* Strategic Location */}
            <div className="flex flex-col md:flex-row items-center md:items-start lg:items-center gap-6 lg:gap-8">
              {/* Image - Smaller on mobile, scaled up to original on lg */}
              <div className="w-32 h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-full overflow-hidden shrink-0 border-[3px] border-white/10">
                <img 
                  src={info1} 
                  alt="Strategic Location" 
                  className="w-full h-full object-cover" 
                />
              </div>
              
              <div className="flex-1 flex flex-col w-full md:w-auto">
                {/* Header Row with Line */}
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4 lg:mb-5">
                  <h2 className="text-2xl md:text-3xl text-white font-normal tracking-wide whitespace-nowrap">Strategic Location</h2>
                  <div className="hidden md:flex flex-1 h-[1px] bg-gradient-to-r from-[#3b82f6] to-transparent items-center">
                      <div className="w-1.5 h-1.5 bg-[#3b82f6] rotate-45 ml-auto mr-4 lg:mr-12 opacity-80" />
                  </div>
                </div>
                {/* Bracket Box */}
                <div className="relative border-l border-b border-[#3b82f6]/40 p-4 lg:p-5 pl-4 lg:pl-6">
                  <p className="text-white text-xs md:text-[13px] leading-relaxed mb-3">
                    Situated in one of Pune's fastest-growing IT and automobile corridors, the site offers excellent connectivity and accessibility:
                  </p>
                  <ul className="text-white text-xs md:text-[13px] leading-relaxed list-disc pl-5 space-y-1">
                    <li>Direct access via a service road off the Mumbai-Pune Highway</li>
                    <li>Additional access from a wide parallel road, ensuring smooth traffic flow</li>
                    <li>Prominent highway frontage enhancing visibility and accessibility</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Connectivity */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 lg:gap-4 relative mt-4 lg:mt-0">
              {/* Image - Removed translateY on mobile, restored on lg */}
              <div className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full overflow-hidden shrink-0 border-[3px] border-white/10 translate-y-0 lg:translate-y-16">
                <img 
                  src={info2} 
                  alt="Connectivity" 
                  className="w-full h-full object-cover" 
                />
              </div>
              
              <div className="flex-1 flex flex-col pb-0 lg:pb-4 w-full md:w-auto">
                {/* Header Row with Line */}
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4 lg:mb-5">
                  <h2 className="text-2xl md:text-3xl text-white font-normal tracking-wide whitespace-nowrap">Connectivity</h2>
                  <div className="hidden md:flex flex-1 h-[1px] bg-gradient-to-r from-[#3b82f6] to-transparent items-center">
                    <div className="w-1.5 h-1.5 bg-[#3b82f6] rotate-45 ml-auto mr-4 lg:mr-12 opacity-80" />
                  </div>
                </div>
                {/* Bracket Box */}
                <div className="relative border-l border-b border-[#3b82f6]/40 p-4 lg:p-5 pl-4 lg:pl-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center max-w-[350px] mb-4 gap-1 sm:gap-0">
                    <span className="text-white text-sm md:text-[15px]">Pune Airport –</span>
                    <span className="text-white font-bold text-lg md:text-xl flex items-baseline gap-2">
                      17 km <span className="text-white font-normal text-xs">(~40 minutes)</span>
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center max-w-[350px] gap-1 sm:gap-0">
                    <span className="text-white text-sm md:text-[15px]">Pune Railway Station –</span>
                    <span className="text-white font-bold text-lg md:text-xl flex items-baseline gap-2">
                      11 km <span className="text-white font-normal text-xs">(~30 minutes)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>

          {/* RIGHT SIDE GROUP - Design Excellence */}
          <motion.div variants={rightIn} className="flex flex-col lg:flex-row w-full lg:w-[50%] relative mt-8 md:mt-16 lg:mt-[120px] z-10 items-center lg:items-start">
            
            {/* Text Container - Standard flow on mobile, offset on lg */}
            <div className="flex flex-col flex-1 relative z-20 pt-0 lg:pt-16 pr-0 lg:pr-[250px] w-full">
              {/* Header Row with Line */}
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4 lg:mb-5">
                <h2 className="text-2xl md:text-3xl text-white font-normal tracking-wide whitespace-nowrap">Design Excellence</h2>
                <div className="hidden md:flex w-[80px] h-[1px] bg-gradient-to-r from-[#3b82f6] to-transparent items-center">
                  <div className="w-1.5 h-1.5 bg-[#3b82f6] rotate-45 ml-auto opacity-80" />
                </div>
              </div>
              
              {/* Bracket Box */}
              <div className="relative border-l border-b border-[#3b82f6]/40 p-4 lg:p-3 pl-4 lg:pl-6">
                <p className="text-white text-xs md:text-sm leading-relaxed mb-3">
                  The project is thoughtfully planned to deliver maximum efficiency and user comfort:
                </p>
                <ul className="text-white text-xs md:text-[13px] leading-relaxed list-disc pl-4 space-y-1">
                  <li>Optimized core design to enhance internal space utilization</li>
                  <li>Efficient vertical transportation systems for seamless movement</li>
                  <li>Maximized usable office areas for superior workplace layouts</li>
                  <li>Integrated recreational and office spaces to support employee well-being</li>
                  <li>Optimized floor plates for flexibility and better space utility</li>
                </ul>
              </div>
            </div>

            {/* Large Trailing Image - Centered and relative on mobile, absolute pushed right on lg */}
            <div className="relative lg:absolute mt-10 lg:mt-0 lg:bottom-48 lg:-right-[10%] w-56 h-56 md:w-64 md:h-64 lg:w-[320px] lg:h-[320px] rounded-full overflow-hidden border-[3px] border-white/10 z-10">
              <img 
                src={info3} 
                alt="Design Excellence" 
                className="w-full h-full object-cover" 
              />
            </div>
            
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default ProjectInfo;