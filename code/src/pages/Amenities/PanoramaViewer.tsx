import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

export interface PanoramaViewerProps {
  imageUrl: string;
  width?: string;
  height?: string;
  autoRotate?: boolean;
  fov?: number;
  title?: string;
}

export default function PanoramaViewer({
  imageUrl,
  width = "100%",
  height = "100vh", // Changed to fill screen by default
  autoRotate = true,
  fov = 75,
  // title,
}: PanoramaViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null); // Added ref for the mesh
  const geometryRef = useRef<THREE.SphereGeometry | null>(null); // shared sphere geometry
  const frameRef = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ lon: 180, lat: 0 });
  const autoRotSpeed = useRef<number>(0.03);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentFov, setCurrentFov] = useState<number>(fov);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const applyRotation = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    const lat = clamp(rotation.current.lat, -85, 85);
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(rotation.current.lon);
    
    const target = new THREE.Vector3(
      500 * Math.sin(phi) * Math.cos(theta),
      500 * Math.cos(phi),
      500 * Math.sin(phi) * Math.sin(theta)
    );
    camera.lookAt(target);
  }, []);

  // ── Init the renderer/scene/camera ONCE. Never torn down on scene change,
  //    so switching panoramas never destroys the canvas (= no black flash). ──
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(fov, container.clientWidth / container.clientHeight, 1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace; // vivid, not washed out
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    geometryRef.current = geometry;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (autoRotate && !isDragging.current) {
        rotation.current.lon += autoRotSpeed.current;
      }
      applyRotation();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      const old = sphereRef.current as any;
      if (old) {
        old.material?.map?.dispose?.();
        old.material?.dispose?.();
      }
      geometry.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // Run once — the renderer must persist across scene changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load the panorama texture when imageUrl changes and SWAP it in only once
  //    it is ready, keeping the previous panorama on screen until then. ──
  useEffect(() => {
    const scene = sceneRef.current;
    const geometry = geometryRef.current;
    if (!scene || !geometry || !imageUrl) return;

    let cancelled = false;
    setIsLoading(true);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      imageUrl,
      (texture: any) => {
        if (cancelled) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;

        const newMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }));
        const oldMesh = sphereRef.current as any;

        // Add the new panorama, THEN remove the old one — atomically between
        // render frames, so there is never a frame with an empty (black) scene.
        scene.add(newMesh);
        sphereRef.current = newMesh;

        if (oldMesh) {
          scene.remove(oldMesh);
          oldMesh.material?.map?.dispose?.();
          oldMesh.material?.dispose?.(); // geometry is shared — do NOT dispose it
        }
        setIsLoading(false);
      },
      undefined,
      (err: any) => {
        console.error("PanoramaViewer: failed to load texture", err);
        if (!cancelled) setIsLoading(false);
      }
    );

    return () => { cancelled = true; };
  }, [imageUrl]);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.fov = currentFov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [currentFov]);

  const resetIdleTimer = () => {
    autoRotSpeed.current = 0;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      autoRotSpeed.current = 0.03;
    }, 3000);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    prevMouse.current = { x: e.clientX, y: e.clientY };
    resetIdleTimer();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - prevMouse.current.x;
    const dy = e.clientY - prevMouse.current.y;
    rotation.current.lon -= dx * 0.25;
    rotation.current.lat += dy * 0.25;
    prevMouse.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = () => { isDragging.current = false; };

  const zoom = (direction: number) => {
    setCurrentFov((f) => clamp(f + direction * 5, 30, 100));
    resetIdleTimer();
  };

  const toggleFullscreen = () => {
    const el = mountRef.current?.parentElement;
    if (!document.fullscreenElement) {
      el?.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    wrapper: {
      position: "relative",
      width,
      height,
      background: "#000000", // Dark background
      overflow: "hidden",
      fontFamily: "sans-serif",
      cursor: isDragging.current ? "grabbing" : "grab",
      userSelect: "none",
    },
    canvas: { width: "100%", height: "100%", touchAction: "none" },
    // FIX 4: Changed loader background from whitish to dark transparent black
    loader: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0, 0, 0, 0.9)", // Solid dark loader
      color: "#ffffff",
      gap: "14px",
      zIndex: 10,
    },
    spinner: {
      width: "36px",
      height: "36px",
      border: "3px solid rgba(255, 255, 255, 0.1)",
      borderTop: "3px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    },
    controls: { position: "absolute", top: "14px", right: "14px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 5 },
    btn: { width: "36px", height: "36px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", color: "#fff", cursor: "pointer", backdropFilter: "blur(4px)" },
    badge: { position: "absolute", bottom: "14px", left: "14px", background: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: "8px", color: "#fff", fontSize: "12px", zIndex: 5 },
  };

  return (
    <div style={styles.wrapper}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        ref={mountRef}
        style={styles.canvas}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      {!isLoading && (
        <>
          <div style={styles.controls}>
            <button style={styles.btn} onClick={() => zoom(-1)}>+</button>
            <button style={styles.btn} onClick={() => zoom(1)}>−</button>
            <button style={styles.btn} onClick={toggleFullscreen}>{isFullscreen ? "⊠" : "⛶"}</button>
          </div>
          
        </>
      )}
    </div>
  );
}