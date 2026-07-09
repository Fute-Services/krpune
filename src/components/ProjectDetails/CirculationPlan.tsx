import React from 'react';
import { useNavigate } from 'react-router-dom';
import backImg from '../../assets/back.png';

/**
 * FitoutPage component that replicates the layout of the provided reference image,
 * excluding the top and bottom navigation bars.
 */
const Circulation: React.FC = () => {
  const navigate=useNavigate()
  return (
    <div className="w-screen h-screen flex justify-center bg-blue-50 items-center p-4">
    
                {/* Back Button */}
                <button
                    onClick={()=>navigate(-1)}
                    className="
          absolute left-10 top-10 -translate-y-1/2
    
          w-[40px] h-[40px]
          sm:w-11 sm:h-11
          lg:w-[52px] lg:h-[52px]
    
         
    
          flex items-center justify-center
    
          bg-white
          backdrop-blur-md
          border border-white/30
    
          rounded-xl
          shadow-[0_6px_20px_rgba(0,0,0,0.25)]
    
          hover:bg-white/90 hover:scale-105
          transition-all duration-300
        "
                >
                    <img
                        src={backImg}
                        alt="Back"
                        className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] lg:w-6 lg:h-6"
                    />
                </button>
    
    
                <div className="w-screen h-screen aspect-video">
                    <iframe
                        src="https://player.vimeo.com/video/1187614937?h=1e6cb4f8a7&autoplay=1&muted=1&loop=1&autopause=0"
                        className="w-screen h-screen rounded-xl shadow-lg"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
  );
}

export default Circulation;