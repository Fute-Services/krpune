// import React, { useEffect, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// // @ts-ignore
// import backImg from "../../assets/back.png";

// declare global {
//   interface Window {
//     pannellum: any;
//   }
// }

// export default function Vr() {
//   const navigate = useNavigate();
//   const [currentScene, setCurrentScene] = useState<string>("entrygate");
//   const viewerRef = useRef<any>(null);

//   const tourConfig: any = {
//     default: {
//       firstScene: "entrygate",
//       autoLoad: true,
//       sceneFadeDuration: 0,
//     },
//     scenes: {
//       entrygate: {
//         panorama: "/VR/entrygate.jpeg",
//         // panorama: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776410526/entrygate_hnlbze.jpg",
//         yaw: 350,
//         hotSpots: [
//           { 
//             pitch: -10, yaw: 350, type: "custom", 
//             createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), 
//             createTooltipArgs: { text: " Entry Gate", next: "dropoff", rotation: 0 } 
//           }
//         ]
//       },
//       dropoff: {
//         panorama: "/VR/dropoff.jpeg",
//         // panorama: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776410525/dropoff_jkedjy.jpg",
//         yaw: -10,
//         hotSpots: [
//           { 
//             pitch: -25, yaw: 0, type: "custom", 
//             createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), 
//             createTooltipArgs: { text: " Entry Gate", next: "entrygate", rotation: 180 } 
//           },
//           { 
//             pitch: -20, yaw: -10, type: "custom", 
//             createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), 
//             createTooltipArgs: { text: "Reception", next: "reception", rotation: 280 } 
//           },
//           { 
//             pitch: -15, yaw: 0, type: "custom", 
//             createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), 
//             createTooltipArgs: { text: "Retail & Amenities", next: "retail", rotation: 0 } 
//           }
//         ]
//       },
//       retail: {
//         panorama: "/VR/retail.jpeg",
//         // panorama: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776410532/retail_qzuvno.jpg",
//         hotSpots: [{ pitch: -20, yaw: 0, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: " Drop Off", next: "dropoff", rotation: 180 } }]
//       },
//       reception: {
//         panorama: "/VR/reception.jpeg",
//           //  panorama: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776409578/reception_znsboa.jpg",
//         hotSpots: [
//           { pitch: -20, yaw: 5, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: " Drop Off", next: "dropoff", rotation: 180 } },
//           { pitch: -10, yaw: 5, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: "Lift Lobby", next: "leftlobby" ,rotation: 90} }
//         ]
//       },
//       leftlobby: {
//         panorama: "/VR/leftlobby.jpeg",
//           // panorama: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776409574/leftlobby_hhdbqu.jpg",
//         pitch: -20,
//         hotSpots: [
//           { pitch: -35, yaw: 10, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: " Reception", next: "reception", rotation: 90 } },
//           { pitch: -35, yaw: 0, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: "Podium 1", next: "podium1" } }
//         ]
//       },
//       podium1: {
//         panorama: "/VR/Podium1.jpeg",
//         //  panorama: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776410527/Podium1_ccpkiv.jpg",
//         yaw: 205,
//         hotSpots: [
//           { pitch: -25, yaw: 208, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: " Lift Lobby", next: "leftlobby", rotation: 180 } },
//           { pitch: -16, yaw: 205, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: "Podium 2", next: "podium2",rotation: 300 } },
//           { pitch: -23, yaw: 195, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: "Terrace Amenities", next: "terrace1" ,rotation: 260} },
//           { pitch: -20, yaw: 220, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: "Ground Level", next: "entrygate", rotation: 90 } }
//         ]
//       },
//       podium2: {
//         panorama: "/VR/Podium2.jpeg",
//           // panorama: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776410530/Podium2_ct3xcx.jpg",
//         pitch:-20,
//         hotSpots: [
//           { pitch: 0, yaw: 45, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: " Podium 1", next: "podium1", rotation: 90 } },
//         ]
//       },
//       terrace2: {
//         panorama: "/VR/terrace2.jpeg",
//         //  panorama: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776410029/terrace2_lgrepr.jpg",
//         yaw: 185,
//         hotSpots: [
        
//           // New connection to Terrace 1
//           { pitch: -15, yaw: 185, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: "Terrace Amenities", next: "terrace1", rotation: 180 } },
//         ]
//       },
//       terrace1: {
//         panorama: "/VR/terrace1.jpeg",
//           // panorama: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776410029/terrace1_bepxpf.jpg",
//         hotSpots: [
//           { pitch: -15, yaw: 0, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: " Terrace food court ", next: "terrace2", rotation: 0 } },
//             { pitch: -23, yaw: 0, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: " Podium ", next: "podium1", rotation: 180 } },
//           { pitch: -20, yaw: 10, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: "Multipurpose Court", next: "terrace",rotation: 90 } },
//         ]
//       },
//       terrace: {
//         panorama: "/VR/terrace.jpeg",
//         //  panorama: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776410032/terrace_j7plaz.jpg",
//         hotSpots: [
//           { pitch: -27, yaw: 0, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: " Terrace 2", next: "terrace2", rotation: 180 } },
//           // New connection to Terrace Sports
//           { pitch: -20, yaw: 10, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: "Sports Area", next: "terrace_sports", rotation: 90 } }
//         ]
//       },
//       terrace_sports: {
//         panorama: "/VR/terrace_sports.jpeg",
//         // panorama: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776410027/terrace_sports_whgiwg.jpg",
//         pitch: -10,
//         hotSpots: [
//           { pitch: -25, yaw: -10, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: "Back to Court", next: "terrace", rotation: 270 } },
//                  { pitch: -27, yaw: 0, type: "custom", createTooltipFunc: (d:any, a:any) => createCustomHotspot(d,a), createTooltipArgs: { text: "Back to Start", next: "entrygate", rotation: 180 } },

