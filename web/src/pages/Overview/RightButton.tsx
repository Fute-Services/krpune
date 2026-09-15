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