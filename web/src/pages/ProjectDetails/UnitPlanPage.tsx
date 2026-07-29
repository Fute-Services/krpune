// import { useParams, useNavigate } from "react-router-dom";
// import backImg from '../../assets/back.png';
// import upIcon from '../../assets/unit/up-icon.png';
// import downIcon from '../../assets/unit/down-icon.png';

// import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import bgUnit from '../../assets/unit/bgunit.jpeg';
// import compess from '../../assets/unit/compass.png';
// import reset from '../../assets/unit/reset.png';
// import zoomout from '../../assets/unit/Zoomout-icon.jpg';
// import zoomin from '../../assets/unit/zoomin-icon.png';

// import { getFloors } from '@/api/floorServices';
// import Fitout from '@/pages/ProjectDetails/Fitout';

// const legendConfig: Record<string, { color: string; label: string }[]> = {
//     floor: [
//         { color: '#7da2c7', label: '5 toilet' },
//         { color: '#cfc6c3', label: '8 AHU room' },
//         { color: '#d4a3a3', label: '2 fire tower' },
//         { color: '#dcd2c1', label: '9 lift lobby' },
//     ],
//     mlcp: [
//         { color: '#89A1D3', label: '2 Driver Lounge' },
//         { color: '#E9ED98', label: '2 fire tower' },
//         { color: '#E8A19A', label: '3 lift lobby' },
//         { color: '#FF8ACD', label: '1 toilet' },
//     ],
//     podium: [
//         { color: '#9FC093', label: ' 3 Working Pods' },
//         { color: '#E9ED98', label: '2 Food Kiosk' },
//         { color: '#E8A19A', label: '8 lift lobby' },
//         { color: '#FF8ACD', label: '5 toilet' },
//     ],
//     upperGF: [
//         { color: '#A6F5D8', label: '1 Driver room' },
//         { color: '#E9ED98', label: '2 fire tower' },
//         { color: '#E8A19A', label: '6 lift lobby' },
//         { color: '#FF8ACD', label: '3 toilet' },
//     ],
// };

// export default function UnitPlanPage() {
//     const { id } = useParams<{ id: string }>();
//     const navigate = useNavigate();

//     const [floorData, setFloors] = useState<any[]>([]);
//     const [isLoading, setIsLoading] = useState(true);

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const res = await getFloors();
//                 setFloors(res.data.data || []);
//             } catch (error) {
//                 console.error("Fetch failed", error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchData();
//     }, []);

//     const unitData = useMemo(() => {
//         if (!floorData.length) return null;
//         return floorData.find((f) => String(f.id) === String(id));
//     }, [floorData, id]);

//     const units = unitData?.units || [];
//     const currentUnit = units.length > 0 ? units[0] : null;

//     const [selectedImageIndex, setSelectedImageIndex] = useState(0);
//     const [isPanelOpen, setIsPanelOpen] = useState(true);
//     const [activeRoom, setActiveRoom] = useState<string | null>(null);
//     const [zoom, setZoom] = useState(1);
//     const [position, setPosition] = useState({ x: 0, y: 0 });
//     const [isDragging, setIsDragging] = useState(false);
//     const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
//     const [showOverlay, setShowOverlay] = useState(true);
//     const [showFitout, setShowFitout] = useState(false);
//     // Use the 'id' directly from useParams, which is always a string
// const isLowerGround = id === '19';

// // Add this temporarily to check your console (F12) and see what value React is actually seeing:
// console.log("Current URL ID:", id, "| Is Lower Ground?", isLowerGround);

//     const [imgSize3D, setImgSize3D] = useState({ w: 2000, h: 1125 }); // 3D image size

//     // 👇 ADD THIS NEW useEffect BLOCK RIGHT HERE 👇
//     useEffect(() => {
//         // If currentUnit exists and has items in sideContent, set the first one as active
//         if (currentUnit?.sideContent?.length > 0) {
//             setActiveRoom(currentUnit.sideContent[0].name);
//         }
//     }, [currentUnit]);
//     // 👆 -------------------------------------- 👆

//     const containerRef = useRef<HTMLDivElement>(null);
//     const minimapRef = useRef<HTMLDivElement>(null);
//     const [transformOrigin, setTransformOrigin] = useState('bottom right');

//     const computeOrigin = useCallback(() => {
//         if (!containerRef.current || !minimapRef.current) return;
//         const cRect = containerRef.current.getBoundingClientRect();
//         const mRect = minimapRef.current.getBoundingClientRect();
//         const cx = mRect.left + mRect.width / 2 - cRect.left;
//         const cy = mRect.top + mRect.height / 2 - cRect.top;
//         const ox = ((cx / cRect.width) * 100).toFixed(2) + '%';
//         const oy = ((cy / cRect.height) * 100).toFixed(2) + '%';
//         setTransformOrigin(`${ox} ${oy}`);
//     }, []);

//     useEffect(() => {
//         computeOrigin();
//         window.addEventListener('resize', computeOrigin);
//         return () => window.removeEventListener('resize', computeOrigin);
//     }, [computeOrigin]);

//     const handleMiniMapClick = () => {
//         const next = (selectedImageIndex + 1) % 2;
//         computeOrigin();
//         setSelectedImageIndex(next);
//     };

//     useEffect(() => {
//         if (zoom > 1) setIsPanelOpen(false);
//         else setIsPanelOpen(true);
//     }, [zoom]);

//     useEffect(() => {
//         if (zoom > 1) setShowOverlay(false);
//         else setShowOverlay(true);
//     }, [zoom]);

//     const handleZoomIn = () => setZoom(p => Math.min(p + 0.2, 2));
//     const handleZoomOut = () => {
//         setZoom(p => {
//             const n = Math.max(p - 0.2, 0.6);
//             if (n <= 1) setPosition({ x: 0, y: 0 });
//             return n;
//         });
//     };
//     const resetView = () => { setZoom(1); setPosition({ x: 0, y: 0 }); setShowOverlay(true); };

//     const handleOverlayClick = () => {
//         setShowOverlay(false);
//         setZoom(1.3);
//         setPosition({ x: 0, y: 0 });
//     };

//     useEffect(() => {
//         const onMouseMove = (e: MouseEvent) => {
//             if (isDragging && zoom > 1) {
//                 setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
//             }
//         };
//         const onTouchMove = (e: TouchEvent) => {
//             if (isDragging && zoom > 1) {
//                 if (e.cancelable) e.preventDefault();
//                 const t = e.touches[0];
//                 setPosition({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
//             }
//         };
//         const onEnd = () => setIsDragging(false);
//         if (isDragging) {
//             window.addEventListener('mousemove', onMouseMove);
//             window.addEventListener('touchmove', onTouchMove, { passive: false });
//             window.addEventListener('mouseup', onEnd);
//             window.addEventListener('touchend', onEnd);
//         }
//         return () => {
//             window.removeEventListener('mousemove', onMouseMove);
//             window.removeEventListener('touchmove', onTouchMove);
//             window.removeEventListener('mouseup', onEnd);
//             window.removeEventListener('touchend', onEnd);
//         };
//     }, [isDragging, zoom, dragStart]);

//     const onMouseDown = (e: React.MouseEvent) => {
//         if (zoom > 1) { setIsDragging(true); setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); }
//     };
//     const onTouchStart = (e: React.TouchEvent) => {
//         if (zoom > 1) {
//             const t = e.touches[0];
//             setIsDragging(true);
//             setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
//         }
//     };

//     if (isLoading) {
//         return (
//             <div className="h-screen w-full flex items-center justify-center bg-[#101010] text-white">
//                 <div className="animate-pulse">Loading Unit Details...</div>
//             </div>
//         );
//     }

//     if (!unitData) {
//         return (
//             <div className="h-screen w-full flex flex-col items-center justify-center bg-[#101010] text-white gap-4">
//                 <p>Floor data not found for ID: {id}</p>
//                 <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded">Go Back</button>
//             </div>
//         );
//     }

//     if (!currentUnit) {
//         return (
//             <div className="h-screen w-full flex items-center justify-center bg-[#101010] text-white">
//                 <p>No units available for {unitData.name}</p>
//             </div>
//         );
//     }

//     const getFloorType = (): string => {
//         const fid = unitData.id;
//         if (fid >= 1 && fid <= 17) return 'floor';
//         if (fid === 18) return 'upperGF';
//         if (fid === 20) return 'podium';
//         if (fid >= 21 && fid <= 26) return 'mlcp';
//         return 'floor';
//     };

//     const currentLegend = legendConfig[getFloorType()];
//     const planImages = [currentUnit.image3D, currentUnit.image2D];
//     const nextImage = planImages[(selectedImageIndex + 1) % planImages.length];

//     const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
//     const DUR = '680ms';

//     const is3dActive = selectedImageIndex === 0;
//     const is2dActive = selectedImageIndex === 1;
//     const isHiddenFloor = id === '19' || id === '27';

//     return (
//         <div
//             className="h-screen w-full bg-cover bg-no-repeat relative overflow-hidden flex font-sans"
//             style={{ backgroundImage: `url(${bgUnit})` }}
//         >
//             <div className="absolute bottom-[5%] left-2 sm:left-10 font-normal text-white opacity-35 pointer-events-none leading-none whitespace-nowrap z-0 select-none text-[18vw] sm:text-[14vw] lg:text-[10vw]">
//                 {unitData.name}
//             </div>

//           <button
//     className="absolute bottom-[2%] sm:bottom-[4%] right-4 sm:right-24 z-[100] px-6 py-2 sm:px-8 sm:py-2 rounded-[30px] font-sans font-medium text-[13px] sm:text-[16px] text-[#0f2e50] cursor-pointer shadow-lg hover:brightness-110 transition-all border border-white/20"
//     style={{ background: 'var(--navbar, #90C7FF)' }}
//     onClick={() => setShowFitout(true)}
// >
//     Fit out plan
// </button>

//             <button
//                 className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 lg:top-[24px] lg:left-[24px] xl:top-[30px] xl:left-[50px] w-[38px] h-[38px] sm:w-11 sm:h-11 lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px] rounded-[30%] bg-white/95 backdrop-blur-md border border-white/20 flex items-center justify-center z-20 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
//                 onClick={() => navigate(-1)}
//             >
//                 <img src={backImg} alt="Back" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
//             </button>

//             {selectedImageIndex === 0 && zoom > 1 && (
//                 <button
//                     className="absolute top-[61px] left-3.5 sm:top-[74px] sm:left-5 lg:top-[60px] lg:left-[24px] xl:top-[100px] xl:left-[50px] w-[38px] h-[38px] sm:w-11 sm:h-11 lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px] rounded-[30%] bg-white/95 backdrop-blur-md border border-white/20 flex items-center justify-center z-[110] cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
//                     onClick={() => setIsPanelOpen(!isPanelOpen)}
//                 >
//                     {isPanelOpen
//                         ? <img src={downIcon} alt="Close" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
//                         : <img src={upIcon} alt="Open" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6" />}
//                 </button>
//             )}

