import { useNavigate } from 'react-router-dom';
import backImg from '../../assets/back.png';

export default function Construction() {
    const navigate = useNavigate();
    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black">

            {/* Fullscreen video (drop file at public/media/videos/construction.mp4) */}
            <video
                src={`${import.meta.env.BASE_URL}media/videos/construction.mp4`}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
            />

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="
                    absolute left-6 top-6 z-50
                    w-[40px] h-[40px] sm:w-11 sm:h-11 lg:w-[52px] lg:h-[52px]
                    flex items-center justify-center
                    bg-white/90 backdrop-blur-md border border-white/30
                    rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.25)]
                    hover:bg-white hover:scale-105 active:scale-95
                    transition-all duration-300
                "
            >
                <img
                    src={backImg}
                    alt="Back"
                    className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] lg:w-6 lg:h-6"
                />
            </button>
        </div>
    );
}
