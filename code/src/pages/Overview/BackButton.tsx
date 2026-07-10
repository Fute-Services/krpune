import { useNavigate } from "react-router-dom";
import backImg from '../../assets/back.png';

interface BackButtonProps {
    /** * Optional path to navigate to. 
     * If not provided, the button defaults to navigate(-1) 
     */
    to?: string;
}

export default function BackButton({ to }: BackButtonProps) {
    const navigate = useNavigate();

    const handleClick = (e:any) => {
        // Stop the click from bubbling up if it's inside another clickable div
        e.stopPropagation(); 
        
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <button
            onClick={handleClick}
            className="
                w-[40px] h-[40px]
                sm:w-11 sm:h-11
                lg:w-[52px] lg:h-[52px]
                flex items-center justify-center
                bg-white backdrop-blur-md
                border border-white/30
                rounded-xl
                shadow-[0_6px_20px_rgba(0,0,0,0.25)]
                hover:bg-white/90 hover:scale-105
                transition-all duration-300
            "
        >
            <img
                src={backImg}
                alt="Back"
                className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] lg:w-6 lg:h-6"
            />
        </button>
    );
}