//             {/* Side Panel */}
//             <div
//     className={`fixed left-3.5 sm:left-5 lg:left-[24px] xl:left-[30px] z-[1000] bg-transparent transition-[top] duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)] max-w-[calc(100vw-28px)] sm:max-w-none
//         ${isPanelOpen ? 'top-[110px] sm:top-[130px] lg:top-[120px] xl:top-[160px]' : '-top-full'}
//         ${selectedImageIndex === 0 || selectedImageIndex === 1 ? 'visible' : 'invisible'}`}
// >
//     {currentUnit.unitInformation?.title && (
//         <div className="mb-7 flex flex-col gap-1 font-[Poppins,sans-serif] text-white px-2">
//             <div className="text-[15px] sm:text-[17px] font-bold tracking-wide uppercase">
//                 {currentUnit.unitInformation.title}
//             </div>
//             <div className="flex gap-5 text-[13px] sm:text-[15px] opacity-90">
//                 {currentUnit.unitInformation.T1 && (
//                     <span>T1: <span className="font-extrabold">{currentUnit.unitInformation.T1}</span></span>
//                 )}
//                 {currentUnit.unitInformation.T2 && (
//                     <span>T2: <span className="font-extrabold">{currentUnit.unitInformation.T2}</span></span>
//                 )}
//             </div>
//         </div>
//     )}

//     <div className="relative pl-[22px] sm:pl-[30px] lg:pl-[28px] xl:pl-10">
//         <div className="absolute left-[5px] sm:left-[7px] lg:left-[7px] xl:left-[10px] top-4 sm:top-[25px] bottom-4 sm:bottom-[26px] w-[2px] bg-white" />
        
//         {/* 1. Evaluate if this list should be compact (e.g., more than 8 items) */}
//         {(() => {
//             // Alternatively, check by title: const isCompact = currentUnit.unitInformation?.title === "Floor X" || currentUnit.unitInformation?.title === "Floor Y";
//             const isCompact = currentUnit.sideContent && currentUnit.sideContent.length > 10;

//             return (
//                 <ul className={`list-none p-0 m-0 flex flex-col ${isCompact ? 'gap-[1.5px] sm:gap-[2px] xl:gap-[2px]' : 'gap-[3px] sm:gap-1 md:gap-[0.3px] lg:gap-[0.3px] xl:gap-2'}`}>
//                     {currentUnit.sideContent?.map((roomObj: any, index: number) => {
//                         const isFirst = index === 0;
//                         const isLast = index === currentUnit.sideContent!.length - 1;
//                         const isActive = activeRoom === roomObj.name; 

//                         return (
//                             <li
//                                 key={roomObj.id}
//                                 onClick={() => { setActiveRoom(roomObj.name); }} 
//                                 className={`relative cursor-pointer transition-all duration-300 font-[Poppins,sans-serif] not-italic
//                                     min-w-[90px] sm:min-w-[110px] lg:min-w-[120px] xl:min-w-[140px] 2xl:min-w-[150px]
                                    
//                                     /* 2. Apply dynamic sizing based on the isCompact flag */
//                                     ${isCompact 
//                                         ? 'text-[11px] sm:text-[12px] lg:text-[11px] xl:text-[13px] 2xl:text-[13px] py-[3px] px-[8px] sm:py-[4px] sm:px-[12px] xl:py-[4px] xl:px-[16px] font-medium' 
//                                         : 'text-[13px] sm:text-[15px] lg:text-[13px] xl:text-[15px] 2xl:text-[15px] py-[5px] px-[10px] sm:py-[6px] sm:px-[16px] lg:py-[5px] lg:px-[14px] xl:py-[6px] xl:px-[20px] 2xl:px-[25px] font-semibold'
//                                     }

//                                     /* Standard colors */
//                                     ${isFirst 
//                                         ? 'bg-gradient-to-r from-[#90C7FF] to-transparent text-white font-bold' 
//                                         : isActive 
//                                             ? 'bg-white text-[#305e8f] font-bold' 
//                                             : 'text-white bg-gradient-to-r from-[#105CA8] to-transparent'}`}
//                             >
//                                 <div className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-white left-[-17px] w-[17px] sm:left-[-22px] sm:w-[22px] lg:left-[-21px] lg:w-[21px] xl:left-[-28px] xl:w-[28px] 2xl:left-[-30px] 2xl:w-[30px]" />
//                                 {isFirst && (
//                                     <div className="absolute top-0 border-t-2 border-l-2 border-white rounded-tl-[20px] left-[-18px] w-[11px] h-[14px] sm:left-[-23px] sm:w-[14px] sm:h-[18px] lg:left-[-22px] lg:top-[5px] lg:w-[13px] lg:h-[16px] xl:left-[-29px] xl:w-[18px] xl:h-[22px] 2xl:left-[-31px] 2xl:w-5 2xl:h-[25px]" />
//                                 )}
//                                 {isLast && (
//                                     <div className="absolute bottom-0 border-b-2 border-l-2 border-white rounded-bl-[20px] left-[-18px] w-[11px] h-[14px] sm:left-[-23px] sm:w-[14px] sm:h-[18px] lg:left-[-22px] lg:top-[8px] lg:w-[13px] lg:h-[16px] xl:left-[-29px] xl:w-[18px] xl:h-[22px] 2xl:left-[-31px] 2xl:w-5 2xl:h-[25px]" />
//                                 )}
//                                 {roomObj.name}
//                             </li>
//                         );
//                     })}
//                 </ul>
//             );
//         })()}
//     </div>
// </div>

//             {/* Main Content */}
//             <div
//                 ref={containerRef}
//                 className="flex-1 flex items-center justify-center relative touch-none overflow-hidden"
//                 onMouseDown={onMouseDown}
//                 onTouchStart={onTouchStart}
//             >
//                 {/* 3D VIEW */}
//                 <div
//     className="absolute inset-0 flex items-center justify-center"
//     style={{
//         transform: is3dActive ? 'scale(1)' : 'scale(0)',
//         opacity: is3dActive ? 1 : 0,
//         transformOrigin: transformOrigin,
//         transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
//         willChange: 'transform, opacity',
//         pointerEvents: is3dActive ? 'auto' : 'none',
//     }}
// >
//     <img
//     src={planImages[0] || `${planImages[0]}`}
//     alt="3D Floor Plan Base"
//     className="rounded-[20px] select-none object-contain w-full h-full
//         max-w-[98%] max-h-[88vh]
//         sm:max-w-[98%] sm:max-h-[92vh]
//         lg:max-w-[98%] lg:max-h-[95vh]
//         xl:max-w-[98%] xl:max-h-[98vh]
//         2xl:max-w-[100%] 2xl:max-h-[98vh]"
//     style={{
//         // Offsets are baked directly into the transform!
//         // -150 moves it left, -80 moves it up. Tweak these numbers as needed.
//         transform: `translate3d(${position.x - (isLowerGround ? -80 : 0)}px, ${position.y - (isLowerGround ? 120 : 0)}px, 0) scale(${zoom})`,
//         transformOrigin: 'center',
        
//         // Zero out the margins to stop them from fighting the flexbox
//         marginTop: '12vh',
//         marginRight: '25vh',
        
//         cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
//         transition: isDragging ? 'none' : `transform 700ms ${EASE}`,
//         willChange: 'transform, opacity',
//         pointerEvents: (currentUnit?.overlayImage && showOverlay) ? 'none' : 'auto',
//         opacity: (currentUnit?.overlayImage && showOverlay) ? 0 : 1,
//     }}
//     draggable={false}
//     onLoad={(e) => setImgSize3D({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
// />

//     {/* Single Floor Sinking Overlay */}
//     {selectedImageIndex === 0 && currentUnit?.overlayImage && (
//         <img
//             src={currentUnit.overlayImage}
//             alt="Floor Overlay"
//             className="absolute rounded-[20px] cursor-pointer z-50 select-none object-contain w-full h-full hover:brightness-110
//                 max-w-[98%] max-h-[88vh]
//                 sm:max-w-[98%] sm:max-h-[92vh]
//                 lg:max-w-[98%] lg:max-h-[95vh]
//                 xl:max-w-[98%] xl:max-h-[98vh]
//                 2xl:max-w-[100%] 2xl:max-h-[98vh]"
//             style={{
//                 transform: showOverlay ? `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})` : `translate3d(${position.x}px, ${position.y + 60}px, 0) scale(${zoom * 0.92})`,
//                 opacity: showOverlay ? 1 : 0,
//                 transformOrigin: 'center',
//                 marginTop: '10vh',
//                 transition: `transform 720ms ${EASE}, opacity 480ms ${EASE}`,
//                 willChange: 'transform, opacity',
//                 pointerEvents: showOverlay ? 'auto' : 'none',
//             }}
//             onClick={handleOverlayClick}
//             draggable={false}
//         />
//     )}

//     {/* 3D Polygons Overlay (Swapped to sit perfectly on top of the Single Floor Overlay) */}
//     {selectedImageIndex === 0 && currentUnit?.overlayImage && imgSize3D.w > 0 && activeRoom && (
//         <div
//             className="absolute shrink inline-flex justify-center items-center pointer-events-none z-[60]
//                 max-w-[98%] max-h-[88vh]
//                 sm:max-w-[98%] sm:max-h-[92vh]
//                 lg:max-w-[98%] lg:max-h-[95vh]
//                 xl:max-w-[98%] xl:max-h-[98vh]
//                 2xl:max-w-[100%] 2xl:max-h-[98vh]"
//             style={{
//                 // Transform and opacity perfectly bound to the Overlay image logic
//                 transform: showOverlay ? `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})` : `translate3d(${position.x}px, ${position.y + 60}px, 0) scale(${zoom * 0.92})`,
//                 opacity: showOverlay ? 1 : 0,
//                 transformOrigin: 'center',
//                 marginTop: '10vh',
//                 transition: `transform 720ms ${EASE}, opacity 480ms ${EASE}`,
//                 willChange: 'transform, opacity',
//                 pointerEvents: showOverlay ? 'auto' : 'none',
//             }}
//         >
//             {/* Invisible ghost image guarantees the parent div embraces the exact aspect ratio of the Overlay */}
//             <img src={currentUnit.overlayImage} className="opacity-0 w-auto h-auto max-w-full max-h-full object-contain pointer-events-none" />
            
//             <svg viewBox={`0 0 2000 1125`} className="absolute inset-0 w-full h-full pointer-events-none">
//                 {currentUnit.sideContent
//                     ?.filter((item: any) => item.name === activeRoom)
//                     .flatMap((item: any) => item.polygons || [])
//                     .map((poly: any, idx: number) => {
                        
//                         // Calculate the centroid/bounding box for the permanent tooltip
//                         const pts = poly.points.split(',').map(Number);
//                         let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
//                         for(let i = 0; i < pts.length; i += 2) {
//                                 if(pts[i] < minX) minX = pts[i];
//                                 if(pts[i] > maxX) maxX = pts[i];
//                                 if(pts[i+1] < minY) minY = pts[i+1];
//                                 if(pts[i+1] > maxY) maxY = pts[i+1];
//                         }
//                         const cx = (minX + maxX) / 2;
//                         const cy = minY; 


//                         return (
//                             <g key={poly.polygonId || idx}>
//     <polygon
//         points={poly.points}
//         fill="rgba(0, 123, 255, 0.6)"
//         // stroke="#ffffff"
//         strokeWidth="3"
//         className="transition-all duration-300 pointer-events-auto cursor-pointer"
//     />
    
//     {/* Centralized Box Tooltip - Renders ONLY once at a fixed top position */}
//     {idx === 0 && (
//         <foreignObject
//             x="0"
//             y="60"
//             width="2000"
//             height="100"
//             className="overflow-visible pointer-events-none"
//         >
//             <div className="flex items-start justify-center w-full h-full drop-shadow-2xl">
//                 <div 
//                     className="text-white rounded-lg whitespace-nowrap font-sans tracking-wide font-bold"
//                     style={{ fontSize: '44px' }} 
//                 >
//                     {poly.tooltip}
//                 </div>
//             </div>
//         </foreignObject>
//     )}
// </g>
//                         );
//                     })}
//             </svg>
//         </div>
//     )}
// </div>

//                 {/* 2D VIEW */}
//                 {!isHiddenFloor && (
//                     <div
//                         className="absolute inset-0 flex flex-col items-center justify-center
//                         p-[10px_8px] sm:p-[14px_10px] lg:p-3 xl:p-4
//                         gap-2 sm:gap-2.5 lg:gap-2 xl:gap-3.5"
//                     style={{
//                         transform: is2dActive ? 'scale(1)' : 'scale(0)',
//                         opacity: is2dActive ? 1 : 0,
//                         transformOrigin: transformOrigin,
//                         transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
//                         willChange: 'transform, opacity',
//                         pointerEvents: is2dActive ? 'auto' : 'none',
//                     }}
//                 >
//                     <div className="flex items-center justify-center sm:justify-between flex-wrap sm:flex-nowrap
//                         gap-[5px_8px] sm:gap-0
//                         px-[10px] py-[6px] sm:px-[14px] sm:py-[7px] lg:px-3 lg:py-[6px] xl:p-[10px] xl:px-[50px]
//                         rounded-full border border-white/20
//                         bg-gradient-to-r from-[#2461a7] via-[#5781b2] to-[#6986AF]
//                         w-full sm:w-4/5 lg:w-[65%] xl:w-[50%] 2xl:w-[50%] shrink-0">
//                         {currentLegend.map(({ color, label }) => (
//                             <div key={label} className="flex items-center gap-[5px] sm:gap-2.5 text-white whitespace-nowrap text-[11px] sm:text-[13px] lg:text-[12px] xl:text-[14px]">
//                                 <span
//                                     className="inline-block rounded-full border-2 border-white shrink-0 w-4 h-4 sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-[26px] xl:h-[26px] 2xl:w-[30px] 2xl:h-[30px]"
//                                     style={{ background: color }}
//                                 />
//                                 <span>{label}</span>
//                             </div>
//                         ))}
//                     </div>

//                     <div
//                         className="relative shrink ml-[4px] rounded-[20px]
//                             max-w-[95%] max-h-[65vh]
//                             sm:max-w-[95%] sm:max-h-[68vh]
//                             lg:max-w-[96%] lg:max-h-[72vh]
//                             xl:max-w-full xl:max-h-[74vh]
//                             2xl:max-w-full 2xl:max-h-[75vh]"
//                         style={{
//                             transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
//                             transformOrigin: 'center center',
//                             cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
//                             transition: isDragging ? 'none' : `transform 700ms ${EASE}`,
//                             willChange: 'transform',
//                             display: 'inline-flex',
//                             justifyContent: 'center',
//                             alignItems: 'center'
//                         }}
//                     >
//                         <img
//                             src={planImages[1]}
//                             alt="2D Floor Plan"
//                             className="rounded-[20px] select-none w-auto h-auto max-w-full max-h-full object-contain pointer-events-none"
//                             draggable={false}
//                         />
//                     </div>
//                 </div>
//                 )}
//             </div>

//            <img
//     src={compess}
//     alt="Compass"
//     className="absolute z-[1000] rounded-[20px]
//         w-[55px] h-[55px] top-5 right-[10px]
//         sm:w-[90px] sm:h-[90px] sm:top-[10px] sm:right-[14px]
//         md:top-[22%] md:right-[04%]
//         lg:w-[85px] lg:h-[85px] lg:top-[16%] lg:right-[6%]
//         xl:w-[105px] xl:h-[105px] xl:top-[21%] xl:right-[7%]
//         2xl:w-[125px] 2xl:h-[125px] 2xl:top-[20%] 2xl:right-[7.75%]"
// />

//             <div className="absolute -translate-y-1/2 flex flex-col gap-1.5 sm:gap-4 lg:gap-1 xl:gap-1 z-20
//                 right-[10px] sm:right-[14px] md:right-[07%] lg:right-[07%] xl:right-[10%] 2xl:right-[10%] top-1/2
//                 md:top-[50%] lg:top-[50%] xl:top-[54%]">
//                 <button
//                     className="rounded-[30%] bg-white/95 border-none outline-none flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.12)]
//                         w-9 h-9 sm:w-[42px] sm:h-[42px] lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px]"
//                     onClick={handleZoomIn}
//                 >
//                     <img src={zoomin} alt="Zoom In" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-[24px] lg:h-[24px] xl:w-[30px] xl:h-[30px]" />
//                 </button>

//                 <button
//                     disabled={zoom <= 1}
//                     className={`rounded-[30%] bg-white/95 border-none outline-none flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] mt-0.5 sm:mt-2.5 lg:mt-2 xl:mt-2.5
//                         w-9 h-9 sm:w-[42px] sm:h-[42px] lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px]
//                         ${zoom <= 1 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
//                     onClick={handleZoomOut}
//                 >
//                     <img src={zoomout} alt="Zoom out" className="w-[18px] sm:w-[22px] lg:w-[24px] xl:w-[30px] h-[5px]" />
//                 </button>

//                 {zoom !== 1 && (
//                     <button
//                         className="rounded-[30%] bg-white/95 border-none outline-none flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.12)] mt-0.5 sm:mt-2.5 lg:mt-2 xl:mt-2.5
//                             w-9 h-9 sm:w-[42px] sm:h-[42px] lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px]"
//                         onClick={resetView}
//                     >
//                         <img src={reset} alt="Reset" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-[24px] lg:h-[24px] xl:w-[30px] xl:h-[30px]" />
//                     </button>
//                 )}
//             </div>

//             {!isHiddenFloor && (
//                 <div
//                     ref={minimapRef}
//                 className="absolute bg-[#1D7AD9] flex items-center justify-center z-30 overflow-hidden cursor-pointer transition-transform
//                     bottom-[10px] right-[10px] w-[90px] h-[70px] rounded-xl
//                     sm:bottom-[14px] sm:right-[14px] sm:w-[130px] sm:h-[104px] sm:rounded-[20px]
//                     lg:bottom-[5%] lg:right-[3%] lg:w-[160px] lg:h-[124px] lg:rounded-[20px]
//                     xl:bottom-[6%] xl:right-[5.5%] xl:w-[160px] xl:h-[120px]
//                     2xl:bottom-[14%] 2xl:right-[70px] 2xl:w-[200px] 2xl:h-[130px]"
//                 onClick={handleMiniMapClick}
//             >
//                     <img src={nextImage} alt="Switch View" className="w-full h-full object-fill" />
//                 </div>
//             )}
            
//             <Fitout isOpen={showFitout} onClose={() => setShowFitout(false)} />
//         </div>
//     );
// }

// import { useParams, useNavigate } from "react-router-dom";
// import backImg from '../../assets/back.png';
// import upIcon from '../../assets/unit/up-icon.png';
// import downIcon from '../../assets/unit/down-icon.png';

// import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import bgUnit from '../../assets/unit/bgunit.jpeg';
// import compess from '../../assets/unit/compass.png';
// import reset from '../../assets/unit/reset.png';
// import zoomout from '../../assets/unit/Zoomout-icon.jpg';
// import zoomin from '../../assets/unit/zoomin-icon.png';

// import { getFloors } from '@/api/floorServices';
// import Fitout from '@/pages/ProjectDetails/Fitout';

// const legendConfig: Record<string, { color: string; label: string }[]> = {
//     floor: [
//         { color: '#7da2c7', label: '5 toilet' },
//         { color: '#cfc6c3', label: '8 AHU room' },
//         { color: '#d4a3a3', label: '2 fire tower' },
//         { color: '#dcd2c1', label: '9 lift lobby' },
//     ],
//     mlcp: [
//         { color: '#89A1D3', label: '2 Driver Lounge' },
//         { color: '#E9ED98', label: '2 fire tower' },
//         { color: '#E8A19A', label: '3 lift lobby' },
//         { color: '#FF8ACD', label: '1 toilet' },
//     ],
//     podium: [
//         { color: '#9FC093', label: ' 3 Working Pods' },
//         { color: '#E9ED98', label: '2 Food Kiosk' },
//         { color: '#E8A19A', label: '8 lift lobby' },
//         { color: '#FF8ACD', label: '5 toilet' },
//     ],
//     upperGF: [
//         { color: '#A6F5D8', label: '1 Driver room' },
//         { color: '#E9ED98', label: '2 fire tower' },
//         { color: '#E8A19A', label: '6 lift lobby' },
//         { color: '#FF8ACD', label: '3 toilet' },
//     ],
// };

// export default function UnitPlanPage() {
//     const { id } = useParams<{ id: string }>();
//     const navigate = useNavigate();

//     const [floorData, setFloors] = useState<any[]>([]);
//     const [isLoading, setIsLoading] = useState(true);

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const res = await getFloors();
//                 setFloors(res.data.data || []);
//             } catch (error) {
//                 console.error("Fetch failed", error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchData();
//     }, []);

//     const unitData = useMemo(() => {
//         if (!floorData.length) return null;
//         return floorData.find((f) => String(f.id) === String(id));
//     }, [floorData, id]);

//     const units = unitData?.units || [];
//     const currentUnit = units.length > 0 ? units[0] : null;

//     const [selectedImageIndex, setSelectedImageIndex] = useState(0);
//     const [isPanelOpen, setIsPanelOpen] = useState(true);
//     const [activeRoom, setActiveRoom] = useState<string | null>(null);
//     const [zoom, setZoom] = useState(1);
//     const [position, setPosition] = useState({ x: 0, y: 0 });
//     const [isDragging, setIsDragging] = useState(false);
//     const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
//     const [showOverlay, setShowOverlay] = useState(true);
//     const [showFitout, setShowFitout] = useState(false);
//     // Use the 'id' directly from useParams, which is always a string
//     const isLowerGround = id === '19';

