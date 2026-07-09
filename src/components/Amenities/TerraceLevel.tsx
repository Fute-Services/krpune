// import { useEffect, useState } from 'react';
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

// export default function TerraceLevel() {
//   const navigate = useNavigate();

//   // 🔥 Fetch from API (NO useEffect here)
//   const { scenes, loading } = useAmenitiesScenes("terrace");

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

//       {/* Viewer (persistent → no black flash) */}
//       <div
//         className={`absolute inset-0 transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-80"
//           }`}
//       >
//         <PanoramaViewer
//           imageUrl={activeScene.imageUrl}
//           title={activeScene.label}
//           width="100vw"
//           height="100vh"
//           autoRotate={true}
//           fov={75}
//         />
//       </div>

//       {/* Bottom Navbar */}
//       <div className="absolute bottom-10 left-0 w-full flex justify-center z-10 pointer-events-auto">
//         {/* <BottomNavbar 
//           links={podiumScenes.map(scene => ({ label: scene.label, url: scene.id }))} 
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from './BottomNavbar (1)';
import PanoramaViewer from './PanoramaViewer';
import backImg from '../../assets/back.png';
import { useAmenitiesScenes } from "../../hooks/useAmenitiesScenes";
import keyPlanImg from "../../assets/b2.png";

type Scene = {
  id: string;
  label: string;
  imageUrl: string;
};

export default function TerraceLevel() {
  const navigate = useNavigate();

  // 🔥 Fetch from API (NO useEffect here)
  const { scenes, loading } = useAmenitiesScenes("terrace");

  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [fade, setFade] = useState(false);

  const keyPlanHotspots = [
  {
    id: "terrace amenities",
    x: 75,
    y: 75,
    getScene: () => scenes.find(s => s.label === "Terrace Amenities")
  },
  {
    id: "terrace food court",
    x: 80,
    y: 60,
    getScene: () => scenes.find(s => s.label === "Terrace Food Court")
  },
  {
    id: "multi-purpose court",
    x: 50,
    y: 65,
    getScene: () => scenes.find(s => s.label === "Multi-purpose Court")
  },
  {
    id: "sports area",
    x: 25,
    y: 50,
    getScene: () => scenes.find(s => s.label === "Sports Area")
  },
];

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
    if (activeScene.label === "Multi-purpose Court") {
      return (
        <>
          <h3 className="text-[11px] md:text-[14px] lg:text-[16px] font-semibold mb-2">Multipurpose Courts</h3>
          <ul className="text-[10px] md:text-[12px] lg:text-[14px] text-gray-200 space-y-2 list-disc pl-4">
  <li>Play, compete, energize</li>
  <li>Active spaces for team spirit and fitness</li>
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

      {/* Viewer (persistent → no black flash) */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-auto ${fade ? "opacity-100" : "opacity-80"
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

        <div className="absolute bottom-16 right-0 md:bottom-20 md:right-2 lg:bottom-6 lg:right-4 z-[1000] pointer-events-auto w-[220px] md:w-[260px]">
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

      {/* Bottom Navbar */}
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