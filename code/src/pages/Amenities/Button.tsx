import React from "react";

type GlassButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "light";
};

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  className = "",
  variant = "primary",
}) => {
  const variants = {
    primary: "from-[#082e54] via-[#09406a] to-[#0b4279]",
    light: "from-[#407bb6] to-[rgb(84,142,198)]",
  };

  return (
    <button
      onClick={onClick}
      className={`
       px-2 py-2 md:px-1 md:py-4 lg:w-[14%] lg:h-[8%]
        text-white text-[9px] md:text-[10px] lg:text-[14px] font-medium tracking-wide

        bg-gradient-to-tr ${variants[variant]}

        rounded-tl-[28px]
        rounded-bl-[10px]
        rounded-br-[28px]
        rounded-tr-[10px]

        border border-white/80
        shadow-[0_10px_30px_rgba(0,0,0,0.4)]

        backdrop-blur-md

        transition-all duration-300 ease-in-out

        hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)]
        hover:border-white/60
        hover:brightness-110

        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default GlassButton;