//     // Add this temporarily to check your console (F12) and see what value React is actually seeing:
//     console.log("Current URL ID:", id, "| Is Lower Ground?", isLowerGround);

//     const [imgSize3D, setImgSize3D] = useState({ w: 2000, h: 1125 }); // 3D image size

//     // 👇 ADD THIS NEW useEffect BLOCK RIGHT HERE 👇
//     useEffect(() => {
//         // If currentUnit exists and has items in sideContent, set the first one as active
//         if (currentUnit?.sideContent?.length > 0) {
//             setActiveRoom(currentUnit.sideContent[0].name);
//         }
//     }, [currentUnit]);
//     // 👆 -------------------------------------- 👆

//     const containerRef = useRef<HTMLDivElement>(null);
//     const minimapRef = useRef<HTMLDivElement>(null);
//     const [transformOrigin, setTransformOrigin] = useState('bottom right');

//     const computeOrigin = useCallback(() => {
//         if (!containerRef.current || !minimapRef.current) return;
//         const cRect = containerRef.current.getBoundingClientRect();
//         const mRect = minimapRef.current.getBoundingClientRect();
//         const cx = mRect.left + mRect.width / 2 - cRect.left;
//         const cy = mRect.top + mRect.height / 2 - cRect.top;
//         const ox = ((cx / cRect.width) * 100).toFixed(2) + '%';
//         const oy = ((cy / cRect.height) * 100).toFixed(2) + '%';
//         setTransformOrigin(`${ox} ${oy}`);
//     }, []);

//     useEffect(() => {
//         computeOrigin();
//         window.addEventListener('resize', computeOrigin);
//         return () => window.removeEventListener('resize', computeOrigin);
//     }, [computeOrigin]);

//     const handleMiniMapClick = () => {
//         const next = (selectedImageIndex + 1) % 2;
//         computeOrigin();
//         setSelectedImageIndex(next);
//     };

//     useEffect(() => {
//         if (zoom > 1) setIsPanelOpen(false);
//         else setIsPanelOpen(true);
//     }, [zoom]);

//     useEffect(() => {
//         if (zoom > 1) setShowOverlay(false);
//         else setShowOverlay(true);
//     }, [zoom]);

//     const handleZoomIn = () => setZoom(p => Math.min(p + 0.2, 2));
//     const handleZoomOut = () => {
//         setZoom(p => {
//             const n = Math.max(p - 0.2, 0.6);
//             if (n <= 1) setPosition({ x: 0, y: 0 });
//             return n;
//         });
//     };
//     const resetView = () => { setZoom(1); setPosition({ x: 0, y: 0 }); setShowOverlay(true); };

//     const handleOverlayClick = () => {
//         setShowOverlay(false);
//         setZoom(1.3);
//         setPosition({ x: 0, y: 0 });
//     };

//     useEffect(() => {
//         const onMouseMove = (e: MouseEvent) => {
//             if (isDragging && zoom > 1) {
//                 setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
//             }
//         };
//         const onTouchMove = (e: TouchEvent) => {
//             if (isDragging && zoom > 1) {
//                 if (e.cancelable) e.preventDefault();
//                 const t = e.touches[0];
//                 setPosition({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
//             }
//         };
//         const onEnd = () => setIsDragging(false);
//         if (isDragging) {
//             window.addEventListener('mousemove', onMouseMove);
//             window.addEventListener('touchmove', onTouchMove, { passive: false });
//             window.addEventListener('mouseup', onEnd);
//             window.addEventListener('touchend', onEnd);
//         }
//         return () => {
//             window.removeEventListener('mousemove', onMouseMove);
//             window.removeEventListener('touchmove', onTouchMove);
//             window.removeEventListener('mouseup', onEnd);
//             window.removeEventListener('touchend', onEnd);
//         };
//     }, [isDragging, zoom, dragStart]);

//     const onMouseDown = (e: React.MouseEvent) => {
//         if (zoom > 1) { setIsDragging(true); setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); }
//     };
//     const onTouchStart = (e: React.TouchEvent) => {
//         if (zoom > 1) {
//             const t = e.touches[0];
//             setIsDragging(true);
//             setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
//         }
//     };

//     if (isLoading) {
//         return (
//             <div className="h-screen w-full flex items-center justify-center bg-[#101010] text-white">
//                 <div className="animate-pulse">Loading Unit Details...</div>
//             </div>
//         );
//     }

//     if (!unitData) {
//         return (
//             <div className="h-screen w-full flex flex-col items-center justify-center bg-[#101010] text-white gap-4">
//                 <p>Floor data not found for ID: {id}</p>
//                 <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded">Go Back</button>
//             </div>
//         );
//     }

//     if (!currentUnit) {
//         return (
//             <div className="h-screen w-full flex items-center justify-center bg-[#101010] text-white">
//                 <p>No units available for {unitData.name}</p>
//             </div>
//         );
//     }

//     const getFloorType = (): string => {
//         const fid = unitData.id;
//         if (fid >= 1 && fid <= 17) return 'floor';
//         if (fid === 18) return 'upperGF';
//         if (fid === 20) return 'podium';
//         if (fid >= 21 && fid <= 26) return 'mlcp';
//         return 'floor';
//     };

//     const currentLegend = legendConfig[getFloorType()];
//     const planImages = [currentUnit.image3D, currentUnit.image2D];
//     const nextImage = planImages[(selectedImageIndex + 1) % planImages.length];

//     const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
//     const DUR = '680ms';

//     const is3dActive = selectedImageIndex === 0;
//     const is2dActive = selectedImageIndex === 1;
//     const isHiddenFloor = id === '19' || id === '27';

//     return (
//         <div
//             className="h-screen w-full bg-cover bg-no-repeat relative overflow-hidden flex font-sans"
//             style={{ backgroundImage: `url(${bgUnit})` }}
//         >
//             <div className="absolute bottom-[5%] left-2 sm:left-10 font-normal text-white opacity-35 pointer-events-none leading-none whitespace-nowrap z-0 select-none text-[18vw] sm:text-[14vw] lg:text-[10vw]">
//                 {unitData.name}
//             </div>

//             <button
//                 className="absolute z-[100] px-6 py-2 sm:px-8 sm:py-2 rounded-[30px] font-sans font-medium text-[13px] sm:text-[16px] text-[#0f2e50] cursor-pointer shadow-lg hover:brightness-110 transition-all border border-white/20
//                 bottom-[10px] right-[10px] sm:bottom-[14px] sm:right-[14px] lg:bottom-[4%] lg:right-24"
//                 style={{ background: 'var(--navbar, #90C7FF)' }}
//                 onClick={() => setShowFitout(true)}
//             >
//                 Fit out plan
//             </button>

//             <button
//                 className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 lg:top-[24px] lg:left-[24px] xl:top-[30px] xl:left-[50px] w-[38px] h-[38px] sm:w-11 sm:h-11 lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px] rounded-[30%] bg-white/95 backdrop-blur-md border border-white/20 flex items-center justify-center z-20 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
//                 onClick={() => navigate(-1)}
//             >
//                 <img src={backImg} alt="Back" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
//             </button>

//             {selectedImageIndex === 0 && zoom > 1 && (
//                 <button
//                     className="absolute top-[61px] left-3.5 sm:top-[74px] sm:left-5 lg:top-[60px] lg:left-[24px] xl:top-[100px] xl:left-[50px] w-[38px] h-[38px] sm:w-11 sm:h-11 lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px] rounded-[30%] bg-white/95 backdrop-blur-md border border-white/20 flex items-center justify-center z-[110] cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
//                     onClick={() => setIsPanelOpen(!isPanelOpen)}
//                 >
//                     {isPanelOpen
//                         ? <img src={downIcon} alt="Close" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
//                         : <img src={upIcon} alt="Open" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6" />}
//                 </button>
//             )}

//             {/* Side Panel */}
//             <div
//                 className={`fixed left-3.5 sm:left-5 lg:left-[24px] xl:left-[30px] z-[1000] bg-transparent transition-[top] duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)] max-w-[calc(100vw-28px)] sm:max-w-none
//                 ${isPanelOpen ? 'top-[110px] sm:top-[130px] lg:top-[120px] xl:top-[160px]' : '-top-full'}
//                 ${selectedImageIndex === 0 || selectedImageIndex === 1 ? 'visible' : 'invisible'}`}
//             >
//                 {currentUnit.unitInformation?.title && (
//                     <div className="mb-7 flex flex-col gap-1 font-[Poppins,sans-serif] text-white px-2">
//                         <div className="text-[15px] sm:text-[17px] font-bold tracking-wide uppercase">
//                             {currentUnit.unitInformation.title}
//                         </div>
//                         <div className="flex gap-5 text-[13px] sm:text-[15px] opacity-90">
//                             {currentUnit.unitInformation.T1 && (
//                                 <span>T1: <span className="font-extrabold">{currentUnit.unitInformation.T1}</span></span>
//                             )}
//                             {currentUnit.unitInformation.T2 && (
//                                 <span>T2: <span className="font-extrabold">{currentUnit.unitInformation.T2}</span></span>
//                             )}
//                         </div>
//                     </div>
//                 )}

//                 <div className="relative pl-[22px] sm:pl-[30px] lg:pl-[28px] xl:pl-10">
//                     <div className="absolute left-[5px] sm:left-[7px] lg:left-[7px] xl:left-[10px] top-4 sm:top-[25px] bottom-4 sm:bottom-[26px] w-[2px] bg-white" />
                    
//                     {/* 1. Evaluate if this list should be compact (e.g., more than 8 items) */}
//                     {(() => {
//                         // Alternatively, check by title: const isCompact = currentUnit.unitInformation?.title === "Floor X" || currentUnit.unitInformation?.title === "Floor Y";
//                         const isCompact = currentUnit.sideContent && currentUnit.sideContent.length > 10;

//                         return (
//                             <ul className={`list-none p-0 m-0 flex flex-col ${isCompact ? 'gap-[1.5px] sm:gap-[2px] xl:gap-[2px]' : 'gap-[3px] sm:gap-1 md:gap-[0.3px] lg:gap-[0.3px] xl:gap-2'}`}>
//                                 {currentUnit.sideContent?.map((roomObj: any, index: number) => {
//                                     const isFirst = index === 0;
//                                     const isLast = index === currentUnit.sideContent!.length - 1;
//                                     const isActive = activeRoom === roomObj.name; 

//                                     return (
//                                         <li
//                                             key={roomObj.id}
//                                             onClick={() => { setActiveRoom(roomObj.name); }} 
//                                             className={`relative cursor-pointer transition-all duration-300 font-[Poppins,sans-serif] not-italic
//                                                 min-w-[90px] sm:min-w-[110px] lg:min-w-[120px] xl:min-w-[140px] 2xl:min-w-[150px]
                                                
