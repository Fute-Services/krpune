import circle from '../../assets/Overviewnew/suscircle.png';
import building from '../../assets/Overviewnew/conceptsummarybuilding.png';
import bgImage from '../../assets/Overviewnew/Concept summarynew.png'
import Logo from './Logo';
import BackButton from './BackButton';
import RightButton from './RightButton';


const animationStyles = `
  /* Original Slide Up */
  @keyframes slideUpDrawer {
    0% { transform: translateY(90px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  /* New Slide From Left */
  @keyframes slideInLeft {
    0% { transform: translateX(-100px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

@keyframes slideAndDim {
    0% { 
      transform: translateY(100vh) translateX(-40px); 
      opacity: 0.6; 
      z-index: 100;
    }
    /* At 70% of the time, it's nearly home and still fully bright */
    70% {
      opacity: 0.6;
    }

    80% {
      opacity: 0.9;
    }
    100% { 
      transform: translateY(0) translateX(0); 
      opacity: 1; /* Settles at 40% opacity */
      z-index: 0;
    }
  }

  .animate-drawer-up {
    animation: slideAndDim 1.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    position: absolute;
    
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



 @keyframes slideDownStraight {
    0% { 
      /* Negative Y starts it above its final position */
      /* Removed translateX to keep it perfectly straight */
      transform: translateY(-60px); 
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
    animation: slideDownStraight 2.5s cubic-bezier(0.18, 1, 0.3, 1) forwards;
    position: absolute;
    z-index: 50;
  }
`;

// Mock data based on your image
const conceptData = [
    { id: 1, title: "Superstructure", para: "The building is designed on graded land with roughly 8m gradient west to east. It houses 8 levels of parking, an amenity floor and Ist to 17th floors of offices with terrace above having mechanical areas, elevator access for roof top recreational areas." },

    { id: 2, title: "Tenant Office ", para: "Tenant offices are located in Ist to 17th floor in both the towers T1 as well as T2." },

    { id: 3, title: "Refuge Area", para: "Refuge areas are designed on 1st, 5th, 9th and 13th level, in compliance with Indian national code. Refuge areas are accessible from the road on South side." },
    {
        id: 4, title: " Office Lobbies",
        para: "A public entrance hall is designed on Lower Ground level for Tl and Upper Ground floor for T2 accessible through drop off designed on South side of the site. Each tower has its own separate lobby. ",
    },
    {
        id: 5, title: "Amenities ",
        para: "A 40000 sf. foodcourt is design opening to a large well landscaped open to sky podium garden. ",

    },
    { id: 6, title: "Food & Beverage, Retail", para: "F&B and Retail area is located on East side under T1 at Lower Ground and on South West at Upper Ground under T2.", },

    { id: 7, title: " Parking", para: "8 parking levels starting from Lower Ground to the 6th parking podium which is design primarily as mechanical parking level." },
]

export default function ConceptSummary() {
    return (
        <>
            <style>{animationStyles}</style>

            <div className='w-screen h-screen overflow-hidden 
        relative bg-cover bg-center'
                style={{ backgroundImage: `url(${bgImage})` }}
            >


                <Logo />
                <div className='absolute top-14 left-5 z-50'>
                    <BackButton to="/overview"/>
                </div>

                {/* Decorative Circle */}


                {/* Building Image */}
                <div className='absolute bottom-0 left-0  w-[73%] h-screen'>
                    <img src={circle} className='animate-drawer-up absolute w-[220px] 
           left-2 top-[24%] md:left-10 md:top-[23%] lg:left-28 lg:top-16 2xl:top-24 2xl:left-32' alt="" />
                    <img src={building} className='animate-drawer-up
              object-cover absolute z-10 -left-20 h-full w-full -bottom-[15%]' alt="" /></div>

                <div className='absolute  top-6 md:top-5 lg:-top-5 2xl:top-0
                 left-[32%] md:left-[34%] lg:left-[41%] 2xl:left-[42%]'>
                    <h1 className="text-xl md:text-[33px] font-bold leading-tight
                 bg-gradient-to-r from-sky-50 via-white/80 to-blue-400 
                 bg-clip-text text-transparent">Superstructure</h1>
                </div>
                {/* NEW: Content Side Drawer (Right Side) */}
                <div className=" absolute top-28 animate-drawer-up 
                left-[60%] md:top-36 lg:top-[18%] md:left-[62%]
                 lg:left-1/2 2xl:left-[52%] z-20 
                w-[38%]  h-[62vh] md:h-[64vh] lg:h-[80vh]
             overflow-y-auto pr-4 text-white">


                    <div className="space-y-1 2xl:space-y-5">
                        {conceptData.map((item, index) => (
                            <div key={index}
                            //  className="animate-content" 
                            //  style={{ animationDelay: `${0.5 + (index * 0.2)}s` }}
                            >
                                <h2 className="text-[12px] md:text-[16px] md:font-semibold mb-1">{item.title}</h2>
                                <p className="text-[9px] md:text-sm leading-wide opacity-90">{item.para}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* <div className='bottom-0 right-2 absolute animate-right-drawer'>
                    <RightButton />
                </div> */}
            </div>
        </>);
}