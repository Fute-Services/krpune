import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from './BottomNavbar';
import PanoramaViewer from './PanoramaViewer';
import backImg from '../../assets/back.png';
import { useAmenitiesScenes } from "../../hooks/useAmenitiesScenes";
import keyPlanImg from "../../assets/Keyplan.png";

type Scene = {
  id: string;
  label: string;
  imageUrl: string;
};

export default function GroundLevel() {
  const navigate = useNavigate();

 const keyPlanHotspots = [
  {
    id: "entry",
    x: 35,
    y: 75,
    getScene: () => scenes.find(s => s.label === "Entry Gate")
  },
  {
    id: "drop",
    x: 47,
    y: 75,
    getScene: () => scenes.find(s => s.label === "Drop off")
  },
  {
    id: "retail",
    x: 70,
    y: 70,
    getScene: () => scenes.find(s => s.label === "Retail Zone")
  }
];
  
  const { scenes, loading } = useAmenitiesScenes("ground");

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

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">

      {/* Back Button */}
      <button
        className="absolute top-12 left-6 w-[50px] h-[50px] bg-white rounded-2xl z-[1100] flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        onClick={() => navigate("/amenities")}
      >
        <img src={backImg} alt="Back" className="w-6 h-6" />
      </button>

      {/* The 3D Engine — kept mounted across scene changes; PanoramaViewer
          swaps the panorama internally so switching never flashes black. */}
      <div className="absolute inset-0 z-[0]">
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

      {/* Key Plan (Bottom Right) */}
<div className="absolute bottom-16 -right-8 z-[1000] pointer-events-auto w-[220px] md:w-[260px]">
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