//                                                 /* 2. Apply dynamic sizing based on the isCompact flag */
//                                                 ${isCompact 
//                                                     ? 'text-[11px] sm:text-[12px] lg:text-[11px] xl:text-[13px] 2xl:text-[13px] py-[3px] px-[8px] sm:py-[4px] sm:px-[12px] xl:py-[4px] xl:px-[16px] font-medium' 
//                                                     : 'text-[13px] sm:text-[15px] lg:text-[13px] xl:text-[15px] 2xl:text-[15px] py-[5px] px-[10px] sm:py-[6px] sm:px-[16px] lg:py-[5px] lg:px-[14px] xl:py-[6px] xl:px-[20px] 2xl:px-[25px] font-semibold'
//                                                 }

//                                                 /* Standard colors */
//                                                 ${isFirst 
//                                                     ? 'bg-gradient-to-r from-[#90C7FF] to-transparent text-white font-bold' 
//                                                     : isActive 
//                                                         ? 'bg-white text-[#305e8f] font-bold' 
//                                                         : 'text-white bg-gradient-to-r from-[#105CA8] to-transparent'}`}
//                                         >
//                                             <div className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-white left-[-17px] w-[17px] sm:left-[-22px] sm:w-[22px] lg:left-[-21px] lg:w-[21px] xl:left-[-28px] xl:w-[28px] 2xl:left-[-30px] 2xl:w-[30px]" />
//                                             {isFirst && (
//                                                 <div className="absolute top-0 border-t-2 border-l-2 border-white rounded-tl-[20px] left-[-18px] w-[11px] h-[14px] sm:left-[-23px] sm:w-[14px] sm:h-[18px] lg:left-[-22px] lg:top-[5px] lg:w-[13px] lg:h-[16px] xl:left-[-29px] xl:w-[18px] xl:h-[22px] 2xl:left-[-31px] 2xl:w-5 2xl:h-[25px]" />
//                                             )}
//                                             {isLast && (
//                                                 <div className="absolute bottom-0 border-b-2 border-l-2 border-white rounded-bl-[20px] left-[-18px] w-[11px] h-[14px] sm:left-[-23px] sm:w-[14px] sm:h-[18px] lg:left-[-22px] lg:top-[8px] lg:w-[13px] lg:h-[16px] xl:left-[-29px] xl:w-[18px] xl:h-[22px] 2xl:left-[-31px] 2xl:w-5 2xl:h-[25px]" />
//                                             )}
//                                             {roomObj.name}
//                                         </li>
//                                     );
//                                 })}
//                             </ul>
//                         );
//                     })()}
//                 </div>
//             </div>

//             {/* Main Content */}
//             <div
//                 ref={containerRef}
//                 className="flex-1 flex items-center justify-center relative touch-none overflow-hidden"
//                 onMouseDown={onMouseDown}
//                 onTouchStart={onTouchStart}
//             >
//                 {/* 3D VIEW */}
//                 <div
//                     className="absolute inset-0 flex items-center justify-center"
//                     style={{
//                         transform: is3dActive ? 'scale(1)' : 'scale(0)',
//                         opacity: is3dActive ? 1 : 0,
//                         transformOrigin: transformOrigin,
//                         transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
//                         willChange: 'transform, opacity',
//                         pointerEvents: is3dActive ? 'auto' : 'none',
//                     }}
//                 >
//                     <img
//     src={planImages[0] || `${planImages[0]}`}
//     alt="3D Floor Plan Base"
//     className="rounded-[20px] select-none object-contain w-full h-full
//         max-w-[80%] max-h-[70vh]       /* Base mobile: Zoomed out effect */
//         md:max-w-[75%] md:max-h-[75vh] /* Tablet (md): Slight zoom out */
//         lg:max-w-[98%] lg:max-h-[95vh] /* Laptop (lg): Untouched original size */
//         xl:max-w-[98%] xl:max-h-[98vh]
//         2xl:max-w-[100%] 2xl:max-h-[98vh]
//         mt-[12vh] lg:mr-[25vh] ml-[-10%] md:ml-[-10%] lg:ml-0"
//     style={{
//         // Offsets are baked directly into the transform!
//         transform: `translate3d(${position.x - (isLowerGround ? -80 : 0)}px, ${position.y - (isLowerGround ? 120 : 0)}px, 0) scale(${zoom})`,
//         transformOrigin: 'center',
        
//         // marginTop and marginRight have been MOVED to the className above 
//         // to allow for responsive control across mobile/tablet/laptop.
        
//         cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
//         transition: isDragging ? 'none' : `transform 700ms ${EASE}`,
//         willChange: 'transform, opacity',
//         pointerEvents: (currentUnit?.overlayImage && showOverlay) ? 'none' : 'auto',
//         opacity: (currentUnit?.overlayImage && showOverlay) ? 0 : 1,
//     }}
//     draggable={false}
//     onLoad={(e) => setImgSize3D({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
// />
//                     {/* Single Floor Sinking Overlay */}
//                     {/* --- COMBINED SINKING OVERLAY & POLYGONS --- */}
// {selectedImageIndex === 0 && currentUnit?.overlayImage && (
//     <div
//         className={`absolute shrink inline-flex justify-center items-center z-50
//             /* --- SIZING (Applied to master wrapper) --- */
//             max-w-[80%] max-h-[70vh]
//             md:max-w-[85%] md:max-h-[75vh]
//             lg:max-w-[98%] lg:max-h-[95vh]
//             xl:max-w-[98%] xl:max-h-[98vh]
//             2xl:max-w-[100%] 2xl:max-h-[98vh]
            
//             /* 👇 EDIT THESE VALUES freely, they will never separate now 👇 */
//             ml-[10%]       /* Base mobile margin */
//             md:ml-[20%]    /* Tablet (md) margin */
//             lg:ml-0        /* Laptop (lg) left untouched! */
//             /* 👆 --------------------------------------------------- 👆 */
//         `}
//         style={{
//             transform: showOverlay ? `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})` : `translate3d(${position.x}px, ${position.y + 60}px, 0) scale(${zoom * 0.92})`,
//             opacity: showOverlay ? 1 : 0,
//             transformOrigin: 'center',
//             marginTop: '10vh',
//             transition: `transform 720ms ${EASE}, opacity 480ms ${EASE}`,
//             willChange: 'transform, opacity',
//             pointerEvents: showOverlay ? 'auto' : 'none',
//         }}
//         onClick={handleOverlayClick}
//     >
//         {/* 1. Ghost image: Forces the wrapper to match the exact aspect ratio of your image naturally */}
//         <img src={currentUnit.overlayImage} className="opacity-0 w-auto h-auto max-w-full max-h-full object-contain pointer-events-none" draggable={false} />
        
//         {/* 2. The Visible Image: Locked to the wrapper bounds */}
//         <img
//             src={currentUnit.overlayImage}
//             alt="Floor Overlay"
//             className="absolute inset-0 w-full h-full object-contain select-none hover:brightness-110 cursor-pointer"
//             draggable={false}
//         />

//         {/* 3. The SVG Polygons: perfectly layered over the visible image */}
//         {imgSize3D.w > 0 && activeRoom && (
//             <svg viewBox={`0 0 2000 1125`} className="absolute inset-0 w-full h-full pointer-events-none z-[60]">
//                 {currentUnit.sideContent
//                     ?.filter((item: any) => item.name === activeRoom)
//                     .flatMap((item: any) => item.polygons || [])
//                     .map((poly: any, idx: number) => {
                        
//                         // Calculate the centroid/bounding box for the permanent tooltip
//                         const pts = poly.points.split(',').map(Number);
//                         let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
//                         for(let i = 0; i < pts.length; i += 2) {
//                                 if(pts[i] < minX) minX = pts[i];
//                                 if(pts[i] > maxX) maxX = pts[i];
//                                 if(pts[i+1] < minY) minY = pts[i+1];
//                                 if(pts[i+1] > maxY) maxY = pts[i+1];
//                         }

//                         return (
//                             <g key={poly.polygonId || idx}>
//                                 <polygon
//                                     points={poly.points}
//                                     fill="rgba(0, 123, 255, 0.6)"
//                                     strokeWidth="3"
//                                     className="transition-all duration-300 pointer-events-auto cursor-pointer"
//                                 />
                                
//                                 {/* Centralized Box Tooltip - Renders ONLY once at a fixed top position */}
//                                 {idx === 0 && (
//                                     <foreignObject
//                                         x="0"
//                                         y="60"
//                                         width="2000"
//                                         height="100"
//                                         className="overflow-visible pointer-events-none"
//                                     >
//                                         <div className="flex items-start justify-center w-full h-full drop-shadow-2xl">
//                                             <div 
//                                                 className="text-white rounded-lg whitespace-nowrap font-sans tracking-wide font-bold"
//                                                 style={{ fontSize: '44px' }} 
//                                             >
//                                                 {poly.tooltip}
//                                             </div>
//                                         </div>
//                                     </foreignObject>
//                                 )}
//                             </g>
//                         );
//                     })}
//             </svg>
//         )}
//     </div>
// )}
//                 </div>

//                 {/* 2D VIEW */}
//                 {!isHiddenFloor && (
//                     <div
//                         className="absolute inset-0 flex flex-col items-center justify-center
//                         p-[10px_8px] sm:p-[14px_10px] lg:p-3 xl:p-4
//                         gap-2 sm:gap-2.5 lg:gap-2 xl:gap-3.5"
//                         style={{
//                             transform: is2dActive ? 'scale(1)' : 'scale(0)',
//                             opacity: is2dActive ? 1 : 0,
//                             transformOrigin: transformOrigin,
//                             transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
//                             willChange: 'transform, opacity',
//                             pointerEvents: is2dActive ? 'auto' : 'none',
//                         }}
//                     >
//                         <div className="flex items-center justify-center sm:justify-between flex-wrap sm:flex-nowrap
//                             gap-[5px_8px] sm:gap-0
//                             px-[10px] py-[6px] sm:px-[14px] sm:py-[7px] lg:px-3 lg:py-[6px] xl:p-[10px] xl:px-[50px]
//                             rounded-full border border-white/20
//                             bg-gradient-to-r from-[#2461a7] via-[#5781b2] to-[#6986AF]
//                             w-full sm:w-4/5 lg:w-[65%] xl:w-[50%] 2xl:w-[50%] shrink-0">
//                             {currentLegend.map(({ color, label }) => (
//                                 <div key={label} className="flex items-center gap-[5px] sm:gap-2.5 text-white whitespace-nowrap text-[11px] sm:text-[13px] lg:text-[12px] xl:text-[14px]">
//                                     <span
//                                         className="inline-block rounded-full border-2 border-white shrink-0 w-4 h-4 sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-[26px] xl:h-[26px] 2xl:w-[30px] 2xl:h-[30px]"
//                                         style={{ background: color }}
//                                     />
//                                     <span>{label}</span>
//                                 </div>
//                             ))}
//                         </div>

