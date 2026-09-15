import { useState } from 'react';
import ThemeToggle from '../../components/DayNightToggle/DayNightToggle';
import LocationMap from '../Location/index';
import logo from '../../assets/logo.png';
import { useNavigate } from "react-router-dom";
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

  const toggleTheme = () => {
    setIsNight(!isNight);
  };

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
              <div className="pdf-modal-actions">
                {/* iOS Safari renders an iframed PDF as a single unscrollable
                    page, so on an iPad the embed below shows the cover and
                    nothing else. Rather than swap in a PDF renderer, give every
                    platform the same escape hatch: open the file itself, where
                    the OS viewer handles scrolling, zoom, share and print.
                    Verified to work offline — the PDF is precached and the
                    worker's precache route answers this navigation ahead of
                    navigateFallback, so it does not get index.html instead. */}
                <a
                  className="pdf-open-btn"
                  href={brochurePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open full screen
                </a>
                <button className="pdf-close-btn" onClick={() => setShowPdfModal(false)}>×</button>
              </div>
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