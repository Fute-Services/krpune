// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import BottomNavbar from './BottomNavbar (1)';
// import PanoramaViewer from './PanoramaViewer';
// import backImg from '../../assets/back.png';
// import { useAmenitiesScenes } from "../../hooks/useAmenitiesScenes";

// type Scene = {
//   id: string;
//   label: string;
//   imageUrl: string;
// };

// export default function PodiumLevel() {
//   const navigate = useNavigate();

//   // 🔥 Fetch from API (NO useEffect here)
//   const { scenes, loading } = useAmenitiesScenes("podium");

//   const [activeScene, setActiveScene] = useState<Scene | null>(null);
//   const [fade, setFade] = useState(false);

//   // ✅ Set default scene when data arrives
//   useEffect(() => {
//     if (scenes.length > 0) {
//       setActiveScene(scenes[0]);
//     }
//   }, [scenes]);

//   // ✅ Fade animation
//   useEffect(() => {
//     if (activeScene) {
//       requestAnimationFrame(() => setFade(true));
//     }
//   }, [activeScene]);

//   // ✅ Scene change
//   const handleSceneChange = (id: string) => {
//     const nextScene = scenes.find((scene) => scene.id === id);

//     if (!nextScene || nextScene.id === activeScene?.id) return;

//     setFade(false);

//     setTimeout(() => {
//       setActiveScene(nextScene);
//     }, 300);
//   };

//   // ✅ Loading state
//   if (loading || !activeScene) {
//     return (
//       <div className="w-full h-screen flex items-center justify-center bg-black text-white">
//         Loading...
//       </div>
//     );
//   }

//   return (
//     <div className="relative w-full h-screen bg-black overflow-hidden">

//       {/* Back Button */}
//       <button
//         className="absolute top-12 left-6 w-[50px] h-[50px] bg-white rounded-2xl z-[1100] flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
//         onClick={() => navigate("/amenities")}
//       >
//         <img src={backImg} alt="Back" className="w-6 h-6" />
//       </button>

//       {/* The 3D Engine */}
//       <div className="absolute inset-0 z-0">
//         <div
//           key={activeScene.id}
//           className={`w-full h-full transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-20"
//             }`}
//         >
//           <PanoramaViewer
//             imageUrl={activeScene.imageUrl}
//             title={activeScene.label}
//             width="100vw"
//             height="100vh"
//             autoRotate={true}
//             fov={75}
//           />
//         </div>
//       </div>

//       {/* Bottom Navbar */}
//       <div className="absolute bottom-10 left-0 w-full flex justify-center z-10 pointer-events-auto">
//         {/* <BottomNavbar 
//           links={podiumScenes?.map(scene => ({ label: scene.label, url: scene.id }))} 
//           onSelect={handleSceneChange} 
//           activeUrl={activeScene.id} 
//         /> */}
//         <BottomNavbar
//           links={scenes.map(scene => ({
//             label: scene.label,
//             url: scene.id
//           }))}
//           onSelect={handleSceneChange}
//           activeUrl={activeScene.id}
//         />
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from './BottomNavbar (1)';
import PanoramaViewer from './PanoramaViewer';
import backImg from '../../assets/back.png';
import { useAmenitiesScenes } from "../../hooks/useAmenitiesScenes";
import keyPlanImg from "../../assets/C13__1_1_ar8idt.png";

type Scene = {
  id: string;
  label: string;
  imageUrl: string;
};

export default function PodiumLevel() {
  const navigate = useNavigate();

  // 🔥 Fetch from API (NO useEffect here)
  const { scenes, loading } = useAmenitiesScenes("podium");
  
  const keyPlanHotspots = [
  {
    id: "landscape walking paths",
    x: 55,
    y: 50,
    getScene: () => scenes.find(s => s.label === "Landscape Walking Paths")
  },
  {
    id: "sit-out zones",
    x: 10,
    y: 66,
    getScene: () => scenes.find(s => s.label === "Sit-Out Zones")
  },
  {
    id: "food court",
    x: 85,
    y: 65,
    getScene: () => scenes.find(s => s.label === "Food Court")
  },
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

  // ✅ Loading state
  if (loading || !activeScene) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  // ✅ Helper function to render the correct overlay text
  const renderOverlayContent = () => {
  if (activeScene.label === "Landscape Walking Paths") {
    return (
      <>
        <h3 className="text-[11px] md:text-[14px] lg:text-[16px] font-semibold mb-2">Landscape Walking Paths</h3>
        <ul className="text-[10px] md:text-[12px] lg:text-[14px] text-gray-200 space-y-2 list-disc pl-4">
          <li>Walk, unwind, and recharge in green surroundings</li>
          <li>Nature-inspired pathways for everyday wellness</li>
        </ul>
      </>
    );
  }
  
  if (activeScene.label === "Sit-Out Zones") {
    return (
      <>
        <h3 className="text-[11px] md:text-[14px] lg:text-[16px] font-semibold mb-2">Sit-Out Zones</h3>
        <ul className="text-[10px] md:text-[12px] lg:text-[14px] text-gray-200 space-y-2 list-disc pl-4">
          <li>Pause points for ideas and conversations</li>
          <li>Relaxed corners for work beyond the desk</li>
        </ul>
      </>
    );
  }
  
  // Return null for Food Court or any undefined scene
  return null;
};

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">

      {/* Back Button */}
      <button
        className="absolute top-12 left-6 w-[50px] h-[50px] bg-white rounded-2xl z-[1100] flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        onClick={() => navigate("/amenities")}
      >
        <img src={backImg} alt="Back" className="w-6 h-6" />
      </button>

      {/* The 3D Engine */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <div
          key={activeScene.id}
          className={`w-full h-full transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-20"
            }`}
        >
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

       <div className="hidden md:block absolute bottom-20 md:bottom-24 lg:bottom-6 right-4 z-[100] w-[220px] md:w-[190px]">
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

      {/* 🌟 Glassmorphic Information Overlay (Bottom Left) */}
      {/* ADDED CONDITION HERE to hide the wrapper entirely for the Food Court */}
      {activeScene.label !== "Food Court" && (
        <div 
          className={`absolute bottom-20 left-4 z-10 w-[160px] md:bottom-24 md:left-8 md:w-[200px] lg:w-[230px] p-5 rounded-2xl bg-[linear-gradient(179deg,rgba(16,92,168,0.16)_1.11%,rgba(6,36,66,0.57)_110.86%)] backdrop-blur-md border border-white/20 text-white pointer-events-none transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}
        >
          {renderOverlayContent()}
        </div>
      )}

      {/* Bottom Navbar */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center z-10 pointer-events-auto">
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