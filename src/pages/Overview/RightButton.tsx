// import { useNavigate } from "react-router-dom";

// export default function RightButton(
//     // {handleFloorPlanClick, handleCirculationPlanClick}:any
// ) {
//     const navigate = useNavigate();
//     return (
//         <div className=" rounded-[40px] 
//          bg-blue-700/25 border backdrop-blur-[2%]
//           shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] 
//            lg:w-[175px] lg:h-[125px] md:w-[170px] md:h-[130px]  
//            w-[160px] h-[120px] items-center"
//             style={{
//                 display: "flex", color: "white", gap: "5px",
//                 flexDirection: "column", padding: "2px",
//                 // backdropFilter: 'blur(12px)',

//                 WebkitBackdropFilter: 'blur(12px)',
//                 border: "1px solid rgba(255, 255, 255, 0.5)",
//             }}>

//             {/* Primary Button  bg-gradient-to-r from-[#105CA8] to-[#062442] */}
//             <button className={`w-[80%] h-[38%] hover:w-[85%] mt-2 transition-all duration-500 
//             ease-in-out rounded-tl-[25px] rounded-tr-md rounded-bl-md rounded-br-[25px]
//       ${window.location.pathname === "/sustainability" ? " bg-[#0a2647] border-sky-100/30" : "  bg-gradient-to-r from-[#1c4f80]/80 to-[#4a8fc7]"}
        
//         shadow-lg hover:bg-[#0a355e] 
//         transition-all text-[13px] tracking-wide border border-white/20 flex items-center justify-center`}
//                 style={{ color: "white" }}
//                 // onClick={handleFloorPlanClick}
//                 onClick={() => navigate("/sustainability")}
//             >
//                 Sustainability
//             </button>

//             {/* Secondary Button */}
//             <button className={`w-[80%] hover:w-[85%] h-[38%] rounded-tl-[25px] rounded-tr-md rounded-bl-md rounded-br-[25px]
//  ${window.location.pathname === "/concept_summary" ? " bg-[#0a2647] border-sky-100/40" : "  bg-gradient-to-r from-[#1c4f80]/80 to-[#4a8fc7]"}
//         shadow-lg hover:bg-[#0a355e]  border border-blue-500 
//           shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/40 
//           transition-all duration-500 ease-in-out
//         transition-all text-[12.5px] tracking-wide hover:bg-[#0a355e] shadow-inner flex items-center justify-center  
//          text-white  `}
//                 style={{
//                     // backgroundColor: 'transparent',
//                     backdropFilter: 'blur(12px)',
//                     WebkitBackdropFilter: 'blur(12px)',
//                     border: '1px solid rgba(255, 255, 255, 0.6)',
//                     cursor: 'pointer',
//                     display: 'flex'
//                 }}
//                 // onClick={handleCirculationPlanClick}
//                 onClick={() => navigate("/concept_summary")}
//             >
//                 Concept Summary
//             </button>

//         </div>
//     );
// }

import { useNavigate } from "react-router-dom";

export default function BottomNavbar() {
    const navigate=useNavigate();
  return (
    <div className="relative w-full h-[10vh]  flex items-center justify-center">

      {/* Glass Container */}
      <div className="flex items-center gap-3 py-1 lg:py-2.5 px-2  md:px-6
        ">

        {/* Walkthrough (expands → right) */}
        <button
          className="px-5 md:px-8 py-2 md:py-3 text-[11px] md:text-sm  tracking-wide text-white
         bg-[linear-gradient(153deg,#407BB6_16.82%,#76ACE2_141.72%)]
          border border-white/20 shadow-lg
         rounded-3xl
          transition-all duration-500 ease-out
           hover:shadow-blue-500/30
          active:scale-95" onClick={()=>navigate("/walkthrough")}>
          Walkthrough
        </button>

        {/* Gallery (expands ← left) */}
        <button
          className="px-6 md:px-12 py-2 md:py-3 text-[11px] md:text-sm  tracking-wide text-white
        bg-[linear-gradient(153deg,#407BB6_16.82%,#76ACE2_141.72%)] 
        backdrop-blur-md border border-white/30
          shadow-inner 
          rounded-3xl   hover:shadow-blue-500/30
          transition-all duration-500 ease-out
         
          active:scale-95" onClick={()=>navigate("/gallery")}>
           {/* <button
          className="pl-8 pr-8 py-2 text-sm font-semibold tracking-wide text-white
          bg-white/10 backdrop-blur-md border border-white/30
          shadow-inner
          rounded-2xl
          transition-all duration-500 ease-out
          hover:bg-white/20
          active:scale-95"> */}
          Gallery
        </button>

      </div>
    </div>
  );
}