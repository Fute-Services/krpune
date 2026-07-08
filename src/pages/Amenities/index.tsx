// import { useEffect, useState } from 'react';
// import firstImage from '../../assets/amenities/Aminities.jpg';
// import secondImage from '../../assets/amenities/secondimage1.jpg';
// import thirdImage from '../../assets/amenities/GroundLevel.jpg';
// import Button from '@/pages/Amenities/Button';

// export default function AmenitiesPage() {


//   const data = [

//     {

//       id: 1,
//       name: "Podium Level",
//       image: firstImage,

//       // imageSettings: {

//       //   width: "3810",

//       //   height: "2000",

//       //   viewBox: "0 0 3810 2000"

//       // },

//       imageSettings: {

//         width: "3362",

//         height: "1488",

//         viewBox: "0 0 3362 1488"

//       },

//       // pointsofcircle: [

//       //   { id: 1, coords: "2641,1496,40 ", px: "", py: "", size: "", hoverColor: "#0a3b6a" },

//       //   { id: 1, coords: "2488,1899,40 ", px: "", py: "", size: "", hoverColor: "#0a3b6a" }

//       // ],

//       pointsofcircle: [

//         {
//           id: 1, coords: "2237,1007,23", px: "", py: "", size: "", hoverColor: "#0a3b6a", title: "podium"
//           , link: "https://kuula.co/share/collection/7McJN?logo=0&info=1&fs=1&vr=0&sd=1&thumbs=1"

//         },

//         // { id: 1, coords: "2159,1250,23", px: "", py: "", size: "", hoverColor: "#0a3b6a" }

//       ],

//     },

//     {

//       id: 2,
//       name: "Terrace Level",
//       image: secondImage,

//       // imageSettings: {

//       //   width: "1929",

//       //   height: "1000",

//       //   viewBox: "0 0 1929 1000"

//       // },

//       imageSettings: {

//         width: "3382",

//         height: "1536",

//         viewBox: "0 0 3382 1536",


//       },

//       // pointsofcircle: [

//       //   { id: 1, coords: "1144,201,20", px: "", py: "", size: "", hoverColor: "#0a3b6a" }

//       // ],

//       pointsofcircle: [

//         {
//           id: 1, coords: "2164,291,23", px: "", py: "", size: "", hoverColor: "#0a3b6a", title: " terrace"
//           , link: "https://kuula.co/share/collection/7McF2?logo=1&info=1&fs=1&vr=0&sd=1&thumbs=1"
//         }

//       ],

//     },



//     {

//       id: 3,
//       name: "Ground Level",
//       image: thirdImage,

//       // imageSettings: {

//       //   width: "1929",

//       //   height: "1000",

//       //   viewBox: "0 0 1929 1000"

//       // },

//       imageSettings: {

//         width: "3382",

//         height: "1536",

//         viewBox: "0 0 3382 1536"

//       },

//       // pointsofcircle: [

//       //   { id: 1, coords: "1144,201,20", px: "", py: "", size: "", hoverColor: "#0a3b6a" }

//       // ],

//       pointsofcircle: [

//         {
//           id: 1, coords: "2343,1142,20", px: "", py: "", size: "", hoverColor: "#0a3b6a", title: "retail"
//           , link: "https://kuula.co/share/collection/7McF2?logo=1&info=1&fs=1&vr=0&sd=1&thumbs=1"
//         },
//         {
//           id: 1, coords: "1244,1043,20", px: "", py: "", size: "", hoverColor: "#0a3b6a", title: "entry"
//           , link: "https://kuula.co/share/collection/7McF2?logo=1&info=1&fs=1&vr=0&sd=1&thumbs=1"
//         },
//         {
//           id: 1, coords: "1061,899,20", px: "", py: "", size: "", hoverColor: "#0a3b6a", title: "dropoff"
//           , link: "https://kuula.co/share/collection/7McFz?logo=1&info=1&fs=1&vr=0&sd=1&thumbs=1"
//         }

//       ],

//     }

//   ];
//   // const data = [
//   //   {
//   //     id: 1,
//   //     name: "Podium Level",
//   //     image: firstImage,
//   //     imageSettings: { width: "3362", height: "1488", viewBox: "0 0 3362 1488" },
//   //     pointsofcircle: [{ id: 101, coords: "2237,1007,23" }],
//   //   },
//   //   {
//   //     id: 2,
//   //     name: "Terrace Level",
//   //     image: secondImage,
//   //     imageSettings: { width: "3382", height: "1536", viewBox: "0 0 3382 1536" },
//   //     pointsofcircle: [{ id: 201, coords: "2164,291,23" }],
//   //   },
//   //   {
//   //     id: 3,
//   //     name: "Ground Level",
//   //     image: thirdImage,
//   //     imageSettings: { width: "3382", height: "1536", viewBox: "0 0 3382 1536" },
//   //     pointsofcircle: [{ id: 301, coords: "2164,291,23" }],
//   //   }
//   // ];

