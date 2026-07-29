import bgImage from '../../assets/Overviewnew/Sustainability.png'
import circle from '../../assets/Overviewnew/suscircle.png';
import building from '../../assets/Overviewnew/sustainabilitybuilding.png';
import tree from '../../assets/Overviewnew/sustree.png'
import BackButton from './BackButton';
import Logo from './Logo';
import RightButton from './RightButton';


const animationStyles = `
  /* Original Slide Up */
  @keyframes slideUpDrawer {
    0% { transform: translateY(700px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  /* New Slide From Left */
  @keyframes slideInLeft {
    0% { transform: translateX(-100px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

  .animate-drawer-up {
    animation: slideUpDrawer 0.9s cubic-bezier(0.16, 1, 0.36, 1) forwards;
  }

  .animate-drawer-left {
    animation: slideInLeft 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .delay-200 {
    animation-delay: 200ms;
  }
  
  .delay-400 {
    animation-delay: 400ms;
  }



  @keyframes slideCrossed {
    0% { 
      transform: translate(50px, 100px) rotate(3deg); 
      opacity: 0; 
      filter: blur(10px);
    }
    100% { 
      transform: translate(0, 0) rotate(0deg); 
      opacity: 1; 
      filter: blur(0px);
    }
  }

  .animate-crossed {
    /* Increased duration to 1.2s and used a smoother 'out' curve */
    animation: slideCrossed 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .delay-200 { animation-delay: 200ms; }
  .delay-400 { animation-delay: 400ms; }


  
  @keyframes slideRightToLeft {
    0% { 
      /* Starts off-screen to the right (100vw) and below the screen (100vh) */
       transform: translateX(100px) rotate(-1deg); 
      opacity: 0.4; 
    }
    70% {
      /* Becomes fully visible during the middle of the flight */
      opacity: 1;
    }
    100% { 
      /* Settles at its original position with 40% opacity */
      transform: translate(0, 0) rotate(0deg); 
      opacity: 1; 
    }
  }

  .animate-right-drawer {
    /* 1.5s gives it that slow, cinematic 'Archywave' feel */
    animation: slideRightToLeft 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }


@keyframes slideCrossed1 {
   0% { 
      /* Start further to the LEFT (-200px) and BELOW (700px) */
      /* A negative rotation (-5deg) makes the leading edge point toward the destination */
      transform: translate(150px, 900px) rotate(-1deg); 
      opacity: 0; 
    }
    60% {
      /* Fades in fully about halfway through the path */
      opacity: 1;
    }
    100% { 
      /* Land perfectly straight at the original position */
      transform: translate(0, 0) rotate(0deg); 
      opacity: 1; 
    }
  }

  .animate-crossed-right {
    /* 1.2s gives it a premium, smooth feel */
    animation: slideCrossed1 1.5s cubic-bezier(0.5, 1, 0.3, 1) forwards;
    position: absolute;
  }




@keyframes slideCrossed2 {
    0% { 
      /* Start from Right (200px) and Bottom (100px) */
      /* Added a -3deg tilt to make the "cross" look more dynamic */
      transform: translate(100px, 400px) rotate(-8deg); 
      opacity: 0; 
    }
    60% {
      /* Fades in fully about halfway through the path */
      opacity: 1;
    }
    100% { 
      /* Land perfectly straight at the original position */
      transform: translate(0, 0) rotate(0deg); 
      opacity: 1; 
    }
  }

  .animate-crossed-right1 {
    /* 1.2s gives it a premium, smooth feel */
    animation: slideCrossed2 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    position: absolute;
  }





   @keyframes slideDownStraight {
    0% { 
      /* Negative Y starts it above its final position */
      /* Removed translateX to keep it perfectly straight */
      transform: translateY(-50px); 
      opacity: 0; 
    }
    20% {
      /* Becomes visible early in the drop */
      opacity: 1;
    }
    100% { 
      /* Lands exactly at its CSS-defined position */
      transform: translateY(0); 
      opacity: 1; 
    }
  }

  .animate-drawer-down {
    /* 1.5s duration as requested for that smooth, premium feel */
    animation: slideDownStraight 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    position: absolute;
   
  }
`;

