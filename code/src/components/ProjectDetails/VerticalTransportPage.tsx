import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import backImg from "../../assets/back.png";
import mobilityBg from '../../assets/mobility/mobility.jpeg';
import logo from "../../assets/logo.png";
import R_vector from "../../assets/mobility/Vector-right.png";
import L_vector from "../../assets/mobility/Vector-left.png";
// import axios from 'axios';
import axiosInstance from '../../api/axiosInstance';

// import V1 from "../../assets/transport/v1.mp4";
// import V2 from "../../assets/transport/v2.mp4";
// import V3 from "../../assets/transport/v3.mp4";
// import V4 from "../../assets/transport/v4.mp4";

// const sections = [
//   { id: 1, label: "VT STRATEGY SECTION 01", video: V1 },
//   { id: 2, label: "VT STRATEGY SECTION 02", video: V2 },
//   { id: 3, label: "T1 & T2 VT STRATEGY",       video: V3 },
//   // { id: 4, label: "T2 – VT STRATEGY",       video: V4 },
// ];

interface Transport {

  _id: string;
  label: string;
  video: string;
}


const VerticalTransportPage = () => {
  // const [sections, setSections] = useState([]);
  const navigate = useNavigate();
  // const [activeSection, setActiveSection] = useState(null);
  const [animating, setAnimating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // useEffect(() => {

  //   const fetchData = async () => {
  //     try {
  //       const res = await axios.get(
  //         "https://krahejabackend.onrender.com/api/transport"

  //       );
  //       setSections(res.data.data)
  //       console.log("Transport" + res.data.data)
  //     } catch (error) {
  //       console.log("Error fetching data", error);
  //     }
  //   };
  //   fetchData();


  // }, []);

  // useEffect(() => {
  //   if (sections.length > 0) {
  //     setActiveSection(sections[0]); // ✅ FIX
  //   }
  // }, [sections]);

  // if (!activeSection) return <p>Loading...</p>;



  // useEffect(() => {
  //   if (videoRef.current) {
  //     videoRef.current.load();
  //     videoRef.current.play().catch(() => { });
  //   }
  // }, [activeSection]);

  // const handleSelect = (section: typeof sections[0]) => {
  //   if (section.id === activeSection.id) return;
  //   setAnimating(true);
  //   setTimeout(() => {
  //     setActiveSection(section);
  //     setAnimating(false);
  //   }, 300);
  // };


  const [sections, setSections] = useState<Transport[]>([]);
  const [activeSection, setActiveSection] = useState<Transport | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get(
          "/transport"
        );

        setSections(res.data.data);
        // console.log("sssssssss" + JSON.stringify(res.data.data));

      } catch (error) {
        console.log("Error fetching data", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (sections.length > 0) {
      setActiveSection(sections[0]);
    }
  }, [sections]);

  if (!activeSection) return <p>Loading...</p>;

  const handleSelect = (section: Transport) => {
    if (!activeSection || section._id === activeSection._id) return;

    setAnimating(true);
    setTimeout(() => {
      setActiveSection(section);
      setAnimating(false);
    }, 300);
  };

  return (
    <div
      className="relative text-white h-screen w-screen flex flex-col bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url(${mobilityBg})` }}
    >
      {/* Back button */}
      <button
        className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 lg:top-10 lg:left-10 w-[38px] h-[38px] sm:w-11 sm:h-11 lg:w-[50px] lg:h-[50px] rounded-[30%] bg-white/95 backdrop-blur-md border border-white/20 flex items-center justify-center z-20 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
        onClick={() => navigate(-1)}
      >
        <img src={backImg} alt="Back" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-6 lg:h-6" />
      </button>

      {/* Logo */}
      <div className="absolute top-6 right-6 lg:top-10 lg:right-[80px] z-20 pointer-events-none">
        <img src={logo} className="w-[60px] lg:w-[75px]" alt="Logo" />
      </div>

      {/* Title */}
      <div className="relative z-10 w-full flex items-center justify-center gap-3 md:gap-8 pt-6 pb-2 lg:pb-4 px-16">
        <img src={R_vector} alt="" className="w-4 h-4 md:w-8 md:h-8 lg:w-20 lg:h-10 object-contain shrink-0" />
        <h1 className="text-sm sm:text-base md:text-2xl lg:text-3xl tracking-[0.15em] lg:tracking-[0.2em] text-white uppercase drop-shadow-lg text-center">
          {activeSection.label}
        </h1>
        <img src={L_vector} alt="" className="w-4 h-4 md:w-8 md:h-8 lg:w-20 lg:h-10 object-contain shrink-0" />
      </div>

      {/* ── LAPTOP (lg+): original layout — video center, buttons floating right ── */}
      <div className="hidden lg:flex flex-row flex-1 gap-6 px-6 pb-6 overflow-hidden items-center relative z-10">

        {/* Video */}
        <div
          style={{ flex: 1, transition: 'opacity 0.3s ease', opacity: animating ? 0 : 1 }}
          className="h-[80vh] flex items-center justify-center"
        >
          <div className="w-[65%] h-[90%] rounded-[20px] overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <video
              ref={videoRef}
              key={activeSection?._id}
              className="w-full h-full object-fill"
              autoPlay
              loop
              muted
            >
              <source src={activeSection.video} type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Floating right buttons */}
        <div className="absolute right-[-80px] flex flex-col justify-center gap-4 shrink-0 w-[300px]">
          {sections?.map((section) => {
            const isActive = section?._id === activeSection?._id;
            return (
              <button
                key={section?._id}
                onClick={() => handleSelect(section)}
                style={{
                  transform: 'translateX(0px)',
                  transition: 'transform 0.3s ease',
                  backgroundColor: isActive ? ' #5ebfe9a0' : '#82cbece3',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(-50px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0px)';
                }}
                className="px-6 py-4 rounded-[50px] text-sm  tracking-wider
                           text-white text-left cursor-pointer shadow-md whitespace-nowrap
                           border border-white/30 hover:border-white backdrop-blur-md"
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MOBILE / TABLET (< lg): video top, buttons bottom ── */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden z-10 pb-4">

        {/* Video — fills available space */}
       <div
  // Added flex, items-center, and justify-center to center it on mobile. 
  // Added lg:block if you need it to revert to standard block layout on desktop.
  className="flex-1 flex items-center justify-center lg:block min-h-0 px-3 pt-1 pb-2"
  style={{ transition: 'opacity 0.3s ease', opacity: animating ? 0 : 1 }}
>
  <div className="w-full h-auto rounded-[16px] overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white">
    <video
      ref={videoRef}
      key={activeSection._id}
      className="w-full h-full object-contain"
      autoPlay
      loop
      muted
      playsInline
    >
      <source src={activeSection.video} type="video/mp4" />
    </video>
  </div>
</div>
        {/* Bottom button strip */}
        <div className="flex-shrink-0 px-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="grid grid-cols-2 gap-2">
              {sections?.map((section) => {
                const isActive = section?._id === activeSection?._id;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSelect(section)}
                    style={{
                      backgroundColor: isActive ? '#0ea4e99d' : '#5ebfe9a0',
                    }}
                    className="px-3 py-2.5 rounded-[12px] text-[10px] sm:text-xs font-bold tracking-wider
                               text-white text-center cursor-pointer shadow-md
                               border border-white/30 active:border-white transition-all duration-200"
                  >
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerticalTransportPage;