// import { useState, useEffect, useRef } from 'react';
// import ThemeToggle from '../../components/DayNightToggle/DayNightToggle';
// import LocationMap from '../Location/index';
// import dayBg from '../../assets/day.jpg';
// import nightBg from '../../assets/night.jpg';
// import logo from '../../assets/logo.png';
// // import VideoCallButton from '../../components/VideoCallButton/VideoCallButton';
// import { FaMagnifyingGlass } from 'react-icons/fa6';
// import { useNavigate } from "react-router-dom";
// import blueprint from '../../assets/raheja_blueprint_new.jpeg';
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import broucher from '../../assets/broucher.png'
// import brochurePdf from '../../assets/broucher/KRC.pdf';
// import metrics from '../../assets/blueprint.png'
// import construction from "../../assets/construction.png";
// import walkthrough from "../../assets/cognitive-walkthrough.png";
// import gallery from "../../assets/user-interface.png";
// import metrics1 from '../../assets/key matrics/gtpw.png'
// import metrics2 from '../../assets/key matrics/tenate.png'
// import metrics3 from '../../assets/key matrics/sustinabality.png';
// import metrics4 from '../../assets/key matrics/shell.png'
// import metrics5 from '../../assets/key matrics/refrese.png'

// import './style.css';

// const Home = () => {
//   const [isNight, setIsNight] = useState(true);
//   const [activeView, setActiveView] = useState('Home');
//   const [showPdfModal, setShowPdfModal] = useState(false); // New state for PDF

//   useEffect(() => {
//     const preloadImg = new Image();
//     preloadImg.src = isNight ? dayBg : nightBg;
//   }, [isNight]);

//   const toggleTheme = () => {
//     setIsNight(!isNight);
//   };

//   const [query, setQuery] = useState("");
//   const [expanded, setExpanded] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const navigate = useNavigate();

//   const [showMetrics, setShowMetrics] = useState(false);
//   const timelineRef = useRef<HTMLDivElement>(null);

//   const properties = [
//     { floor: "1",  unit: "1401", image: blueprint },
//     { floor: "2",  unit: "1502", image: blueprint },
//     { floor: "3",  unit: "1502", image: blueprint },
//     { floor: "4",  unit: "1502", image: blueprint },
//     { floor: "5",  unit: "1502", image: blueprint },
//     { floor: "6",  unit: "1502", image: blueprint },
//     { floor: "7",  unit: "1502", image: blueprint },
//     { floor: "8",  unit: "1502", image: blueprint },
//     { floor: "9",  unit: "1502", image: blueprint },
//     { floor: "10", unit: "1502", image: blueprint },
//     { floor: "11", unit: "1502", image: blueprint },
//     { floor: "12", unit: "1502", image: blueprint },
//     { floor: "13", unit: "1502", image: blueprint },
//     { floor: "14", unit: "1502", image: blueprint },
//     { floor: "15", unit: "1502", image: blueprint },
//     { floor: "16", unit: "1502", image: blueprint },
//     { floor: "17", unit: "1502", image: blueprint },
//   ];

//   useEffect(() => {
//     if (expanded) {
//       inputRef.current?.focus();
//     }
//   }, [expanded]);

//   useEffect(() => {
//     function handleClickOutside(e: MouseEvent) {
//       if (!(e.target as HTMLElement).closest(".search-container")) {
//         setExpanded(false);
//       }
//     }
//     document.addEventListener("click", handleClickOutside);
//     return () => document.removeEventListener("click", handleClickOutside);
//   }, []);

//   const handleSearch = (): void => {
//     const searchText = query.trim().toLowerCase();
//     const match = searchText.match(/floor\s*(\d+)/i);

//     if (!match) {
//       toast.error("Please enter a valid floor (e.g., floor 2)");
//       return;
//     }

//     const floorNumber = match[1];
//     const result = properties.find((item) => item.floor === floorNumber);

//     if (result) {
//       navigate("/blueprint", { state: result });
//     } else {
//       toast.warning("No result found");
//     }
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
//     if (e.key === "Enter") {
//       handleSearch();
//     }
//   };

//   const metricsData = [
//     { text: 'Great Place to Work', icon: metrics1 },
//     { text: 'Tenant Split Strategy', icon: metrics2 },
//     { text: 'Sustainability Initiatives', icon: metrics3 },
//     { text: 'Shell + Core', icon: metrics4 },
//     { text: 'Refresh Spaces', icon: metrics5 },
//   ];