//   const [activeIndex, setActiveIndex] = useState(0);
//   const [isLarge, setIsLarge] = useState(false);

//   // Logic for First Button (Toggles between index 0 and 1)
//   const handleTerraceToggle = () => {
//     setActiveIndex((prev) => (prev === 1 ? 0 : 1));
//   };

//   // Logic for Second Button (Toggles between index 0 and 2)
//   const handleGroundToggle = () => {
//     setActiveIndex((prev) => (prev === 2 ? 0 : 2));
//   };

//   const current = data[activeIndex];

//   useEffect(() => {
//     const handleResize = () => setIsLarge(window.innerWidth >= 1024);
//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   const buttonStyle = `
//     mt-6 bg-gradient-to-r from-[#407bb6] to-[rgb(84,142,198)]
//     text-[10px] md:text-[12px] lg:text-[16.5px] tracking-wide font-medium text-white
//     lg:px-4 lg:py-4 rounded-3xl border border-white/40 shadow-lg 
//     shadow-[0_4px_12px_rgba(255,255,255,0.25)]
//     transition-all duration-300 ease-in-out
//     hover:from-[#356aa0] hover:to-[rgb(70,125,180)]
//     hover:shadow-2xl hover:border-white/70
//     px-1 py-2 md:px-3 md:py-3.5 rounded-3xl   
    
    
//   `;

//   // Helper to find link by title
//   const getLinkByTitle = (title: any) => {
//     const point = current.pointsofcircle.find(p => p.title === title);
//     return point ? point.link : "#";
//   };

//   return (
//     <div className="h-screen w-full flex flex-col items-center justify-center ">

//       <div className="bg-white/30 w-screen h-screen">
//         <svg
//           viewBox={current.imageSettings.viewBox}
//           className="w-full h-full"
//           preserveAspectRatio={isLarge ? "none" : "xMidYMid meet"}
//         >
//           <image
//             href={current.image}
//             width={current.imageSettings.width}
//             height={current.imageSettings.height}
//           />

//           {current.pointsofcircle.map((point) => {
//             const [x, y, r] = point.coords.split(',').map(Number);
//             return (
//               <g key={point.id}>
//                 {/* Animated Ripple */}
//                 <circle cx={x} cy={y} r={r} fill="none" stroke="white" strokeWidth="6" opacity="0.8">
//                   <animate attributeName="r" from={r} to={r * 2} dur="1.5s" repeatCount="indefinite" />
//                   <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
//                 </circle>
//                 {/* Main Marker */}
//                 <circle cx={x} cy={y} r={r} className="fill-[#0a3b6a] cursor-pointer" />
//               </g>
//             );
//           })}
//         </svg>
//       </div>



//       {/* Navigation Buttons */}
//       <div className='flex gap-5 absolute bottom-[37%] md:bottom-[30%]   xl:bottom-[5%] lg:bottom-[7%] left-3 lg:left-10 lg:translate-x-14'>
//         {(activeIndex === 1 || activeIndex === 0) && (<button onClick={handleTerraceToggle}  className={buttonStyle}>
//           {activeIndex === 1 ? "Back to Amenities" : "Terrace Level "}
//         </button>)}

//         {(activeIndex === 2 || activeIndex === 0) && (<button onClick={handleGroundToggle} className={buttonStyle}>
//           {activeIndex === 2 ? "Back to Amenities" : "Ground Level "}
//         </button>)}
//       </div>

//       {/* Dynamic Floating Label Component */}
//       {activeIndex === 1 && (
//         // <a href={getLinkByTitle("terrace")} target="_blank" className="...">
//         <Button   className='absolute xl:top-[20%]  lg:top-[20%] lg:py-[3px] lg:left-[78%]  md:top-[33%]
//            md:left-[77%] md:py-[5px] top-[40%] left-[77%]  -translate-x-1/2 -translate-y-1/2
//            px-2 py-2 md:px-[5%] md:h-[5%] xl:w-[15%] lg:w-[18%] lg:w-[15%] lg:h-[8%]
//         text-white text-[9px] md:text-[9px] lg:text-[13px] font-medium tracking-wide whitespace-nowrap

//         bg-gradient-to-tr ${variants[variant]}

//         rounded-tl-[28px]
//         rounded-bl-[10px]
//         rounded-br-[28px]
//         rounded-tr-[10px]

//         border border-white/80
//         shadow-[0_10px_30px_rgba(0,0,0,0.4)]

//         backdrop-blur-md

//         transition-all duration-300 ease-in-out