//                         <div
//                             className="relative shrink ml-[4px] rounded-[20px]
//                                 max-w-[95%] max-h-[65vh]
//                                 sm:max-w-[95%] sm:max-h-[68vh]
//                                 lg:max-w-[96%] lg:max-h-[72vh]
//                                 xl:max-w-full xl:max-h-[74vh]
//                                 2xl:max-w-full 2xl:max-h-[75vh]"
//                             style={{
//                                 transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
//                                 transformOrigin: 'center center',
//                                 cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
//                                 transition: isDragging ? 'none' : `transform 700ms ${EASE}`,
//                                 willChange: 'transform',
//                                 display: 'inline-flex',
//                                 justifyContent: 'center',
//                                 alignItems: 'center'
//                             }}
//                         >
//                             <img
//                                 src={planImages[1]}
//                                 alt="2D Floor Plan"
//                                 className="rounded-[20px] select-none w-auto h-auto max-w-full max-h-full object-contain pointer-events-none"
//                                 draggable={false}
//                             />
//                         </div>
//                     </div>
//                 )}
//             </div>

//             <img
//                 src={compess}
//                 alt="Compass"
//                 className="absolute z-[1000] rounded-[20px]
//                     w-[55px] h-[55px] top-5 right-[10px]
//                     sm:w-[90px] sm:h-[90px] sm:top-[10px] sm:right-[14px]
//                     md:top-[22%] md:right-[04%]
//                     lg:w-[85px] lg:h-[85px] lg:top-[16%] lg:right-[6%]
//                     xl:w-[105px] xl:h-[105px] xl:top-[21%] xl:right-[7%]
//                     2xl:w-[125px] 2xl:h-[125px] 2xl:top-[20%] 2xl:right-[7.75%]"
//             />

//             <div className="absolute -translate-y-1/2 flex flex-col gap-1.5 sm:gap-4 lg:gap-1 xl:gap-1 z-20
//                 right-[10px] sm:right-[14px] md:right-[07%] lg:right-[07%] xl:right-[10%] 2xl:right-[10%] top-1/2
//                 md:top-[50%] lg:top-[50%] xl:top-[54%]">
//                 <button
//                     className="rounded-[30%] bg-white/95 border-none outline-none flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.12)]
//                         w-9 h-9 sm:w-[42px] sm:h-[42px] lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px]"
//                     onClick={handleZoomIn}
//                 >
//                     <img src={zoomin} alt="Zoom In" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-[24px] lg:h-[24px] xl:w-[30px] xl:h-[30px]" />
//                 </button>

//                 <button
//                     disabled={zoom <= 1}
//                     className={`rounded-[30%] bg-white/95 border-none outline-none flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] mt-0.5 sm:mt-2.5 lg:mt-2 xl:mt-2.5
//                         w-9 h-9 sm:w-[42px] sm:h-[42px] lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px]
//                         ${zoom <= 1 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
//                     onClick={handleZoomOut}
//                 >
//                     <img src={zoomout} alt="Zoom out" className="w-[18px] sm:w-[22px] lg:w-[24px] xl:w-[30px] h-[5px]" />
//                 </button>

//                 {zoom !== 1 && (
//                     <button
//                         className="rounded-[30%] bg-white/95 border-none outline-none flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.12)] mt-0.5 sm:mt-2.5 lg:mt-2 xl:mt-2.5
//                             w-9 h-9 sm:w-[42px] sm:h-[42px] lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px]"
//                         onClick={resetView}
//                     >
//                         <img src={reset} alt="Reset" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-[24px] lg:h-[24px] xl:w-[30px] xl:h-[30px]" />
//                     </button>
//                 )}
//             </div>

//             {!isHiddenFloor && (
//                 <div
//                     ref={minimapRef}
//                     className="absolute bg-[#1D7AD9] flex items-center justify-center z-30 overflow-hidden cursor-pointer transition-transform
//                         bottom-[55px] right-[10px] w-[90px] h-[70px] rounded-xl
//                         sm:bottom-[70px] sm:right-[14px] sm:w-[130px] sm:h-[104px] sm:rounded-[20px]
//                         lg:bottom-[5%] lg:right-[3%] lg:w-[160px] lg:h-[124px] lg:rounded-[20px]
//                         xl:bottom-[6%] xl:right-[5.5%] xl:w-[160px] xl:h-[120px]
//                         2xl:bottom-[14%] 2xl:right-[70px] 2xl:w-[200px] 2xl:h-[130px]"
//                     onClick={handleMiniMapClick}
//                 >
//                     <img src={nextImage} alt="Switch View" className="w-full h-full object-fill" />
//                 </div>
//             )}
            
//             <Fitout isOpen={showFitout} onClose={() => setShowFitout(false)} />
//         </div>
//     );
// }

import { useParams, useNavigate } from "react-router-dom";
import backImg from '../../assets/back.png';
import upIcon from '../../assets/unit/up-icon.png';
import downIcon from '../../assets/unit/down-icon.png';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import bgUnit from '../../assets/unit/bgunit.jpg';
import compess from '../../assets/unit/compass.png';
import reset from '../../assets/unit/reset.png';
import zoomout from '../../assets/unit/Zoomout-icon.jpg';
import zoomin from '../../assets/unit/zoomin-icon.png';
import unitLogo from '../../assets/unit/Unit_Logo.png'
import { getFloors } from '@/api/floorServices';
import Fitout from '@/pages/ProjectDetails/Fitout';

const legendConfig: Record<string, { color: string; label: string }[]> = {
    floor: [
        { color: '#7da2c7', label: '5 Toilet' },
        { color: '#cfc6c3', label: '8 AHU Room' },
        { color: '#d4a3a3', label: '2 Fire Tower' },
        { color: '#dcd2c1', label: '9 Lift Lobby' },
    ],
    mlcp: [
        { color: '#89A1D3', label: '2 Driver Lounge' },
        { color: '#E9ED98', label: '2 Fire Tower' },
        { color: '#E8A19A', label: '3 Lift Lobby' },
        { color: '#FF8ACD', label: '1 Toilet' },
    ],
    podium: [
        { color: '#9FC093', label: ' 3 Working Pods' },
        { color: '#E9ED98', label: '2 Food Kiosk' },
        { color: '#E8A19A', label: '8 Lift Lobby' },
        { color: '#FF8ACD', label: '5 Toilet' },
    ],
    upperGF: [
        { color: '#A6F5D8', label: '1 Driver room' },
        { color: '#E9ED98', label: '2 Fire Tower' },
        { color: '#E8A19A', label: '6 Lift Lobby' },
        { color: '#FF8ACD', label: '3 Toilet' },
    ],
};

