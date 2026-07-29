import { useState } from 'react';
import BuildingImage from '@/pages/ProjectDetails/BuildingImage';
import ButtonDiv from '@/pages/ProjectDetails/ButtonDiv';
import AboutUs from '@/pages/ProjectDetails/AboutUs';
import AboutUsBg from '../../assets/About us.jpg';
import { useNavigate } from 'react-router-dom';
import FloorTable from '@/pages/ProjectDetails/FloorTable';

export default function ProjectDetails() {
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);

  const handleAboutUsClose = () => {
    setShowAboutUs(false);
  };

  const handleAboutUsOpen = () => {
    setShowAboutUs(true);
  };
  const navigate = useNavigate();
  return (
    <>
      <div className="relative w-full h-screen overflow-hidden p-10">
        {/* Main building image */}
        <div className='absolute z-10 -translate-x-1/2 left-1/2 -translate-y-1/2 top-1/2'>
          <BuildingImage hoveredFloor={hoveredFloor} setHoveredFloor={setHoveredFloor} />
        </div>

        {/* Floor Table */}
       {!showAboutUs && (
  <div className="absolute left-[71%] md:left-1 md:right-auto lg:left-auto lg:right-5 
    /* Width Adjustments */
    w-[280px]      /* Base (Mobile): Fixed narrow width */
    md:w-[320px]   /* MD (Tablet): Slightly wider than mobile but restricted */
    lg:w-auto      /* LG (Desktop): Back to auto width */
    
    /* Positioning */
    top-[25%] md:top-[13%] lg:top-[10%]
    h-[75%] z-[100]">
    <FloorTable hoveredFloor={hoveredFloor} setHoveredFloor={setHoveredFloor} />
  </div>
)}
        {/* ButtonDiv */}
      {!showAboutUs && (
  <div className='fixed z-[1200] 
    /* Mobile: Bottom Right area */
    left-[95%] top-[81%] -translate-y-[80%] -translate-x-[90%]
    
    /* Tablet (Tab View) Fix: Move to top right area below logo */
    md:top-[42%] md:left-[85%] md:translate-x-[-50%] md:translate-y-0
    
    /* Desktop: Original Logic */
    lg:top-[100%] lg:left-[80%] lg:ml-[50px] lg:-translate-x-[100%] lg:-translate-y-[100%] 
    xl:left-[85%]'>
    <ButtonDiv />
  </div>
)}
        {/* About Us Glass Button */}
        {!showAboutUs && (
          <div className="absolute z-50 w-[160px] xl:bottom-[6%] xl:left-[6%] lg:bottom-[7%] lg:left-[9%] md:bottom-[25%] md:left-[3%] bottom-[20%] left-[2%] bg-[linear-gradient(164deg,rgba(200,243,255,0.54)_11.01%,rgba(128,149,255,0.54)_95.38%)] hover:w-[170px] flex items-center justify-center transition-all duration-300 group rounded-[25px] h-[45px] border border-white/30 shadow-xl cursor-pointer backdrop-blur-[8.050000190734863px]">
            <button
              // onClick={handleAboutUsOpen}
              onClick={() => navigate("/overview")}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontWeight: '500',
                fontSize: '12px',
                backgroundColor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '10px'
              }}
            >
              <span style={{ marginBottom: '5px' }}>Overview</span>
            </button>
          </div>
        )}

        {/* About Us Overlay */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1000,
            backgroundImage: `url(${AboutUsBg})`,
            backgroundSize: 'cover',
            display: showAboutUs ? 'flex' : 'none',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.3s ease',
            opacity: showAboutUs ? 1 : 0
          }}
        >
          {/* AboutUs Component */}
          <AboutUs handleClose={handleAboutUsClose} handleOpen={handleAboutUsOpen} />
        </div>
      </div>
    </>
  );
}