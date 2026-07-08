// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import BottomNavbar from '../Amenities/BottomNavbar';
// import backImg from '../../assets/back.png'; // Ensure this path is correct

// export default function LobbyReception() {
//   const navigate = useNavigate();

//   // 1. Define your specific VR links for THIS page
//   const terraceLinks = [
//     { label: "Reception Lobby", url: "https://kuula.co/share/Lfm7Q?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=0&inst=0" },
//     { label: "Lift Lobby", url: "https://kuula.co/share/Lfm7S?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=0&inst=0" }, 
//     // { label: "Infinity Pool", url: "https://kuula.co/share/collection/7McF2?logo=0" },
//   ];

//   // 2. State to track which VR link is currently active
//   const [activeVrUrl, setActiveVrUrl] = useState(terraceLinks[0].url);

//   return (
//     <div className="relative w-full h-screen bg-black overflow-hidden">

//       {/* FIXED BACK BUTTON */}
//       <button
//         className="absolute top-12 left-6 w-[44px] h-[44px] lg:w-[50px] lg:h-[50px] bg-white rounded-[30%] border border-white/20 flex items-center justify-center z-[1100] cursor-pointer shadow-xl hover:bg-gray-100 transition-colors"
//         onClick={() => navigate("/amenities")} // Fixed the navigate call
//       >
//         <img
//           src={backImg}
//           alt="Back"
//           className="w-5 h-5 lg:w-6 lg:h-6"
//         />
//       </button>

//       {/* VR IFRAME - Plays inside this window and is interactive */}
//       <div className="absolute inset-0 z-0">
//         <iframe
//           src={activeVrUrl}
//           width="100%"
//           height="100%"
//           allowFullScreen
//           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//           className="border-none"
//         ></iframe>
//       </div>

//       {/* DYNAMIC NAVBAR */}
//       <BottomNavbar 
//         links={terraceLinks} 
//         onSelect={(url) => setActiveVrUrl(url)} 
//         activeUrl={activeVrUrl} 
//       />
//     </div>
//   );
// }

// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import BottomNavbar from '../Amenities/BottomNavbar';
// import backImg from '../../assets/back.png'; // Ensure this path is correct

// export default function PodiumLevel() {
//   const navigate = useNavigate();

//   // 1. Define your specific VR links for THIS page
//   const terraceLinks = [
//     { label: "Podium 1", url: "https://kuula.co/share/Lfm7r?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=0&inst=0" },
//     { label: "Podium 2", url: "https://kuula.co/share/Lfm7t?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=0&inst=0" }, 
//     // { label: "Infinity Pool", url: "https://kuula.co/share/collection/7McF2?logo=0" },
//   ];

//   // 2. State to track which VR link is currently active
//   const [activeVrUrl, setActiveVrUrl] = useState(terraceLinks[0].url);

//   return (
//     <div className="relative w-full h-screen bg-black overflow-hidden">

//       {/* FIXED BACK BUTTON */}
//       <button
//         className="absolute top-12 left-6 w-[44px] h-[44px] lg:w-[50px] lg:h-[50px] bg-white rounded-[30%] border border-white/20 flex items-center justify-center z-[1100] cursor-pointer shadow-xl hover:bg-gray-100 transition-colors"
//         onClick={() => navigate("/amenities")} // Fixed the navigate call
//       >
//         <img
//           src={backImg}
//           alt="Back"
//           className="w-5 h-5 lg:w-6 lg:h-6"
//         />
//       </button>

//       {/* VR IFRAME - Plays inside this window and is interactive */}
//       <div className="absolute inset-0 z-0">
//         <iframe
//           src={activeVrUrl}
//           width="100%"
//           height="100%"
//           allowFullScreen
//           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//           className="border-none"
//         ></iframe>
//       </div>

//       {/* DYNAMIC NAVBAR */}
//       <BottomNavbar 
//         links={terraceLinks} 
//         onSelect={(url) => setActiveVrUrl(url)} 
//         activeUrl={activeVrUrl} 
//       />
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from './BottomNavbar';
import PanoramaViewer from './PanoramaViewer';
import backImg from '../../assets/back.png';
import keyPlanImg from "../../assets/Keyplan.png";
import { useAmenitiesScenes } from "../../hooks/useAmenitiesScenes";

type Scene = {
  id: string;
  label: string;
  imageUrl: string;
};

