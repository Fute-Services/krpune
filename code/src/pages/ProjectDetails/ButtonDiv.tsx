// import { useNavigate, useLocation } from 'react-router-dom';

// export default function ButtonDiv() {
//     const navigate = useNavigate();
//     const location = useLocation();

//     // Determine active state based on the current URL path
//     const activePlan = location.pathname.includes('mobility') ? 'mobility' : 
//                        location.pathname.includes('vertical-transport') ? 'vertical' : 'floor';

//     const getButtonStyle = (plan: 'floor' | 'mobility' | 'vertical') => {
//         const isActive = activePlan === plan;
//         const baseStyle = "w-[90%] h-[45%] hover:w-[95%] transition-all duration-500 ease-in-out rounded-tl-[25px] rounded-tr-md rounded-bl-md rounded-br-[25px] font-semibold text-sm tracking-wide border flex items-center justify-center cursor-pointer";
        
//         if (isActive) {
//             // Active State: Solid Blue Gradient
//             return `${baseStyle} bg-gradient-to-r from-[#105CA8] to-[#062442] shadow-lg border-white/20 text-white`;
//         }
        
//         // Inactive State: Semi-transparent
//         return `${baseStyle} bg-gradient-to-r from-[#3A7CA5]/40 to-[#3A7BD5]/40 border-white/40 text-white hover:bg-white/20 backdrop-blur-md`;
//     };

//     return (
//         <div className=" rounded-[40px] 
//            border 
//             lg:w-[200px] lg:h-[190px] md:w-[180px] md:h-[180px]  w-[180px] h-[100px] items-center"
//             style={{
//                 display: "flex", 
//                 color: "white", 
//                 gap: "5px",
//                 flexDirection: "column", padding: "15px",
//                 // backdropFilter: 'blur(12px)',
//                 WebkitBackdropFilter: 'blur(12px)',
//                 border: "1px solid rgba(9, 75, 137, 0.89)",
//             }}>

//             <button 
//                 className={getButtonStyle('floor')}
//                 onClick={() => navigate('/project_details')}
//             >
//                 Floor Plan
//             </button>

//             <button 
//                 className={getButtonStyle('mobility')}
//                 onClick={() => navigate('/mobility')}
//             >
//                 Mobility
//             </button>

//             <button 
//                 className={getButtonStyle('vertical')}
//                 onClick={() => navigate('/vertical-transport')}
//             >
//                 Vertical Transport
//             </button>
//         </div>
//     );
// }

import { useNavigate, useLocation } from 'react-router-dom';

export default function ButtonDiv() {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active state based on the current URL path
    const activePlan = location.pathname.includes('mobility') ? 'mobility' : 
                       location.pathname.includes('vertical-transport') ? 'vertical' : 
                       location.pathname.includes('fitout-plan') ? 'fitout' : 
                       location.pathname.includes('circulation-plan') ? 'circulation' : 'floor';

    const getButtonStyle = (plan: 'floor' | 'mobility' | 'vertical' | 'fitout' | 'circulation') => {
        const isActive = activePlan === plan;
        const baseStyle = "w-[80%] h-[22%] hover:w-[95%] transition-all duration-500 ease-in-out rounded-tl-[25px] rounded-tr-md rounded-bl-md rounded-br-[25px] font-semibold text-[9px] lg:text-[12px] tracking-wide border flex items-center justify-center cursor-pointer";
        
        if (isActive) {
            // Active State: Solid Blue Gradient
            return `${baseStyle} bg-gradient-to-r from-[#105CA8] to-[#062442] shadow-lg border-white/20 text-white`;
        }
        
        // Inactive State: Semi-transparent
        return `${baseStyle} bg-gradient-to-r from-[#3A7CA5]/40 to-[#3A7BD5]/40 border-white/40 text-white hover:bg-white/20 backdrop-blur-md`;
    };

    return (
        <div 
            className="rounded-[40px] border flex flex-col items-center gap-[5px] p-[11px] 
                       lg:w-[200px] lg:h-[260px] md:w-[180px] md:h-[240px] w-[140px] h-[160px]"
            style={{
                color: "white", 
                WebkitBackdropFilter: 'blur(12px)',
                border: "1px solid rgba(9, 75, 137, 0.89)",
            }}
        >
            <button 
                className={getButtonStyle('floor')}
                onClick={() => navigate('/project_details')}
            >
                Floor Plan
            </button>

            <button 
                className={getButtonStyle('mobility')}
                onClick={() => navigate('/mobility')}
            >
                Mobility
            </button>

            <button 
                className={getButtonStyle('vertical')}
                onClick={() => navigate('/vertical-transport')}
            >
                Vertical Transport
            </button>

             <button 
                className={getButtonStyle('circulation')}
                onClick={() => navigate('/circulation-plan')}
            >
                Circulation 
            </button>

        </div>
    );
}