export default function UnitPlanPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [floorData, setFloors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getFloors();
                setFloors(res.data.data || []);
            } catch (error) {
                console.error("Fetch failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);


    
    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             // const res = await axios.get("http://103.133.214.185:5001/api/floors");
    //             const res=await axios.get("http://103.133.214.185:5001/api/gallery");
    //             // const res = await axios.get("/api/floors");
    //             setFloors(res.data.data || []);
    //             console.log("Data..........."+JSON.stringify(res.data.data))
    //         } catch (error) {
    //             console.error("Fetch failed", error);
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };
    //     fetchData();
    // }, []);

    const unitData = useMemo(() => {
        if (!floorData.length) return null;
        return floorData.find((f) => String(f.id) === String(id));
    }, [floorData, id]);

    const units = unitData?.units || [];
    const currentUnit = units.length > 0 ? units[0] : null;

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showOverlay, setShowOverlay] = useState(true);
    const [showFitout, setShowFitout] = useState(false);
    // Use the 'id' directly from useParams, which is always a string
    const isLowerGround = id === '19';

    // Add this temporarily to check your console (F12) and see what value React is actually seeing:
    console.log("Current URL ID:", id, "| Is Lower Ground?", isLowerGround);

    const [imgSize3D, setImgSize3D] = useState({ w: 2000, h: 1125 }); // 3D image size

    // 👇 ADD THIS NEW useEffect BLOCK RIGHT HERE 👇
    useEffect(() => {
        // If currentUnit exists and has items in sideContent, set the first one as active
        if (currentUnit?.sideContent?.length > 0) {
            setActiveRoom(currentUnit.sideContent[0].name);
        }
    }, [currentUnit]);
    // 👆 -------------------------------------- 👆

    const containerRef = useRef<HTMLDivElement>(null);
    const minimapRef = useRef<HTMLDivElement>(null);
    const [transformOrigin, setTransformOrigin] = useState('bottom right');

    const computeOrigin = useCallback(() => {
        if (!containerRef.current || !minimapRef.current) return;
        const cRect = containerRef.current.getBoundingClientRect();
        const mRect = minimapRef.current.getBoundingClientRect();
        const cx = mRect.left + mRect.width / 2 - cRect.left;
        const cy = mRect.top + mRect.height / 2 - cRect.top;
        const ox = ((cx / cRect.width) * 100).toFixed(2) + '%';
        const oy = ((cy / cRect.height) * 100).toFixed(2) + '%';
        setTransformOrigin(`${ox} ${oy}`);
    }, []);

    useEffect(() => {
        computeOrigin();
        window.addEventListener('resize', computeOrigin);
        return () => window.removeEventListener('resize', computeOrigin);
    }, [computeOrigin]);

    const handleMiniMapClick = () => {
        const next = (selectedImageIndex + 1) % 2;
        computeOrigin();
        setSelectedImageIndex(next);
    };

    useEffect(() => {
        if (zoom > 1) setIsPanelOpen(false);
        else setIsPanelOpen(true);
    }, [zoom]);

    useEffect(() => {
        if (zoom > 1) setShowOverlay(false);
        else setShowOverlay(true);
    }, [zoom]);

    const handleZoomIn = () => setZoom(p => Math.min(p + 0.2, 2));
    const handleZoomOut = () => {
        setZoom(p => {
            const n = Math.max(p - 0.2, 0.6);
            if (n <= 1) setPosition({ x: 0, y: 0 });
            return n;
        });
    };
    const resetView = () => { setZoom(1); setPosition({ x: 0, y: 0 }); setShowOverlay(true); };

    const handleOverlayClick = () => {
        setShowOverlay(false);
        setZoom(1.3);
        setPosition({ x: 0, y: 0 });
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (isDragging && zoom > 1) {
                setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
            }
        };
        const onTouchMove = (e: TouchEvent) => {
            if (isDragging && zoom > 1) {
                if (e.cancelable) e.preventDefault();
                const t = e.touches[0];
                setPosition({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
            }
        };
        const onEnd = () => setIsDragging(false);
        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchend', onEnd);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchend', onEnd);
        };
    }, [isDragging, zoom, dragStart]);

    const onMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) { setIsDragging(true); setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); }
    };
    const onTouchStart = (e: React.TouchEvent) => {
        if (zoom > 1) {
            const t = e.touches[0];
            setIsDragging(true);
            setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
        }
    };

    // No loading screen — render nothing until details are ready (data is local/instant).
    if (isLoading) {
        return null;
    }

    if (!unitData) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#101010] text-white gap-4">
                <p>Floor data not found for ID: {id}</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded">Go Back</button>
            </div>
        );
    }

    if (!currentUnit) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#101010] text-white">
                <p>No units available for {unitData.name}</p>
            </div>
        );
    }

    const getFloorType = (): string => {
        const fid = unitData.id;
        if (fid >= 1 && fid <= 17) return 'floor';
        if (fid === 18) return 'upperGF';
        if (fid === 20) return 'podium';
        if (fid >= 21 && fid <= 26) return 'mlcp';
        return 'floor';
    };

    const currentLegend = legendConfig[getFloorType()];
    const planImages = [currentUnit.image3D, currentUnit.image2D];
    const nextImage = planImages[(selectedImageIndex + 1) % planImages.length];

    const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    const DUR = '680ms';

    const is3dActive = selectedImageIndex === 0;
    const is2dActive = selectedImageIndex === 1;
    const isHiddenFloor = id === '19' || id === '27';

    return (
        <div
            className="h-screen w-full bg-cover bg-no-repeat relative overflow-hidden flex font-sans"
            style={{ backgroundImage: `url(${bgUnit})` }}
        >
            <div className="absolute bottom-[5%] left-2 sm:left-10 font-normal text-white opacity-35 pointer-events-none leading-none whitespace-nowrap z-0 select-none text-[18vw] sm:text-[14vw] lg:text-[10vw]">
                {unitData.name}
            </div>

            <button
                className="absolute z-[100] px-6 py-2 sm:px-8 sm:py-2 rounded-[30px] font-sans font-medium text-[13px] sm:text-[16px] text-[#0f2e50] cursor-pointer shadow-lg hover:brightness-110 transition-all border border-white/20
                bottom-[10px] right-[10px] sm:bottom-[14px] sm:right-[14px] lg:bottom-[4%] lg:right-24"
                style={{ background: 'var(--navbar, #90C7FF)' }}
                onClick={() => setShowFitout(true)}
            >
                Fit out plan
            </button>
            
            <div className="absolute z-50 flex items-center justify-center 
                
                /* TOP RESPONSIVENESS */
                top-4           /* Base (Mobile) */
                sm:top-5        /* Small screens */
                md:top-6        /* Tablets */
                lg:top-8        /* Small laptops */
                xl:top-8        /* Desktops */
                2xl:top-6      /* Large monitors (Your target) */
                
                /* RIGHT RESPONSIVENESS */
                right-[10px]    /* Base (Mobile) */
                sm:right-[105px] 
                md:right-[40px] 
                lg:right-[135px] 
                xl:right-[150px] 
                2xl:right-[134px] /* Large monitors (Your target) */
                
                /* Optional smooth transition */
                transition-all duration-300
                    
                    {/* BASE SIZE (Mobile) */}
                    h-16 w-16
                    
                    {/* RESPONSIVE SCALES */}
                    sm:h-10 sm:w-10
                    md:h-16 md:w-16
                    lg:h-22 lg:w-22
                    xl:h-30 xl:w-30
                    2xl:h-[100px] 2xl:w-[100px]

                    {/* Smooth transition for size changes */}
                    transition-all duration-300">
      
      {/* The inner image, constrained and centered */}
      <img
        src={unitLogo}
        alt="Unit Logo"
        className="h-full w-full object-contain"
      />
    </div>

            <button
                className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 lg:top-[24px] lg:left-[24px] xl:top-[30px] xl:left-[50px] w-[38px] h-[38px] sm:w-11 sm:h-11 lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px] rounded-[30%] bg-white/95 backdrop-blur-md border border-white/20 flex items-center justify-center z-20 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                onClick={() => navigate(-1)}
            >
                <img src={backImg} alt="Back" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
            </button>

            {/* 👇 Modified: Removed zoom > 1 and added Tailwind responsive display class 👇 */}
            {selectedImageIndex === 0 && zoom <= 1 && (
    <button
        className="absolute top-[61px] left-3.5 sm:top-[74px] sm:left-5 lg:top-[60px] lg:left-[24px] xl:top-[100px] xl:left-[50px] w-[38px] h-[38px] sm:w-11 sm:h-11 lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px] rounded-[30%] bg-white/95 backdrop-blur-md border border-white/20 items-center justify-center z-[110] cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex sm:hidden"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
    >
        {isPanelOpen
            ? <img src={downIcon} alt="Close" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
            : <img src={upIcon} alt="Open" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6" />}
    </button>
)}

            {/* Side Panel */}
            <div
                className={`fixed left-3.5 sm:left-5 lg:left-[24px] xl:left-[30px] z-[1000] bg-transparent transition-[top] duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)] max-w-[calc(100vw-28px)] sm:max-w-none
                ${isPanelOpen ? 'top-[110px] sm:top-[130px] lg:top-[120px] xl:top-[160px]' : '-top-full'}
                ${selectedImageIndex === 0 || selectedImageIndex === 1 ? 'visible' : 'invisible'}`}
            >
                {currentUnit.unitInformation?.title && (
                    <div className="mb-7 flex flex-col gap-1 font-[Poppins,sans-serif] text-white px-2">
                        <div className="text-[15px] sm:text-[17px] font-bold tracking-wide uppercase">
                            {currentUnit.unitInformation.title}
                        </div>
                        <div className="flex gap-5 text-[13px] sm:text-[15px] opacity-90">
                            {currentUnit.unitInformation.T1 && (
                                <span>T1: <span className="font-extrabold">{currentUnit.unitInformation.T1}</span></span>
                            )}
                            {currentUnit.unitInformation.T2 && (
                                <span>T2: <span className="font-extrabold">{currentUnit.unitInformation.T2}</span></span>
                            )}
                        </div>
                    </div>
                )}

                <div className="relative pl-[22px] sm:pl-[30px] lg:pl-[28px] xl:pl-10">
                    <div className="absolute left-[5px] sm:left-[7px] lg:left-[7px] xl:left-[10px] top-4 sm:top-[25px] bottom-4 sm:bottom-[26px] w-[2px] bg-white" />
                    
                    {/* 1. Evaluate if this list should be compact (e.g., more than 8 items) */}
                    {(() => {
                        // Alternatively, check by title: const isCompact = currentUnit.unitInformation?.title === "Floor X" || currentUnit.unitInformation?.title === "Floor Y";
                        const isCompact = currentUnit.sideContent && currentUnit.sideContent.length > 10;

                        return (
                            <ul className={`list-none p-0 m-0 flex flex-col ${isCompact ? 'gap-[1.5px] sm:gap-[2px] xl:gap-[2px]' : 'gap-[3px] sm:gap-1 md:gap-[0.3px] lg:gap-[0.3px] xl:gap-2'}`}>
                                {currentUnit.sideContent?.map((roomObj: any, index: number) => {
                                    const isFirst = index === 0;
                                    const isLast = index === currentUnit.sideContent!.length - 1;
                                    const isActive = activeRoom === roomObj.name; 

                                    return (
                                        <li
                                            key={roomObj.id}
                                            onClick={() => { setActiveRoom(roomObj.name); }} 
                                            className={`relative cursor-pointer transition-all duration-300 font-[Poppins,sans-serif] not-italic
                                                min-w-[90px] sm:min-w-[110px] lg:min-w-[120px] xl:min-w-[140px] 2xl:min-w-[150px]
                                                
                                                /* 2. Apply dynamic sizing based on the isCompact flag */
                                                ${isCompact 
                                                    ? 'text-[11px] sm:text-[12px] lg:text-[11px] xl:text-[13px] 2xl:text-[13px] py-[3px] px-[8px] sm:py-[4px] sm:px-[12px] xl:py-[4px] xl:px-[16px] font-medium' 
                                                    : 'text-[13px] sm:text-[15px] lg:text-[13px] xl:text-[15px] 2xl:text-[15px] py-[5px] px-[10px] sm:py-[6px] sm:px-[16px] lg:py-[5px] lg:px-[14px] xl:py-[6px] xl:px-[20px] 2xl:px-[25px] font-semibold'
                                                }

                                                /* Standard colors */
                                                ${isFirst 
                                                    ? 'bg-gradient-to-r from-[#90C7FF] to-transparent text-white font-bold' 
                                                    : isActive 
                                                        ? 'bg-white text-[#305e8f] font-bold' 
                                                        : 'text-white bg-gradient-to-r from-[#105CA8] to-transparent'}`}
                                        >
                                            <div className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-white left-[-17px] w-[17px] sm:left-[-22px] sm:w-[22px] lg:left-[-21px] lg:w-[21px] xl:left-[-28px] xl:w-[28px] 2xl:left-[-30px] 2xl:w-[30px]" />
                                            {isFirst && (
                                                <div className="absolute top-0 border-t-2 border-l-2 border-white rounded-tl-[20px] left-[-18px] w-[11px] h-[14px] sm:left-[-23px] sm:w-[14px] sm:h-[18px] lg:left-[-22px] lg:top-[5px] lg:w-[13px] lg:h-[16px] xl:left-[-29px] xl:w-[18px] xl:h-[22px] 2xl:left-[-31px] 2xl:w-5 2xl:h-[25px]" />
                                            )}
                                            {isLast && (
                                                <div className="absolute bottom-0 border-b-2 border-l-2 border-white rounded-bl-[20px] left-[-18px] w-[11px] h-[14px] sm:left-[-23px] sm:w-[14px] sm:h-[18px] lg:left-[-22px] lg:top-[8px] lg:w-[13px] lg:h-[16px] xl:left-[-29px] xl:w-[18px] xl:h-[22px] 2xl:left-[-31px] 2xl:w-5 2xl:h-[25px]" />
                                            )}
                                            {roomObj.name}
                                        </li>
                                    );
                                })}
                            </ul>
                        );
                    })()}
                </div>
            </div>

            {/* Main Content */}
            <div
                ref={containerRef}
                className="flex-1 flex items-center justify-center relative touch-none overflow-hidden"
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
            >
                {/* 3D VIEW */}
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        transform: is3dActive ? 'scale(1)' : 'scale(0)',
                        opacity: is3dActive ? 1 : 0,
                        transformOrigin: transformOrigin,
                        transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
                        willChange: 'transform, opacity',
                        pointerEvents: is3dActive ? 'auto' : 'none',
                    }}
                >
                    <img
                        src={planImages[0] || `${planImages[0]}`}
                        alt="3D Floor Plan Base"
                        className="rounded-[20px] select-none object-contain w-full h-full
                            max-w-[80%] max-h-[70vh]       /* Base mobile: Zoomed out effect */
                            md:max-w-[75%] md:max-h-[75vh] /* Tablet (md): Slight zoom out */
                            lg:max-w-[98%] lg:max-h-[95vh] /* Laptop (lg): Untouched original size */
                            /* On wide xl/2xl monitors the full-size image overlapped
                               the compass + zoom controls on the right. Keep it
                               centered (mr-0) but a bit SMALLER so both sides clear. */
                            xl:max-w-[84%] xl:max-h-[82vh]
                            2xl:max-w-[80%] 2xl:max-h-[82vh]
                            mt-[12vh] lg:mr-[25vh] xl:mr-0 2xl:mr-0 ml-[-10%] md:ml-[-10%] lg:ml-0"
                        style={{
                            // Offsets are baked directly into the transform!
                            transform: `translate3d(${position.x - (isLowerGround ? -80 : 0)}px, ${position.y - (isLowerGround ? 120 : 0)}px, 0) scale(${zoom})`,
                            transformOrigin: 'center',
                            
                            // marginTop and marginRight have been MOVED to the className above 
                            // to allow for responsive control across mobile/tablet/laptop.
                            
                            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                            transition: isDragging ? 'none' : `transform 700ms ${EASE}`,
                            willChange: 'transform, opacity',
                            pointerEvents: (currentUnit?.overlayImage && showOverlay) ? 'none' : 'auto',
                            opacity: (currentUnit?.overlayImage && showOverlay) ? 0 : 1,
                        }}
                        draggable={false}
                        onLoad={(e) => setImgSize3D({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                    />
                    {/* Single Floor Sinking Overlay */}
                    {/* --- COMBINED SINKING OVERLAY & POLYGONS --- */}
                    {selectedImageIndex === 0 && currentUnit?.overlayImage && (
                        <div
                            className={`absolute shrink inline-flex justify-center items-center z-50
                                /* --- SIZING (Applied to master wrapper) --- */
                                max-w-[100%] max-h-90vh]
                                md:max-w-[85%] md:max-h-[75vh]
                                lg:max-w-[98%] lg:max-h-[95vh]
                                xl:max-w-[84%] xl:max-h-[82vh]
                                2xl:max-w-[80%] 2xl:max-h-[82vh]
                                
                                /* 👇 EDIT THESE VALUES freely, they will never separate now 👇 */
                                ml-[0%]       /* Base mobile margin */
                                md:ml-[20%]    /* Tablet (md) margin */
                                lg:ml-0        /* Laptop (lg) left untouched! */
                                /* 👆 --------------------------------------------------- 👆 */
                            `}
                            style={{
                                transform: showOverlay ? `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})` : `translate3d(${position.x}px, ${position.y + 60}px, 0) scale(${zoom * 0.92})`,
                                opacity: showOverlay ? 1 : 0,
                                transformOrigin: 'center',
                                marginTop: '10vh',
                                transition: `transform 720ms ${EASE}, opacity 480ms ${EASE}`,
                                willChange: 'transform, opacity',
                                pointerEvents: showOverlay ? 'auto' : 'none',
                            }}
                            onClick={handleOverlayClick}
                        >
                            {/* 1. Ghost image: Forces the wrapper to match the exact aspect ratio of your image naturally */}
                            <img src={currentUnit.overlayImage} className="opacity-0 w-auto h-auto max-w-full max-h-full object-contain pointer-events-none" draggable={false} />
                            
                            {/* 2. The Visible Image: Locked to the wrapper bounds */}
                            <img
                                src={currentUnit.overlayImage}
                                alt="Floor Overlay"
                                className="absolute inset-0 w-full h-full object-contain select-none hover:brightness-110 cursor-pointer"
                                draggable={false}
                            />

                            {/* 3. The SVG Polygons: perfectly layered over the visible image */}
                            {imgSize3D.w > 0 && activeRoom && (
                                <svg viewBox={`0 0 2000 1125`} className="absolute inset-0 w-full h-full pointer-events-none z-[60]">
                                    {currentUnit.sideContent
                                        ?.filter((item: any) => item.name === activeRoom)
                                        .flatMap((item: any) => item.polygons || [])
                                        .map((poly: any, idx: number) => {
                                            
                                            // Calculate the centroid/bounding box for the permanent tooltip
                                            const pts = poly.points.split(',').map(Number);
                                            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                                            for(let i = 0; i < pts.length; i += 2) {
                                                    if(pts[i] < minX) minX = pts[i];
                                                    if(pts[i] > maxX) maxX = pts[i];
                                                    if(pts[i+1] < minY) minY = pts[i+1];
                                                    if(pts[i+1] > maxY) maxY = pts[i+1];
                                            }

                                            return (
                                                <g key={poly.polygonId || idx}>
                                                    <polygon
                                                        points={poly.points}
                                                        fill="rgba(0, 123, 255, 0.6)"
                                                        strokeWidth="3"
                                                        className="transition-all duration-300 pointer-events-auto cursor-pointer"
                                                    />
                                                    
                                                    {/* Centralized Box Tooltip - Renders ONLY once at a fixed top position */}
                                                    {idx === 0 && (
                                                        <foreignObject
                                                            x="0"
                                                            y="60"
                                                            width="2000"
                                                            height="100"
                                                            className="overflow-visible pointer-events-none"
                                                        >
                                                            <div className="flex items-start justify-center w-full h-full drop-shadow-2xl">
                                                                <div 
                                                                    className="text-white rounded-lg whitespace-nowrap font-sans tracking-wide font-bold"
                                                                    style={{ fontSize: '44px' }} 
                                                                >
                                                                    {poly.tooltip}
                                                                </div>
                                                            </div>
                                                        </foreignObject>
                                                    )}
                                                </g>
                                            );
                                        })}
                                </svg>
                            )}
                        </div>
                    )}
                </div>

                {/* 2D VIEW */}
                {!isHiddenFloor && (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center
                        p-[10px_8px] sm:p-[14px_10px] lg:p-3 xl:p-4
                        gap-2 sm:gap-2.5 lg:gap-2 xl:gap-3.5"
                        style={{
                            transform: is2dActive ? 'scale(1)' : 'scale(0)',
                            opacity: is2dActive ? 1 : 0,
                            transformOrigin: transformOrigin,
                            transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
                            willChange: 'transform, opacity',
                            pointerEvents: is2dActive ? 'auto' : 'none',
                        }}
                    >
                        <div className="flex items-center justify-center sm:justify-between flex-wrap sm:flex-nowrap
                            gap-[5px_8px] sm:gap-0
                            px-[10px] py-[6px] sm:px-[14px] sm:py-[7px] lg:px-3 lg:py-[6px] xl:p-[10px] xl:px-[50px]
                            rounded-full border border-white/20
                            bg-gradient-to-r from-[#2461a7] via-[#5781b2] to-[#6986AF]
                            w-full sm:w-4/5 lg:w-[65%] xl:w-[50%] 2xl:w-[50%] shrink-0">
                            {currentLegend.map(({ color, label }) => (
                                <div key={label} className="flex items-center gap-[5px] sm:gap-2.5 text-white whitespace-nowrap text-[11px] sm:text-[13px] lg:text-[12px] xl:text-[14px]">
                                    <span
                                        className="inline-block rounded-full border-2 border-white shrink-0 w-4 h-4 sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-[26px] xl:h-[26px] 2xl:w-[30px] 2xl:h-[30px]"
                                        style={{ background: color }}
                                    />
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>

                        <div
                            className="relative shrink ml-[4px] rounded-[20px]
                                max-w-[95%] max-h-[65vh]
                                sm:max-w-[95%] sm:max-h-[68vh]
                                lg:max-w-[96%] lg:max-h-[72vh]
                                xl:max-w-full xl:max-h-[74vh]
                                2xl:max-w-full 2xl:max-h-[75vh]"
                            style={{
                                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
                                transformOrigin: 'center center',
                                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                                transition: isDragging ? 'none' : `transform 700ms ${EASE}`,
                                willChange: 'transform',
                                display: 'inline-flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <img
                                src={planImages[1]}
                                alt="2D Floor Plan"
                                className="rounded-[20px] select-none w-auto h-auto max-w-full max-h-full object-contain pointer-events-none"
                                draggable={false}
                            />
                        </div>
                    </div>
                )}
            </div>

           <img
    src={compess}
    alt="Compass"
    className="hidden lg:block absolute z-[1000] rounded-[20px]
        w-[55px] h-[55px] top-5 right-[10px]
        sm:w-[90px] sm:h-[90px] sm:top-[10px] sm:right-[14px]
        md:top-[22%] md:right-[04%]
        lg:w-[85px] lg:h-[85px] lg:top-[16%] lg:right-[6%]
        xl:w-[105px] xl:h-[105px] xl:top-[21%] xl:right-[7%]
        2xl:w-[125px] 2xl:h-[125px] 2xl:top-[20%] 2xl:right-[7.75%]"
/>

            <div className="absolute -translate-y-1/2 flex flex-col gap-1.5 sm:gap-4 lg:gap-1 xl:gap-1 z-20
                right-[10px] sm:right-[14px] md:right-[07%] lg:right-[07%] xl:right-[10%] 2xl:right-[10%] top-1/2
                md:top-[50%] lg:top-[50%] xl:top-[54%]">
                <button
                    className="rounded-[30%] bg-white/95 border-none outline-none flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.12)]
                        w-9 h-9 sm:w-[42px] sm:h-[42px] lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px]"
                    onClick={handleZoomIn}
                >
                    <img src={zoomin} alt="Zoom In" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-[24px] lg:h-[24px] xl:w-[30px] xl:h-[30px]" />
                </button>

                <button
                    disabled={zoom <= 1}
                    className={`rounded-[30%] bg-white/95 border-none outline-none flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] mt-0.5 sm:mt-2.5 lg:mt-2 xl:mt-2.5
                        w-9 h-9 sm:w-[42px] sm:h-[42px] lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px]
                        ${zoom <= 1 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    onClick={handleZoomOut}
                >
                    <img src={zoomout} alt="Zoom out" className="w-[18px] sm:w-[22px] lg:w-[24px] xl:w-[30px] h-[5px]" />
                </button>

                {zoom !== 1 && (
                    <button
                        className="rounded-[30%] bg-white/95 border-none outline-none flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.12)] mt-0.5 sm:mt-2.5 lg:mt-2 xl:mt-2.5
                            w-9 h-9 sm:w-[42px] sm:h-[42px] lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px]"
                        onClick={resetView}
                    >
                        <img src={reset} alt="Reset" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-[24px] lg:h-[24px] xl:w-[30px] xl:h-[30px]" />
                    </button>
                )}
            </div>

            {!isHiddenFloor && (
                <div
                    ref={minimapRef}
                    className="absolute bg-[#1D7AD9] flex items-center justify-center z-30 overflow-hidden cursor-pointer transition-transform
                        bottom-[55px] right-[10px] w-[90px] h-[70px] rounded-xl
                        sm:bottom-[70px] sm:right-[14px] sm:w-[130px] sm:h-[104px] sm:rounded-[20px]
                        lg:bottom-[5%] lg:right-[3%] lg:w-[160px] lg:h-[124px] lg:rounded-[20px]
                        xl:bottom-[6%] xl:right-[5.5%] xl:w-[160px] xl:h-[120px]
                        2xl:bottom-[14%] 2xl:right-[70px] 2xl:w-[200px] 2xl:h-[130px]"
                    onClick={handleMiniMapClick}
                >
                    <img src={nextImage} alt="Switch View" className="w-full h-full object-fill" />
                </div>
            )}
            
            <Fitout isOpen={showFitout} onClose={() => setShowFitout(false)} />
        </div>
    );
}