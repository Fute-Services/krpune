import backImg from '../../assets/back.png';
interface AboutUsProps {
  handleClose: () => void;
  handleOpen: () => void;
}
import { useState } from 'react';
import ButtonDiv from '@/components/ButtonDiv';
import brochurePdf from '../../assets/broucher/KRC.pdf';
export default function AboutUs({ handleClose, handleOpen }: AboutUsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const previewHeight = 'max-h-[8rem]';
  const fullHeight = 'max-h-screen';

  return (
    <div className="h-screen w-screen relative justify-center p-8">

      {/* Card */}
      <div className="
        w-[80%]  
        md:w-[55%] md:p-8
        lg:w-[55%] lg:p-10 lg:mt-[2%]
        xl:w-[35%] xl:p-12 
        2xl:w-[40%] 2xl:p-14
        flex flex-col p-12 text-white
        bg-black/20  border border-white/30 rounded-3xl
        shadow-[0_20px_60px_rgba(0,0,0,0.4)]
        h-fit max-h-screen overflow-y-auto  backdrop-blur-[16.050000190734863px]
        
      ">

        {/* Header */}
        <div className="flex items-center 
        justify-between mb-12 md:mb-8 lg:mb-10 xl:mb-12">
          <button
            className="
              absolute
              top-3.5 left-3.5
              sm:top-5 sm:left-5
              md:top-[40px] md:left-[40px]
              lg:top-[50px] lg:left-[24px]
              xl:top-[80px] xl:left-[50px]
              2xl:top-[55px] 2xl:left-[55px]
              w-[38px] h-[38px]
              sm:w-11 sm:h-11
              bg-white
              lg:w-[44px] lg:h-[44px]
              xl:w-[50px] xl:h-[50px]
rounded-[30%]  backdrop-blur-[8  .050000190734863px] border border-white/20
              flex items-center justify-center z-20 cursor-pointer
              shadow-[0_4px_12px_rgba(0,0,0,0.15)]
            "
            onClick={handleClose}
          >
            <img
              src={backImg} alt="Back"
              className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6"
            />
          </button>

          <h2 className="
            text-4xl
            md:text-3xl
            lg:text-4xl
            xl:text-5xl
            2xl:text-5xl
            font-bold text-white
            bg-clip-text text-transparent tracking-tight
          ">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            Project overview
          </h2>
        </div>

        {/* Content */}
        <div className={`
          space-y-8 md:space-y-5 lg:space-y-6 xl:space-y-8
          text-lg md:text-sm lg:text-base xl:text-lg 2xl:text-[1rem]
          leading-relaxed text-white/90 font-light mb-4
          transition-all duration-500 ease-in-out overflow-hidden
          ${isExpanded ? 'max-h-none' : previewHeight}
        `}>
          <p>Commerzone Baner shall be a premier Grade A commercial development strategically
            located in the thriving business hub of Baner, (West)Pune. Positioned across key
            commercial markets, it offers seamless connectivity and excellent access to major
            business districts, residential zones, and social infrastructure.</p>
          <p>Designed to cater to the needs of modern enterprises, the IT park fosters a vibrant,
            community-driven ecosystem that supports innovation, collaboration, and growth.</p>
          <p>Whether you're a multinational corporation or a dynamic homegrown enterprise,
            Commerzone Baner a future-ready workplace that aligns with the aspirations of
            "new age businesses" making it a preferred destination in Pune</p>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleExpanded}
          className="
  self-start
  mt-0

  w-fit px-5
  whitespace-nowrap

  bg-[linear-gradient(164deg,rgba(200,243,255,0.54)_11.01%,rgba(128,149,255,0.54)_95.38%)]

  flex items-center justify-center gap-2
  transition-all duration-300

  rounded-[25px]
  h-[45px]

  border border-white/30
  shadow-xl
  backdrop-blur-[8.050000190734863px]

  cursor-pointer
  text-white text-sm font-medium
"
        >
          {isExpanded ? 'See Less' : 'See More'}

          <svg
            className={`w-5 h-5 md:w-4 md:h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Bottom */}



      </div>


      <div className='absolute right-1 md:right-10 flex flex-col gap-1 bottom-1 md:bottom-10'>

        <ButtonDiv onClick={() => window.open(brochurePdf, '_blank')}>
          {/* <a
            href={brochurePdf}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-full h-full"
          > */}
            Corporate Profile 
            {/* </a> */}
          </ButtonDiv>
        <ButtonDiv>Walkthrough</ButtonDiv>
        <ButtonDiv>Gallery</ButtonDiv>


      </div>
    </div>
  );
}