export default function Sustainability() {


    const data = [
        {
            id: 1, title: " Water Conservation", para: [
                'Recycling & Reuse of water. ',
                'Storage, Recharge & Use of Rainwater. ',
                'Low Flow water efficient fixtures.',

            ]
        },
        {
            id: 2, title: " Energy Conservation", para: [
                'LED High efficiency light fixtures in common areas.',
                'Energy efficient motors for mechanical equipment. ',
                'High COP chillers.',
                'Use of Low Global Warming Potential (LGWP) refrigent.',
                'Variable Frequency Drive on motors.',


            ]
        },
        {
            id: 3, title: " Other Initiatives", para: [
                'High efficiency double glazed envelope.',
                'Installation of Energy recovery systems. ',
                'Below grade parking with Co sensors.',



            ]
        },

    ]
    return (
    <>
        <style>{animationStyles}</style>

        <section
            className='relative w-full h-screen overflow-hidden bg-cover bg-center'
            style={{ backgroundImage: `url(${bgImage})` }}
        >

            <Logo />
            <div className='absolute top-16 left-10 z-50'>
                <BackButton to="/overview" />
            </div>
            
            {/* Background Decorative Circle */}
            <img
                src={circle}
                alt=""
                className='absolute animate-drawer-up left-5 bottom-48 md:bottom-5 lg:bottom-0  w-[100px] md:w-[240px]'
            />

            {/* Building - Layered over the circle */}
            {/* FIX: Added object-contain and object-left-bottom to prevent stretching */}
            <img
                src={building}
                alt="Sustainable Building"
                className='absolute left-5 animate-drawer-up 
                bottom-48 md:bottom-5 lg:bottom-0 z-10 md:h-full h-[50%] md:h-[77%] w-[75%]
                 md:w-[85%] lg:w-[80%] xl:h-full object-contain object-left-bottom'
            />

            {/* Tree - Positioned to the right */}
            {/* FIX: Added object-contain and object-left-bottom just to be safe here as well */}
            <img
    src={tree}
    alt="Growth"
    className='absolute animate-drawer-up left-[58%] bottom-48 md:bottom-10 lg:bottom-16 h-[45%] md:h-[68%] object-contain object-left-bottom'
/>
            {/* Content Overlay */}
            <div className="absolute 
                /* Positioning */
                top-[26%] md:top-[20%] left-[54%]
                laptop:top-[50%] laptop-[54%]
                 xl:top-[11%] xl:left-[52%] 
                2xl:top-[16%] 2xl:left-[52%] 
                /* The Magic: Move it to the right based on its own width */
                translate-x-[20%] 
                
                /* Layout */
                flex flex-col h-fit 
                w-full max-w-[40%]    /* Mobile first: nearly full width */
                md:max-w-[40%]       /* Desktop: narrow column */
                
                /* Styling */
                text-white z-20
                transition-all duration-500">
               <h1 className="animate-drawer-up text-lg md:text-2xl lg:text-[33px] font-semibold md:font-bold mb-5 leading-tight
    bg-gradient-to-r from-sky-50 via-white/80 to-blue-400 bg-clip-text text-transparent
    lg:mt-2">
    Sustainability Initiatives
</h1>

                <div className="space-y-2 md:space-y-5 lg:space-y-1 2xl:space-y-7">
                    {data.map((item, index) => (
                        <div key={index} className="group">
                            <h2 className=" text-[12px] md:text-lg xl:text-xl font-semibold ">
                                {item.title}
                            </h2>
                            <div className="mb-0 md:mb-1 2xl:mb-4 opacity-90">
                                {item.para.map((text, pIndex) => (
                                    <p key={pIndex} className=" text-[9px] md:text-[13px] lg:text-sm leading-tight md:leading-relaxed">
                                        {text}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* <div className='bottom-0 z-50 right-2 lg:bottom-2 2xl:bottom-2 absolute animate-right-drawer'>
                <RightButton />
            </div> */}
        </section> 
    </>
)
}