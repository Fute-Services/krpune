import React, {
  useState,
  useRef, useCallback, useEffect
} from 'react';
import { useNavigate } from 'react-router-dom';
// import zoningImg from '../../assets/mobility/zoneing.jpg';
// import lowerZoneVid from '../../assets/mobility/lowerzone.mp4';
// import upperZoneVid from '../../assets/mobility/upperzone.mp4';
import mobilityBg from '../../assets/mobility/mobility.jpeg';
import backImg from "../../assets/back.png";
import logo from "../../assets/logo.png";
import R_vector from "../../assets/mobility/Vector-right.png";
import L_vector from "../../assets/mobility/Vector-left.png";
import { getMobility } from '@/data/offlineApi';

const MobilityPage = () => {
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getMobility();
        setContentItems(res.data?.data || []);
      } catch (err) {
        console.log("Error while fetching....", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedItem = contentItems?.[selectedIndex];

  const otherIndices = contentItems
    ?.map((_, i) => i)
    .filter((i) => i !== selectedIndex);

  const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
  const DUR = "750ms";

  // No loading screen — render nothing until content is ready (data is local/instant).
  if (isLoading || !contentItems.length) {
    return null;
  }

  return (
    <div
      className="relative text-white h-screen w-screen flex flex-col items-center bg-cover bg-center bg-no-repeat overflow-hidden font-sans"
      style={{ backgroundImage: `url(${mobilityBg})` }}
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img src={logo} className="absolute w-[80px] top-[6%] right-[7%] hidden lg:block" alt="Logo" />
      </div>

      {/* ── LAPTOP (lg+) ── */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative w-full z-10 px-4">

        {/* Title Section */}
        <div className="absolute top-[6%] z-20 pointer-events-none flex items-center justify-center gap-8">
          <img src={R_vector} alt="" className="w-20 lg:h-10 object-contain" />
          <h2 className="text-white text-lg lg:text-3xl font-bold uppercase tracking-[0.2em] text-center">
            {selectedItem?.title}
          </h2>
          <img src={L_vector} alt="" className="w-20 lg:h-10 object-contain" />
        </div>

        {/* Main media container */}
        <div className="relative w-[65%] h-[70vh] flex items-center justify-center">
          {contentItems?.map((item, index) => {
            const isActive = selectedIndex === index;
            const isVideo = item.url?.includes(".mp4");

            return (
              <div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'scale(1)' : 'scale(0.1)',
                  transformOrigin: 'bottom right',
                  transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
                  pointerEvents: isActive ? 'auto' : 'none',
                  zIndex: isActive ? 20 : 10
                }}
              >
                <div className="w-[80vw] h-[75vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[20px] overflow-hidden border border-white/20 bg-black">
                  {!isVideo ? (
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <video
                      src={item.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Side Panel (Thumbnails) */}
        <div className="absolute top-[30%] right-[4%] z-[1300] flex flex-col gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-[20px] p-3 shadow-2xl">
          {otherIndices.map((idx) => {
            const item = contentItems[idx];
            const isVideo = item.url?.includes(".mp4");

            return (
              <div
                key={idx}
                className="relative w-[165px] h-[115px] rounded-[14px] overflow-hidden cursor-pointer border-2 border-white/30 hover:border-white transition-all duration-300 shadow-xl"
                onClick={() => setSelectedIndex(idx)}
              >
                {!isVideo ? (
                  <img src={item.url} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.url} muted loop autoPlay playsInline className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-2">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center px-1">
                    {item.title}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── MOBILE & TABLET (up to lg) ── */}
      <div className="flex lg:hidden flex-col w-full h-full z-10">
        <div className="flex items-center justify-center gap-3 pt-14 md:pt-16 pb-4 md:pb-2 px-4 md:px-8">
          <h2 className="text-white text-base md:text-xl font-bold uppercase text-center tracking-wider">
            {selectedItem?.title}
          </h2>
        </div>

        <div className="flex-1 relative w-full px-4 md:px-12 pb-4 md:pb-8">
          {contentItems.map((item, index) => {
            const isActive = selectedIndex === index;
            const isVideo = item.url?.includes(".mp4");
            return (
              <div
                key={index}
                // md:-translate-y-6 added here to shift the container upwards visually on tablet
                className="absolute inset-0 px-4 md:px-12 flex items-center justify-center md:-translate-y-6"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'scale(1)' : 'scale(0.1)',
                  transformOrigin: 'bottom right', 
                  transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
                  pointerEvents: isActive ? 'auto' : 'none',
                  zIndex: isActive ? 20 : 10
                }}
              >
                {/* md:w-fit added here to force the container to hug the width of the image.
                    This removes the empty black space on the left and right sides.
                */}
                <div className="w-full h-auto md:w-fit md:h-full md:max-h-[55vh] flex items-center justify-center shadow-xl rounded-[20px] overflow-hidden border border-white/20 bg-black">
              
                  {!isVideo ? (
                    // md:w-auto ensures the image dictates its own width on tablet, letting the container wrap it tightly
                    <img src={item.url} className="w-full h-full object-contain md:w-auto" alt="" />
                  ) : (
                    <video
                      src={item.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover md:w-auto md:object-contain"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile / Tablet bottom thumbnails */}
        <div className="w-full pb-8 md:pb-8 md:mt-2 px-4 md:px-12">
          <div className="flex flex-row justify-center gap-3 md:gap-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-[20px] p-2.5 md:p-4">
            {otherIndices.map((idx) => {
              const item = contentItems[idx];
              const isVideo = item.url?.includes(".mp4");
              return (

                <div
                  key={idx}
                  className="relative rounded-[14px] overflow-hidden border-2 border-white/30 h-20 md:h-28 flex-1"
                  onClick={() => setSelectedIndex(idx)}
                >
                  {!isVideo ? (
                    <img src={item.url} className="w-full h-full object-cover" />
                  ) : (
                    <video src={item.url} muted loop autoPlay playsInline className="w-full h-full object-cover" />
                  )}
                </div>

              )
            })}
          </div>
        </div>
      </div>

      {/* Back Button */}
      <button
        className="absolute top-10 left-10 md:top-8 md:left-8 lg:top-10 lg:left-10 w-11 h-11 rounded-[30%] bg-white/95 flex items-center justify-center z-[1500] shadow-lg cursor-pointer active:scale-90 transition-transform"
        onClick={() => navigate(-1)}
      >
        <img src={backImg} alt="Back" className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MobilityPage;