//   return (
//     <div
//       className="home-page"
//       style={{
//         backgroundImage:
//           activeView === 'Location'
//             ? 'none'
//             : `url(${isNight ? nightBg : dayBg})`,
//       }}
//     >
//       {/* Location Map */}
//       {activeView === 'Location' && (
//         <LocationMap onViewChange={setActiveView} />
//       )}

//       {/* Header */}
//       {activeView !== 'Location' && (
//         <div className="header-wrapper">
//           <div className="header-content">
//             <div className="header-section">
//               <img src={logo} className="header-logo1 ml-[20px]" alt="Raheja Logo" />
//             </div>
//           </div>
//           <div className="white-header1 ">
//             <div className="header-content">
//               <div className="header-section">
//                 <img src={logo} className="header-logo" alt="Raheja Logo" />
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Floating Buttons */}
//       {activeView !== 'Location' && (
//         <div className="right-controls mr-8 ">

//          <div className="custom-tooltip-wrapper">
//   <button
//     className="floating-btn"
//     onClick={() => setShowMetrics(prev => !prev)}
//   >
//     <img
//       src={metrics}
//       width={25}
//       alt="Project Info"
//       style={{ filter: "brightness(0) invert(1)" }}
//     />
//   </button>
//   <span className="custom-tooltip-text">Project Info</span>
// </div>

// <div className="custom-tooltip-wrapper mt-2">
//             <button
//               onClick={() => setShowPdfModal(true)}
//               className="floating-btn"
//             >
//               <img src={broucher} width={25} alt="Corporate Profile" />
//             </button>
//             <span className="custom-tooltip-text">Corporate Profile</span>
//           </div>

// {/* 
//           <VideoCallButton /> */}

          
// {/* Walkthrough Button */}
// {/* <div className="custom-tooltip-wrapper mt-2">
//   <button
//     onClick={() => navigate("/walkthrough")}
//     className="floating-btn"
//   >
//     <img src={walkthrough} width={40} alt="Walkthrough" style={{ filter: "brightness(0) invert(1)" }} />
//   </button>
//   <span className="custom-tooltip-text">Walkthrough</span>
// </div> */}

//           {/* <div className="custom-tooltip-wrapper mt-2">
//   <button
//     onClick={() => navigate("/gallery")}
//     className="floating-btn"
//   >
//     <img src={gallery} width={25} alt="Gallery" style={{ filter: "brightness(0) invert(1)" }} />
//   </button>
//   <span className="custom-tooltip-text">Gallery</span>
// </div> */}

// <div className="custom-tooltip-wrapper mt-2">
//             <button
//               onClick={() => setShowPdfModal(true)}
//               className="floating-btn"
//             >
//               <img src={construction} width={35} alt="Contruction Progress" style={{ filter: "brightness(0) invert(1)" }} />
//             </button>
//             <span className="custom-tooltip-text">Construction Progress</span>
//           </div>


          

//           <ThemeToggle isNight={isNight} onToggle={toggleTheme} />  
//         </div>
//       )}

//       {/* Key Metrics Timeline */}
//       {/* {showMetrics && (
//         <>
//           <div
//             className="timeline-backdrop"
//             onClick={() => setShowMetrics(false)}
//           />
//           <div ref={timelineRef} className="key-metrics-timeline mr-12 ">
//             <div className="timeline-line "></div>
//             {metricsData.map(({ text, icon }, index) => (
//               <div
//                 key={text}
//                 className={`metric-item${
//                   index === metricsData.length - 1 ? ' metric-item--last' : ''
//                 }`}
//               >
//                 <span>{text}</span>
//                 <div className="metric-icon-wrapper">
//                   <img src={icon} alt={text} className="metric-icon" />
//                 </div>
//                 <div className="horizontal-line "></div>
//               </div>
//             ))}
//           </div>
//         </>
//       )} */}

//       {/* Internal PDF Modal Section */}
//       {showPdfModal && (
//         <div className="pdf-modal-overlay" onClick={() => setShowPdfModal(false)}>
//           <div className="pdf-modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="pdf-modal-header">
//               <h3>Corporate Profile</h3>
//               <button className="pdf-close-btn" onClick={() => setShowPdfModal(false)}>×</button>
//             </div>
//             <div className="pdf-container">
//               <iframe
//                 src={`${brochurePdf}#toolbar=1&navpanes=0`}
//                 width="100%"
//                 height="100%"
//                 title="Brochure PDF"
//               ></iframe>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Home;
import { useState, useRef } from 'react';
import ThemeToggle from '../../components/DayNightToggle/DayNightToggle';
import LocationMap from '../Location/index';
import logo from '../../assets/logo.png';
import { useNavigate } from "react-router-dom";
import blueprint from '../../assets/raheja_blueprint_new.jpeg';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import broucher from '../../assets/broucher.png'
import brochurePdf from '../../assets/broucher/KRC.pdf';
import metrics from '../../assets/blueprint.png'
import construction from "../../assets/construction.png";
import Rightbutton from "@/pages/Overview/RightButton";

