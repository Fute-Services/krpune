interface ButtonProps {
    children: React.ReactNode; // more flexible than string
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

const GradientButton: React.FC<ButtonProps> = ({
    children,
      onClick,
    className = "",
    disabled = false,
}) => {
    return (
        <button
              onClick={onClick}
            disabled={disabled}
            className={`
        self-start mt-0
        w-full px-5 whitespace-nowrap


        bg-[linear-gradient(164deg,rgba(70,138,156,0.54)_11.01%,rgba(64,79,155,0.54)95.38%)]

        hover:bg-[linear-gradient(164deg,rgba(39,88,101,0.54)_11.01%,rgba(45,59,130,0.54)95.38%)]

        flex items-center justify-center gap-2
        transition-all duration-300

        rounded-[25px]
        h-[45px]

        border border-white/30
        shadow-xl
        backdrop-blur-[8.05px]

        cursor-pointer
        text-white text-sm font-medium

        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
        >
            {children}
        </button>
    );
};

export default GradientButton;