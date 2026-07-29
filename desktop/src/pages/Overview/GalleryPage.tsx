// import React, { useState, useMemo, useEffect } from 'react';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { EffectCoverflow, Navigation } from 'swiper/modules';

// // Swiper styles
// import 'swiper/css';
// import 'swiper/css/effect-coverflow';
// import 'swiper/css/navigation';

// import bgImage from '../../assets/gallery/gallery-bg.png';
// import Logo from './Logo';
// import BackButton from './BackButton';

// import img1 from "../../assets/gallery/1.png";
// import img2 from "../../assets/gallery/2.png";
// import img3 from "../../assets/gallery/3.png";
// import img4 from "../../assets/gallery/4.png";
// import img5 from "../../assets/gallery/5.png";
// import axios from 'axios'
// // Category-oda images array
// const allImages = [
//     { src: img1, title: "Exterior View 1", category: "exterior" },
//     { src: img2, title: "Exterior View 2", category: "exterior" },
//     { src: img3, title: "Exterior View 3", category: "exterior" },
//     { src: img4, title: "Exterior View 4", category: "exterior" },
//     { src: img5, title: "Exterior View 5", category: "exterior" },
// ];

// export default function GalleryPage() {
//     // const [activeIndex, setActiveIndex] = useState(0);
//     // const [viewMode, setViewMode] = useState('exterior'); // Default exterior-la irukkum


//     // // Select aagura category images-ai mattum filter panra logic
//     // const filteredImages = useMemo(() => {
//     //     return allImages.filter(img => img.category === viewMode);
//     // }, [viewMode]);


//     //  useEffect(() => {
//     //     const fetchData = async () => {
//     //         try { 
//     //             const res = await axios.get("https://krahejabackend.onrender.com/api/gallery") 
//     //             console.log("......."+res.data.data)
//     //         }catch(err){
//     //             console.log(err)
//     //         }
//     //     }
//     //     fetchData()
//     // }, [])

//     //         }
//     const [activeIndex, setActiveIndex] = useState(0);
//     const [viewMode, setViewMode] = useState("exterior");
//     const [allImages, setAllImages] = useState([]);

//     // console.log("......................"+allImages)
//     // Fetch data from API
//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const res = await axios.get(
//                     "https://krahejabackend.onrender.com/api/gallery"
//                 );
//                 setAllImages(res.data || []);

//                 console.log(".........." + JSON.stringify(res))
//                 // console.log(".........."+JSON.stringyfy(res))
//             } catch (err) {
//                 console.log(err);
//             }
//         };
//         fetchData();
//     }, []);

//     const filteredImages = useMemo(() => {
//     return allImages.find((img) => img.category === viewMode)?.images || [];
// }, [allImages, viewMode]);

//     return (
//         <div
//             className="w-screen h-screen overflow-hidden relative bg-cover bg-center flex flex-col items-center"
//             style={{ backgroundImage: `url(${bgImage})` }}
//         >
//             <Logo />
//             <div className="absolute top-10 left-10 z-50">
//                 <BackButton to="/" />
//             </div>

//             {/* Title */}
//             <div className="mt-20 h-20 flex items-center justify-center">
//                 <h2 className="text-white text-5xl font-medium">
//                     {filteredImages[activeIndex]?.title || "No Images"}
//                 </h2>
//             </div>

//             {/* Carousel Container */}
//             <div className="w-full flex-1 flex items-center justify-center min-h-0">
//                 <Swiper
//                     key={viewMode} // Category maarum pothu swiper reset panna key mukkiyam
//                     effect={'coverflow'}
//                     centeredSlides={true}
//                     slidesPerView={1.8}
//                     loop={filteredImages.length > 2}
//                     speed={800}
//                     onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
//                     coverflowEffect={{
//                         rotate: 25,
//                         stretch: 0,
//                         depth: 300,
//                         modifier: 1,
//                         slideShadows: false,
//                     }}
//                     navigation={{
//                         nextEl: '.custom-next',
//                         prevEl: '.custom-prev',
//                     }}
//                     modules={[EffectCoverflow, Navigation]}
//                     className="w-full h-full"
//                 >
//                     {filteredImages.map((img, index) => (
//                         <SwiperSlide key={index} className="flex items-center justify-center">
//                             <div className="image-wrapper w-[100%] h-[87%] flex items-center justify-center ">
//                                 <img 
//                                     // src={img.src} 
//                                      src={img.url || img.image} 
//                                     alt={img.title} 
//                                     className="max-w-full max-h-full object-contain rounded-3xl border border-white/20 transition-all duration-700"
//                                 />
//                             </div>
//                         </SwiperSlide>
//                     ))}
                   
//                 </Swiper>
//             </div>

//             {/* Bottom Controls */}
//             <div className="mb-10 flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full gap-4 z-50 shadow-lg">

//                 {/* Prev */}
//                 <button className="custom-prev group outline-none cursor-pointer">
//                     <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 group-hover:bg-white/30 transition-all">
//                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="15 18 9 12 15 6"></polyline>
//                         </svg>
//                     </div>
//                 </button>

