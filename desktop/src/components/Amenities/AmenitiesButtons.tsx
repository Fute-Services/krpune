import { useNavigate } from 'react-router-dom';

export default function ButtonDiv() {
    const navigate = useNavigate();

    return (
        <div className="rounded-[20px] backdrop-blur-xl bg-white/10 border shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] lg:w-[220px] lg:h-[290px] md:w-[160px] md:h-[210px] w-[140px] h-[180px] items-center"
            style={{
                display: "flex", color: "white", gap: "10px", 
                flexDirection: "column", padding: "10px",
                marginLeft:"50px",
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: "1px solid rgba(255, 255, 255, 0.5)",
            }}>

            {/* Terrace Level Button */}
            <button className="w-[90%] hover:w-[95%] h-[22%] lg:h-[25%] rounded-tl-[25px] rounded-tr-md rounded-bl-md rounded-br-[25px] bg-gradient-to-r from-[#3A7CA5]/40 to-[#3A7BD5]/40 border border-blue-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/40 font-semibold hover:bg-white/20 transition-all duration-500 ease-in-out text-[10px] md:text-[10px] lg:text-sm tracking-wide shadow-inner flex items-center justify-center text-white"
                onClick={() => navigate('/terrace-level')}
            >
                Terrace Level
            </button>

            {/* Podium Level Button */}
            <button className="w-[90%] hover:w-[95%] h-[22%] lg:h-[25%] rounded-tl-[25px] rounded-tr-md rounded-bl-md rounded-br-[25px] bg-gradient-to-r from-[#3A7CA5]/40 to-[#3A7BD5]/40 border border-blue-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/40 font-semibold hover:bg-white/20 transition-all duration-500 ease-in-out text-[10px] md:text-[10px] lg:text-sm tracking-wide shadow-inner flex items-center justify-center text-white"
                style={{ backgroundColor: 'transparent', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.4)', cursor: 'pointer' }}
                onClick={() => navigate('/podium-level')}
            >
                Podium Level
            </button>

           

            {/* Lobby Reception Button */}
            <button className="w-[90%] hover:w-[95%] h-[22%] lg:h-[25%] rounded-tl-[25px] rounded-tr-md rounded-bl-md rounded-br-[25px] bg-gradient-to-r from-[#3A7CA5]/40 to-[#3A7BD5]/40 border border-blue-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/40 font-semibold hover:bg-white/20 transition-all duration-500 ease-in-out text-[10px] md:text-[10px] lg:text-sm tracking-wide shadow-inner flex items-center justify-center text-white"
                style={{ backgroundColor: 'transparent', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.4)', cursor: 'pointer' }}
                onClick={() => navigate('/lobby-reception')}
            >
                Lobby Reception
            </button>

             {/* Ground Level Button */}
            <button className="w-[90%] hover:w-[95%] h-[22%] lg:h-[25%] rounded-tl-[25px] rounded-tr-md rounded-bl-md rounded-br-[25px] bg-gradient-to-r from-[#3A7CA5]/40 to-[#3A7BD5]/40 border border-blue-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/40 font-semibold hover:bg-white/20 transition-all duration-500 ease-in-out text-[10px] md:text-[10px] lg:text-sm tracking-wide shadow-inner flex items-center justify-center text-white"
                style={{ backgroundColor: 'transparent', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.4)', cursor: 'pointer' }}
                onClick={() => navigate('/ground-level')}
            >
                Ground Level
            </button>

        </div>
    );
}