//         ]
//       }
//     }
//   };

//   const createCustomHotspot = (hotspotDiv: any, args: any) => {
//     hotspotDiv.classList.add('custom-hotspot-main');
//     const img = document.createElement('img');
//     img.src = '/VR/arrowfinal.png'; 
//     img.className = 'custom-arrow-asset';
//     img.setAttribute('draggable', 'false');
    
//     const angle = args.rotation || 0;
//     setTimeout(() => {
//         img.style.transform = `rotate(${angle}deg)`;
//     }, 10);

//     const span = document.createElement('span');
//     span.innerHTML = args.text;
//     span.className = 'hotspot-label';
//     hotspotDiv.appendChild(img);
//     hotspotDiv.appendChild(span);
    
//     img.onclick = () => {
//       if (viewerRef.current) {
//         viewerRef.current.loadScene(args.next);
//         setCurrentScene(args.next);
//       }
//     };
//   };

//   useEffect(() => {
//     if (window.pannellum && !viewerRef.current) {
//       viewerRef.current = window.pannellum.viewer('pan-container', {
//         ...tourConfig,
//         "showControls": false, 
//         "mouseZoom": true,
//         "autoRotate": -2,
//         "autoRotateInactivityDelay": 5000
//       });
//     }
//     return () => {
//       if (viewerRef.current) {
//         viewerRef.current.destroy();
//         viewerRef.current = null;
//       }
//     };
//   }, []);

//   const handleZoomIn = () => viewerRef.current?.setHfov(viewerRef.current.getHfov() - 10);
//   const handleZoomOut = () => viewerRef.current?.setHfov(viewerRef.current.getHfov() + 10);

//   const getDisplayName = (id: string) => {
//     const names: any = {
//       entrygate:"GROUND LEVEL",
//       dropoff: "DROP OFF",
//       reception: "RECEPTION",
//       leftlobby: "LIFT LOBBY",
//       podium1: "PODIUM 1",
//       podium2: "PODIUM 2",
//       terrace: "TERRACE - MULTIPURPOSE COURT",
//       terrace2: "TERRACE - FOOD COURT",
//       terrace1: "TERRACE - AMENITIES",
//       terrace_sports: "TERRACE - SPORTS ZONE",
//       retail: "RETAIL AND AMENITIES"
//     };
//     return names[id] || id.toUpperCase();
//   };

//   return (
//     <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">
//       <style>{`
//         .custom-hotspot-main { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; pointer-events: auto !important; }
//         .custom-arrow-asset { 
//           width: 90px !important; 
//           height: 90px !important; 
//           min-width: 90px !important; 
//           min-height: 90px !important; 
//           cursor: pointer !important; 
//           display: block !important; 
//           transition: transform 0.3s ease !important, opacity 0.2s ease !important; 
//           opacity: 0.6;
//           user-select: none !important;
//           -webkit-user-drag: none !important;
//         }
//         .custom-arrow-asset:hover { opacity: 1; }
//         .hotspot-label { visibility: hidden; position: absolute; bottom: 120px; background: rgba(0,0,0,0.8); color: white; padding: 6px 15px; border-radius: 20px; white-space: nowrap; font-weight: bold; font-size: 14px; border: 1px solid rgba(255,255,255,0.2); pointer-events: none; }
//         .custom-hotspot-main:hover .hotspot-label { visibility: visible; }
//         .pnlm-hotspot-base { background: none !important; }
//         .pnlm-load-box { display: none !important; }
//       `}</style>

//       {/* Back Button */}
//       <button className="absolute top-8 left-8 z-50 w-12 h-12 rounded-full
//        bg-white flex items-center justify-center shadow-xl hover:scale-110 
//        active:scale-90 transition-all cursor-pointer" onClick={() => navigate(-1)}>
//         <img src={backImg} alt="Back" className="w-5 h-5" />
//       </button>

//       {/* Zoom Controls */}
//       <div className="absolute right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
//         <button onClick={handleZoomIn} className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-2xl flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-lg">+</button>
//         <button onClick={handleZoomOut} className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-2xl flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-lg">−</button>
//       </div>

//       <div id="pan-container" className="w-full h-full"></div>

//       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
//         <div className="bg-black/70 backdrop-blur-md text-white px-8 py-3 rounded-full border border-white/10 shadow-2xl font-bold tracking-[0.25em] text-xs sm:text-sm uppercase text-center">
//           {getDisplayName(currentScene)}
//         </div>
//       </div>
//     </div>
//   );
// }