//         hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)]
//         hover:border-white/60
//         hover:brightness-110'>
//           Terrace Level
//         </Button>
//         //  </a> 
//       )}

//       {activeIndex === 0 && (
//         <a href={getLinkByTitle("podium")} target="_blank" className="...">
//           <Button className='absolute lg:top-[55%]  md:top-[52%] md:left-[85%] 
//         lg:right-[5%] top-[53%] -right-[3%] -translate-x-1/2 -translate-y-1/2'>
//             Podium Level
//           </Button></a>
//       )}

//       {activeIndex === 2 && (
//         // <a href={getLinkByTitle("retail")} target="_blank" className="...">
//         // <Button className='absolute lg:bottom-[19%] lg:right-[5%] md:bottom-[38%] md:right-[9%]
//         //  md:px-4 top-[53%] -right-[3%] py-4 -translate-x-1/2 -translate-y-1/2'>
//         <Button className='absolute top-[55%] right-[1%] md:top-[63%] md:right-[7%] lg:top-[74%] lg:right-[2%]
//          md:px-4  py-4 -translate-x-1/2 -translate-y-1/2'>
//           Retail Area
//         </Button>
//         // </a>
//       )}

//       {activeIndex === 2 && (
//         <a href={getLinkByTitle("dropoff")} target="_blank" className="...">
//           <Button
//             className='absolute lg:top-[65%] lg:left-[20%] md:bottom-[30%]
//            md:left-[30%] top-[55%] left-[22%]  -translate-x-1/2 -translate-y-1/2
//            px-2 py-2 md:px-[5%] md:h-[5%] lg:w-[14%] lg:h-[8%]
//         text-white text-[9px] md:text-[9px] lg:px-[10px] lg:text-[14px] font-medium tracking-wide

//         bg-gradient-to-tr ${variants[variant]}

//         rounded-tl-[28px]
//         rounded-bl-[10px]
//         rounded-br-[28px]
//         rounded-tr-[10px]

//         border border-white/80
//         shadow-[0_10px_30px_rgba(0,0,0,0.4)]

//         backdrop-blur-md

//         transition-all duration-300 ease-in-out

//         hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)]
//         hover:border-white/60
//         hover:brightness-110
//            '>
//             Drop Off
//           </Button></a>
//       )}

//       {activeIndex === 2 && (
//         <a href={getLinkByTitle("entry")} target="_blank" className="...">
//           <Button className='absolute lg:top-[79%] lg:px-[10px] lg:left-[40%] md:bottom-[60%] md:left-[40%] top-[60%] left-[38%] 
//          -translate-x-1/2 
//         -translate-y-1/2

//         px-2 py-2 md:px-[5%] md:h-[5%]  lg:w-[14%] lg:h-[8%]
//         text-white text-[9px] md:text-[9px] lg:text-[14px] font-medium tracking-wide

//         bg-gradient-to-tr ${variants[variant]}

//         rounded-tl-[28px]
//         rounded-bl-[10px]
//         rounded-br-[28px]
//         rounded-tr-[10px]

//         border border-white/80
//         shadow-[0_10px_30px_rgba(0,0,0,0.4)]

//         backdrop-blur-md

//         transition-all duration-300 ease-in-out

//         hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)]
//         hover:border-white/60
//         hover:brightness-110
        
        
//         '>
//             Entry Gate
//           </Button></a>
//       )}
//     </div>
//   );
// }

import { useState } from 'react';
import ButtonDiv from '@/pages/Amenities/AmenitiesButtons';
import AboutUs from '@/pages/ProjectDetails/AboutUs';
import AboutUsBg from '../../assets/amenities/cam 4  2.png';

export default function AmenitiesPage() {
  const [showAboutUs, setShowAboutUs] = useState(false);

  const handleAboutUsClose = () => {
    setShowAboutUs(false);
  };

  const handleAboutUsOpen = () => {
    setShowAboutUs(true);
  };

  return (
    <>
      <div 
  className="relative w-full h-screen overflow-hidden
             bg-no-repeat bg-cover
             bg-[40%_center] md:bg-top lg:bg-center"
  style={{
    backgroundImage: `url(${import.meta.env.BASE_URL}media/amenities/cam_4_2_igzh94.png)`,
    backgroundColor: '#000' // Optional: adds a black bar background
  }}
>

        {/* Updated ButtonDiv with 4 buttons */}
        {!showAboutUs && (
          <div className='fixed z-[1200] lg:-translate-x-[90%] lg:left-[90%] md:left-[95%] md:top-[75%] lg:top-[85%] left-[90%] top-[78%] lg:-translate-y-[90%] -translate-y-[80%] -translate-x-[90%]'>
            <ButtonDiv />
          </div>
        )}
        
      </div>
    </>
  );
}