//                 {/* Toggle Group */}
//                 <div className="flex bg-black/20 rounded-full p-1 border border-white/10">
//                     <button
//                         onClick={() => { setViewMode('interior'); setActiveIndex(0); }}
//                         className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${viewMode === 'interior' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
//                     >
//                         INTERIOR
//                     </button>
//                     <button
//                         onClick={() => { setViewMode('exterior'); setActiveIndex(0); }}
//                         className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${viewMode === 'exterior' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
//                     >
//                         EXTERIOR
//                     </button>
//                 </div>

//                 {/* Next */}
//                 <button className="custom-next group outline-none cursor-pointer">
//                     <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 group-hover:bg-white/30 transition-all">
//                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="9 18 15 12 9 6"></polyline>
//                         </svg>
//                     </div>
//                 </button>
//             </div>

//             <style tsx global>{`
//                 .swiper-slide {
//                     transform: translateY(60px) scale(1) !important;
//                     transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
//                 }
//                 .swiper-slide-active {
//                     opacity: 1;
//                     transform: translateY(0) scale(1) !important;
//                     filter: blur(0px);
//                     z-index: 10;
//                 }
//                 .swiper {
//                     perspective: 1200px;
//                 }
//             `}</style>
//         </div>
//     );
// }
import React, { useState, useMemo, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation } from 'swiper/modules';
import { getGallery } from '@/data/offlineApi';

// Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';

import bgImage from '../../assets/gallery/gallery-bg.png';
import BackButton from './BackButton';

export default function GalleryPage() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [viewMode, setViewMode] = useState("exterior");
    const [allImages, setAllImages] = useState([]);

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getGallery();
                setAllImages(res.data || []);
            } catch (err) {
                console.log(err);
            }
        };
        fetchData();
    }, []);

    const filteredImages = useMemo(() => {
        return allImages.find((img) => img.category === viewMode)?.images || [];
    }, [allImages, viewMode]);

    return (
        <div className="w-screen h-screen overflow-hidden relative bg-black">
    {/* Back Button */}
    <div className="absolute top-10 left-10 z-50">
        <BackButton to="/" />
    </div>

    {/* Title - Positioned over the full-screen image */}
    <div className="absolute bottom-28 left-0 w-full z-40 flex flex-col items-center pointer-events-none">
        <h2 className="text-white text-4xl md:text-3xl font-light tracking-widest uppercase drop-shadow-2xl">
            {filteredImages[activeIndex]?.title || ""}
        </h2>
        <div className="h-[2px] w-24 bg-white/50 mt-4" />
    </div>

    {/* Carousel Container */}
    <div className="absolute inset-0 w-full h-full z-10">
        <Swiper
            key={viewMode}
            effect={'coverflow'}
            centeredSlides={true}
            slidesPerView={1}
            loop={filteredImages.length > 2}
            speed={1000}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            coverflowEffect={{
                rotate: 0,
                stretch: 80,
                depth: 200,
                modifier: 1,
                slideShadows: false, // shadows dulled the images — off for full-vibrancy
            }}
            navigation={{
                nextEl: '.custom-next',
                prevEl: '.custom-prev',
            }}
            modules={[EffectCoverflow, Navigation]}
            className="w-full h-full"
        >
            {filteredImages.map((img, index) => (
                <SwiperSlide key={index} className="w-full h-full overflow-hidden">
                    <div className="relative w-full h-full">
                        <img 
                            src={img.url || img.image}
                            alt={img.title}
                            className="w-full h-full object-cover"
                        />
                        {/* Only a light darkening at the very bottom so the title
                            stays readable — no more full-image dark overlay that
                            made every photo look dull. */}
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    </div>

    {/* Bottom Controls - UPDATED TO MATCH REFERENCE COLORS */}
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 z-50">

        {/* Previous Button */}
        <button className="custom-prev group outline-none cursor-pointer">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#719BC5]/40 backdrop-blur-md border border-white/20 group-hover:bg-[#719BC5]/60 transition-all shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </div>
        </button>

        {/* Toggle Group Container - Updated Visuals */}
        <div className="flex items-center bg-[#719BC5]/40 backdrop-blur-xl border border-white/20 p-1.5 rounded-full shadow-2xl">
            <button
                onClick={() => { setViewMode('interior'); setActiveIndex(0); }}
                className={`px-8 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-500 flex items-center gap-2 ${
                    viewMode === 'interior' 
                    ? 'bg-[#3b79b6] text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]' 
                    : 'text-white/90 hover:bg-white/10'
                }`}
            >
                INTERIOR
            </button>
            <button
                onClick={() => { setViewMode('exterior'); setActiveIndex(0); }}
                className={`px-8 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-500 flex items-center gap-2 ${
                    viewMode === 'exterior' 
                    ? 'bg-[#3b79b6] text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]' 
                    : 'text-white/90 hover:bg-white/10'
                }`}
            >
                EXTERIOR
            </button>
        </div>

        {/* Next Button */}
        <button className="custom-next group outline-none cursor-pointer">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#719BC5]/40 backdrop-blur-md border border-white/20 group-hover:bg-[#719BC5]/60 transition-all shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>
        </button>
    </div>

    <style tsx global>{`
        .swiper-slide {
            transition: transform 1s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.8s ease !important;
            opacity: 0.7;
        }
        .swiper-slide-active {
            opacity: 1 !important;
            z-index: 10;
        }
    `}</style>
</div>
    );
}