export default function LobbyReception() {
  const navigate = useNavigate();

  // 🔥 Fetch from API (NO useEffect here)
  const { scenes, loading } = useAmenitiesScenes("reception");

  const keyPlanHotspots = [
  {
    id: "reception lobby",
    x: 51,
    y: 73,
    getScene: () => scenes.find(s => s.label === "Reception Lobby")
  },
  {
    id: "lift",
    x: 46,
    y: 64,
    getScene: () => scenes.find(s => s.label === "Lift Lobby")
  },
  {
    id: "cafteria",
    x: 36,
    y: 50,
    getScene: () => scenes.find(s => s.label === "Cafeteria")
  }
];


const [activeScene, setActiveScene] = useState<Scene | null>(null);
const [fade, setFade] = useState(false);

// ✅ Set default scene when data arrives
useEffect(() => {
  if (scenes.length > 0) {
      setActiveScene(scenes[0]);
    }
  }, [scenes]);

  // ✅ Fade animation
  useEffect(() => {
    if (activeScene) {
      requestAnimationFrame(() => setFade(true));
    }
  }, [activeScene]);

  // ✅ Scene change
  const handleSceneChange = (id: string) => {
    const nextScene = scenes.find((scene) => scene.id === id);

    if (!nextScene || nextScene.id === activeScene?.id) return;

    setFade(false);
    
    setTimeout(() => {
      setActiveScene(nextScene);
    }, 300);
  };
  
  // No loading screen — render nothing until the scene is ready (data is local/instant).
  if (loading || !activeScene) {
    return null;
  }

  // ✅ Helper function to render the correct overlay text
    const renderOverlayContent = () => {
      if (activeScene.label === "Cafeteria") {
        return (
          <>
            <h3 className="text-[11px] md:text-[14px] lg:text-[16px] font-semibold mb-2">Cafeteria</h3>
            <ul className="text-[10px] md:text-[12px] lg:text-[14px] text-gray-200 space-y-2 list-disc pl-4">
    <li>Skyline dining with a social vibe</li>
    <li>Refresh, recharge, reconnect</li>
  </ul>
          </>
        );
      }
      return null; // Returns nothing for other tabs
    };
  
    const overlayContent = renderOverlayContent();


  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">

      {/* Back Button */}
      <button
        className="absolute top-12 left-6 w-[50px] h-[50px] bg-white rounded-2xl z-[1100] flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        onClick={() => navigate("/amenities")}
      >
        <img src={backImg} alt="Back" className="w-6 h-6" />
      </button>

      {/* The 3D Engine — persistent across scene changes; PanoramaViewer swaps
          the panorama internally so switching never flashes black. */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full">
          <PanoramaViewer
            imageUrl={activeScene.imageUrl}
            title={activeScene.label}
            width="100vw"
            height="100vh"
            autoRotate={true}
            fov={75}
          />
        </div>
      </div>

      <div className="absolute bottom-16 -right-8 z-[100] w-[220px] md:w-[260px]">
  <div className="relative w-full">

    <img
      src={keyPlanImg}
      alt="Key Plan"
      className="w-full object-contain rounded-xl"
    />

   {keyPlanHotspots.map((spot) => (
  <button
    key={spot.id}
    onClick={() => {
      const scene = spot.getScene();

      if (!scene) {
        console.error("Scene not found for:", spot.id);
        return;
      }

      setFade(false);

      setTimeout(() => {
        setActiveScene(scene);
      }, 100);
    }}
    className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-md transition
      ${
        activeScene?.label === spot.getScene()?.label
          ? "bg-green-400 scale-110"
          : "bg-yellow-400"
      }
    `}
    style={{
      left: `${spot.x}%`,
      top: `${spot.y}%`,
      transform: "translate(-50%, -50%)",
    }}
  />
))}

  </div>
</div>

{/* 🌟 Glassmorphic Information Overlay (Bottom Left) - Only renders if there is content */}
      {overlayContent && (
        <div 
          className={`absolute bottom-20 left-4 z-10 w-[160px] md:bottom-24 md:left-8 md:w-[200px] lg:w-[230px] p-5 rounded-2xl bg-[linear-gradient(179deg,rgba(16,92,168,0.16)_1.11%,rgba(6,36,66,0.57)_110.86%)] backdrop-blur-md border border-white/20 text-white pointer-events-none transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}
        >
          {overlayContent}
        </div>
      )}

      {/* Glass Bottom Navbar */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center z-10 pointer-events-auto">
        {/* <BottomNavbar 
          links={podiumScenes.map(scene => ({ label: scene.label, url: scene.id }))} 
          onSelect={handleSceneChange} 
          activeUrl={activeScene.id} 
        /> */}
        <BottomNavbar
          links={scenes.map(scene => ({
            label: scene.label,
            url: scene.id
          }))}
          onSelect={handleSceneChange}
          activeUrl={activeScene.id}
        />
      </div>
    </div>
  );
}