// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FaPlus, FaMinus, FaRegCompass, FaAngleDown, FaAngleUp, FaXmark } from 'react-icons/fa6';
// import './style.css';
// import bgUnit from '../../assets/unit/bgunit.png';
// import floor1to17 from '../../assets/unit/floor1to17same.png';

// // Placeholder Images array
// const planImages = [
// //   "https://placehold.co/1000x800/2980b9/ffffff?text=Master+Layout",
//   floor1to17,
//   "https://placehold.co/1000x800/c0392b/ffffff?text=Unit+Type+B"
// ];

// // Dynamic Room Data
// const getRoomsForFloor = (floorId: string) => {
//   const id = parseInt(floorId);

//   if (id === 1) {
//     return [
//       'Grand Entrance Lobby', 
//       'Reception & Concierge', 
//       'Security Command Center', 
//       'Visitor Waiting Lounge', 
//       'Lift Lobby', 
//       'Fire Escape Staircase', 
//       'Building Mgmt Office', 
//       'Common Restrooms'
//     ];
//   }

//   if (id === 17) {
//     return [
//       'Executive Sky Lounge', 
//       'Chairman\'s Suite', 
//       'Boardroom', 
//       'Rooftop Garden Access', 
//       'Fine Dining Area', 
//       'VIP Lift Lobby', 
//       'Server Room', 
//       'Executive Restrooms'
//     ];
//   }

//   // Standard Floors (2-16)
//   return [
//     `Floor ${id} - Tower 8 / Tower 9`,
//     'Office Space',
//     'Lift Lobby',
//     'Fire Tower',
//     'Services Balcony',
//     'Fire Escape Staircase',
//     'Lift Shaft',
//     'Services Shaft',
//     'AHU Room',
//     'Gents Restroom',
//     'Ladies Restroom',
//     'Refuge Balcony'
//   ];
// };

// const UnitPlanPage = () => {
//   const navigate = useNavigate();
//   const [activeItem, setActiveItem] = useState('1');
//   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
//   const [isPanelOpen, setIsPanelOpen] = useState(false);
//   const [activeRoom, setActiveRoom] = useState<string | null>(null);
//   const [zoom, setZoom] = useState(1);

//   // Get dynamic rooms for current floor
//   const currentRooms = getRoomsForFloor(activeItem);

//   // Zoom handlers
//   const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.5));
//   const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.6));

//   // Handle Image Switch (Cycle through images)
//   const handleMiniMapClick = () => {
//     setSelectedImageIndex((prevIndex) => (prevIndex + 1) % planImages.length);
//   };

//   const currentImage = planImages[selectedImageIndex];
//   const nextImage = planImages[(selectedImageIndex + 1) % planImages.length];

//   return (
//     <div 
//       className="unit-plan-page"
//       style={{
//         backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${bgUnit})`
//       }}
//     >
//       {/* Faded Background Text (Watermark) */}
//       <div className="watermark-text">Floor {activeItem}</div>

//       {/* Top Left Back Button */}
//       <button 
//         className="back-btn" 
//         onClick={() => navigate(-1)} 
//         aria-label="Go Back"
//       >
//         <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/></svg>

//       </button>

//       {/* Menu Toggle Button */}
//       <button 
//         className="panel-toggle-btn" 
//         onClick={() => setIsPanelOpen(!isPanelOpen)}
//         aria-label="Toggle Details"
//       >
//         {isPanelOpen ? <FaAngleUp /> : <FaAngleDown />}
//       </button>

//       {/* Sliding Left Panel */}
//       <div className={`sliding-panel ${isPanelOpen ? 'open' : ''}`}>
//         <div className="panel-header">
//           <span>Floor {activeItem} Details</span>
//           {/* <FaXmark style={{cursor: 'pointer'}} onClick={() => setIsPanelOpen(false)} /> */}
//         </div>
//         <ul className="panel-list">
//           {currentRooms.map((room, index) => (
//             <li 
//               key={index} 
//               className={`panel-item ${activeRoom === room ? 'active' : ''}`}
//               onClick={() => setActiveRoom(room)}
//             >
//               {room}
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* Main Content (3D Floor Plan) */}
//       <div className="main-content">
//         <img
//           src={currentImage}
//           key={currentImage} // Forces animation restart on change
//           alt="3D Floor Plan"
//           className="floor-plan-img"
//           style={{
//             transform: `scale(${zoom})`,
//           }}
//         />
//       </div>

//       {/* Right Side Controls */}
//       <div className="right-controls">
//         <button className="control-btn" title="Compass">
//           <FaRegCompass />
//         </button>
//         <button className="control-btn" onClick={handleZoomIn} title="Zoom In">
//           <FaPlus />
//         </button>
//         <button className="control-btn" onClick={handleZoomOut} title="Zoom Out">
//           <FaMinus />
//         </button>
//       </div>

//       {/* Mini Map (Bottom Right) */}
//       <div className="mini-map" onClick={handleMiniMapClick} title="Click to Switch View">
//         <img 
//           src={nextImage} 
//           alt="Mini Map Preview" 
//           className="mini-map-img" 
//         />
//       </div>
//     </div>
//   );
// };

// export default UnitPlanPage;