import { useState } from 'react';
import bgImage from '../../assets/Overviewnew/About us.png';
import backImg from '../../assets/back.png';
import { useNavigate } from 'react-router-dom';
// import RightButton from './RightButton';
import Logo from './Logo';
import BottomNavbar from './BottomNavbar';
import { FaAngleUp, FaAngleDown } from "react-icons/fa";

export default function Overview() {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    return (
        <div
            className="
                relative flex items-center justify-center
                w-full min-h-screen overflow-hidden
                bg-blue-50 bg-center bg-contain lg:bg-cover bg-no-repeat
            "
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <Logo />

            {/* ── Glassmorphism Card ── */}
            {/* <div className="
                absolute
             
                left-3 sm:left-4 md:left-6 lg:left-8  2xl:left-12

              
                top-1/2 -translate-y-1/2
                landscape:top-[48%]
                md:landscape:top-1/2
                

                
                w-[55vw] sm:w-[48vw] md:w-[420px] lg:w-[460px] xl:w-[500px] 2xl:w-[560px]

              
                p-1 sm:p-4 md:p-6 lg:p-8 2xl:p-10

                rounded-2xl text-white overflow-hidden
                bg-blue-600/10 border border-white/20 backdrop-blur-sm shadow-2xl
                transition-all duration-500 ease-in-out
            "> */}

            {/* ── Glassmorphism Card ── */}
            <div className="
    absolute
    left-3 sm:left-4 md:left-6 lg:left-8 2xl:left-12

    /* mobile: vertically centered | md+: anchored from top */
    top-1/2 -translate-y-1/2
    lg:top-8 lg:translate-y-0
    lg:top-10
    xl:top-12
    2xl:top-16
    landscape:top-[43%]
    md:landscape:left-[2%]
    landscape:left-[10%]
    md:landscape:top-8 md:landscape:translate-y-0

    w-[55vw] landscape:w-[35vw]  md:landscape:w-[35vw]  sm:w-[48vw] md:w-[420px] lg:w-[460px] xl:w-[500px] 2xl:w-[560px]

    p-1 sm:p-2 md:p-6 lg:p-8 2xl:p-10

    rounded-2xl text-white overflow-hidden
    bg-blue-600/10 border border-white/20 backdrop-blur-sm shadow-2xl
    transition-all duration-500 ease-in-out
">

                {/* Header row */}
                <div className="flex items-center gap-3 sm:gap-4 mb-1 md:mb-3 md:mb-5">
                    <button
                        onClick={() => navigate("/project_details")}
                        aria-label="Go back"
                        className="
                            shrink-0
                            w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-12 lg:h-12
                            flex items-center justify-center
                            bg-white backdrop-blur-md border border-white/30
                            rounded-xl shadow-md
                            hover:bg-white/90 hover:scale-105 active:scale-95
                            transition-all duration-300
                        "
                    >
                        <img
                            src={backImg}
                            alt=""
                            className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6"
                        />
                    </button>

                    <h2 className="
                        font-bold leading-tight m-0
                        text-[11px] sm:text-lg md:text-2xl lg:text-3xl 2xl:text-4xl
                        [font-size:clamp(0.75rem,2.5vw,2.25rem)]
                    ">
                        Project Details
                    </h2>
                </div>

                {/* Body */}
                <div className="relative">
                    <p className="
                        leading-snug md:leading-relaxed m-0
                        [font-size:clamp(0.4rem,1vw,0.4rem)]
                                  md:[font-size:clamp(0.4rem,1.5vw,0.9rem)]
                    ">
                        Commerzone Baner shall be a premier Grade A commercial development
                        strategically located in the thriving business hub of Baner, (West) Pune.
                        {/* On very small screens, truncate the first paragraph */}
                        <span className="hidden sm:inline">
                            {' '}Positioned across key commercial markets, it offers seamless
                            connectivity and excellent access to major business districts,
                            residential zones, and social infrastructure.
                        </span>
                    </p>

                    {/* Expandable section */}
                    <div className={`
                        grid transition-all duration-500 ease-in-out
                        ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-0 md:mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}
                    `}>
                        <div className="overflow-hidden">
                            {/* On tiny screens only show the continuation of paragraph 1 */}
                            <p className="
                                leading-snug md:leading-relaxed mt-0 mb-0 md:mb-2
                                sm:hidden
                                [font-size:clamp(0.4rem,1vw,0.4rem)]
                                  md:[font-size:clamp(0.4rem,1.5vw,0.9rem)]
                                
                            ">
                                Positioned across key commercial markets, it offers seamless
                                connectivity and excellent access to major business districts,
                                residential zones, and social infrastructure.
                            </p>

                            <p className="
                                leading-snug md:leading-relaxed mb-0 md:mb-2
                                 [font-size:clamp(0.4rem,1vw,0.4rem)]
                                  md:[font-size:clamp(0.4rem,1.5vw,0.9rem)]
                            ">
                                Designed to cater to the needs of modern enterprises, the IT park
                                fosters a vibrant, community-driven ecosystem that supports
                                innovation, collaboration, and growth.
                            </p>

                            <p className="
                                leading-snug md:leading-relaxed mb-0
                                  [font-size:clamp(0.4rem,1vw,0.4rem)]
                                  md:[font-size:clamp(0.4rem,1.5vw,0.9rem)]
                            ">
                                Whether you&apos;re a multinational corporation or a dynamic
                                homegrown enterprise, Commerzone Baner offers a future-ready
                                workplace that aligns with the aspirations of &ldquo;new age
                                businesses&rdquo; making it a preferred destination in Pune.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Toggle button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="
                        mt-1 md:mt-5
                        px-3 py-1 sm:px-4 sm:py-1.5 md:px-5 md:py-2
                        flex items-center gap-1
                        rounded-2xl text-white
                        bg-gradient-to-br from-[#407BB6] to-[#76ACE2]
                        border border-white/20 shadow-md
                        hover:scale-105 active:scale-95
                        transition-all duration-300
                        [font-size:clamp(0.5rem,1.3vw,0.875rem)]
                        tracking-wide focus:outline-none focus:ring-0
                    "
                >
                    {isExpanded ? <><FaAngleUp /> Show Less</> : <>See More <FaAngleDown /></>}
                </button>
            </div>

            {/* Right button */}
            {/* <div className="absolute right-3 landscape:right-8 landscape:bottom-2 sm:right-4 bottom-14 md:bottom-6 lg:bottom-8">
                <RightButton />
            </div> */}

            {/* Bottom navbar */}
            <div className="
                absolute
                bottom-14 sm:bottom-3 md:bottom-3
                left-[30%] -translate-x-1/2
                landscape:left-[10%] landscape:translate-x-0
                md:landscape:left-1/2 md:landscape:-translate-x-1/2
            ">
                <BottomNavbar />
            </div>
        </div>
    );
}