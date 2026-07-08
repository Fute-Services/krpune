import { useNavigate } from 'react-router-dom';
import backImg from '../../assets/back.png';

export default function Construction() {
    const navigate=useNavigate()
    return (
        <div className="w-screen h-screen flex justify-center bg-blue-50 items-center p-4">

            {/* Back Button */}
            <button
                onClick={()=>navigate(-1)}
                className="
      absolute left-2 top-10 -translate-y-1/2

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
                {/* Offline: local video (drop file at public/media/videos/construction.mp4) */}
                <video
                    src={`${import.meta.env.BASE_URL}media/videos/construction.mp4`}
                    className="w-screen h-screen rounded-xl shadow-lg object-contain"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                />
            </div>
        </div>
    );
}

// import { useNavigate } from 'react-router-dom';
// import { useEffect, useRef, useState } from 'react';
// import Player from '@vimeo/player';
// import backImg from '../../assets/back.png';
// import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

// export default function Construction() {
//   const navigate = useNavigate();
//   const iframeRef = useRef<HTMLIFrameElement>(null);
//   const playerRef = useRef<Player | null>(null);

//   const [isPlaying, setIsPlaying] = useState(true);
//   const [isMuted, setIsMuted] = useState(true);

//   useEffect(() => {
//     // Initialize Vimeo Player from the iframe
//     if (iframeRef.current) {
//       playerRef.current = new Player(iframeRef.current);

//       // Sync local state if the video autoplays successfully
//       playerRef.current.getPaused().then((paused) => setIsPlaying(!paused));
//       playerRef.current.getMuted().then((muted) => setIsMuted(muted));
//     }

//     return () => {
//       if (playerRef.current) {
//         playerRef.current.destroy();
//       }
//     };
//   }, []);

//   const togglePlay = async () => {
//     if (playerRef.current) {
//       if (isPlaying) {
//         await playerRef.current.pause();
//       } else {
//         await playerRef.current.play();
//       }
//       setIsPlaying(!isPlaying);
//     }
//   };

//   const toggleMute = async () => {
//     if (playerRef.current) {
//       const newMuteState = !isMuted;
//       await playerRef.current.setMuted(newMuteState);
//       setIsMuted(newMuteState);
//     }
//   };

//   return (
//     <div className="relative w-screen h-screen overflow-hidden bg-black">
      
//       {/* 1. The Video Layer (Vimeo link only) */}
//       <div className="absolute inset-0 w-full h-full pointer-events-none">
//         <iframe
//           ref={iframeRef}
//           src="https://player.vimeo.com/video/1184042049?h=cd516961c9&autoplay=1&muted=1&loop=1&autopause=0"
//           className="w-full h-full scale-[1.35]" // scale hides the vimeo UI/bars
//           allow="autoplay; fullscreen; picture-in-picture"
//         />
//       </div>

//       {/* 2. Overlay: Back Button (Top Left) */}
//       <button
//         onClick={() => navigate(-1)}
//         className="absolute left-6 top-10 z-50 w-[52px] h-[52px] flex items-center justify-center bg-white rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:scale-105 transition-all duration-300"
//       >
//         <img src={backImg} alt="Back" className="w-6 h-6" />
//       </button>

//       {/* 3. Overlay: Custom Controls (Bottom Middle) */}
//       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-3 bg-[#1e293b]/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
        
//         {/* Play/Pause Button */}
//         <button 
//           onClick={togglePlay}
//           className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
//         >
//           {isPlaying ? (
//             <FaPause className="text-white text-lg" />
//           ) : (
//             <FaPlay className="text-white text-lg ml-1" />
//           )}
//         </button>

//         {/* Mute/Unmute Button */}
//         <button 
//           onClick={toggleMute}
//           className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
//         >
//           {isMuted ? (
//             <FaVolumeMute className="text-white text-lg" />
//           ) : (
//             <FaVolumeUp className="text-white text-lg" />
//           )}
//         </button>
//       </div>

//       {/* 4. Overlay: Logo (Bottom Left) */}
      

//     </div>
//   );
// }