import './style.css';

const Home = () => {
  const [isNight, setIsNight] = useState(true);
  const [activeView, setActiveView] = useState('Home');
  const [showPdfModal, setShowPdfModal] = useState(false);

  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showMetrics, setShowMetrics] = useState(false);

  const toggleTheme = () => {
    setIsNight(!isNight);
  };

  const properties = [
    { floor: "1", unit: "1401", image: blueprint },
    { floor: "2", unit: "1502", image: blueprint },
    // ... rest of your properties
  ];

  return (
    <div className="home-page">
      {/* Day / Night background crossfade layers */}
      {activeView !== 'Location' && (
        <>
          <div
            className="home-bg"
            style={{
              backgroundImage: `url(${import.meta.env.BASE_URL}media/home/day_x1f_cwkyrz.png)`,
              opacity: isNight ? 0 : 1,
            }}
          />
          <div
            className="home-bg"
            style={{
              backgroundImage: `url(${import.meta.env.BASE_URL}media/home/C02_2.jpg_vcclaz.jpg)`,
              opacity: isNight ? 1 : 0,
            }}
          />
        </>
      )}

      {/* Location Map */}
      {activeView === 'Location' && (
        <LocationMap onViewChange={setActiveView} />
      )}

      {/* Header */}
      {activeView !== 'Location' && (
        <div className="header-wrapper">
          <div className="header-content">
            <div className="header-section">
              <img src={logo} className="header-logo1 ml-[20px]" alt="Raheja Logo" />
            </div>
          </div>
          <div className="white-header1">
            <div className="header-content">
              <div className="header-section">
                <img src={logo} className="header-logo" alt="Raheja Logo" />
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Glassmorphic Side Controls */}
      {activeView !== 'Location' && (
        <div className="right-controls mr-8 flex flex-col items-center gap-4">
          
          {/* Main Glass Pill Container */}
          <div className="flex flex-col items-center gap-6 py-2 px-2 
            bg-blue-900/20  
            border border-white/30 rounded-[20px] 
            shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
          >
            
            {/* Key Metrics / Project Info */}
            <div className="custom-tooltip-wrapper flex flex-col items-center gap-1 group">
              <button
                className="floating-btn"
                onClick={()=>navigate("/projectinfo")}
              >
                <img
                  src={metrics}
                  width={25}
                  alt="Project Info"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </button>
              <span className="text-[10px] text-white font-small tracking-loose text-center leading-tight">
                Project Info
              </span>
            </div>

            {/* Corporate Profile */}
            <div className="custom-tooltip-wrapper flex flex-col items-center gap-1 group">
              <button
                onClick={() => setShowPdfModal(true)}
                className="floating-btn"
              >
                <img src={broucher} width={25} alt="Corporate Profile" />
              </button>
              <span className="text-[10px] text-white font-small tracking-loose text-center leading-tight">
                Corporate<br/>Profile
              </span>
            </div>

            {/* Construction Progress */}
            <div className="custom-tooltip-wrapper flex flex-col items-center gap-1 group">
              <button
                onClick={()=>navigate("/construction")}
                className="floating-btn"
              >
                <img 
                  src={construction} 
                  width={35} 
                  alt="Construction Progress" 
                  style={{ filter: "brightness(0) invert(1)" }} 
                />
              </button>
              <span className="text-[10px] text-white font-small tracking-loose text-center leading-tight">
                Construction<br/>Progress
              </span>
            </div>
          </div>

          {/* Theme Toggle (Outside the pill) */}
          <ThemeToggle isNight={isNight} onToggle={toggleTheme} />  
        </div>
      )}

<div className="absolute bottom-20 md:bottom-[16%] lg:bottom-[5%] left-6 md:left-24 lg:left-16 ">
  <Rightbutton />
</div>
      


      {/* Internal PDF Modal */}
      {showPdfModal && (
        <div className="pdf-modal-overlay" onClick={() => setShowPdfModal(false)}>
          <div className="pdf-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <h3>Corporate Profile</h3>
              <button className="pdf-close-btn" onClick={() => setShowPdfModal(false)}>×</button>
            </div>
            <div className="pdf-container">
              <iframe
                src={`${brochurePdf}#toolbar=1&navpanes=0`}
                width="100%"
                height="100%"
                title="Brochure PDF"
              ></iframe>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default Home;