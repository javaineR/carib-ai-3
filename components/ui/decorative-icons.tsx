import React from "react";

// Planets
export const MercuryIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.4),transparent)]"></div>
  </div>
);

export const VenusIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-gradient-to-br from-yellow-600 to-amber-800 shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.3),transparent)]"></div>
  </div>
);

export const EarthIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-gradient-to-br from-blue-500 to-green-500 shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.4),transparent)]"></div>
  </div>
);

export const MarsIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-gradient-to-br from-red-500 to-red-800 shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.3),transparent)]"></div>
  </div>
);

export const JupiterIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="w-full h-1/3 absolute top-1/3 bg-amber-700/40 rounded-full"></div>
    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.3),transparent)]"></div>
  </div>
);

export const SaturnIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-gradient-to-br from-yellow-200 to-yellow-600 shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute w-[120%] h-[20%] bg-yellow-400/70 rounded-full transform -rotate-12 top-[40%]"></div>
    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.3),transparent)]"></div>
  </div>
);

export const UranusIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-gradient-to-br from-cyan-300 to-cyan-600 shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.4),transparent)]"></div>
  </div>
);

export const NeptuneIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.3),transparent)]"></div>
  </div>
);

export const PlutoIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.3),transparent)]"></div>
  </div>
);

// Sports Balls
export const BasketballIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-orange-500 shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute w-full h-[2px] bg-black top-1/2 transform -translate-y-1/2"></div>
    <div className="absolute h-full w-[2px] bg-black left-1/2 transform -translate-x-1/2"></div>
    <div className="absolute w-[70%] h-[70%] border-2 border-black rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
  </div>
);

export const SoccerBallIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-white shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute w-2/3 h-2/3 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="absolute w-1 h-1 bg-black rounded-full top-0 left-1/2 transform -translate-x-1/2"></div>
      <div className="absolute w-1 h-1 bg-black rounded-full bottom-0 left-1/2 transform -translate-x-1/2"></div>
      <div className="absolute w-1 h-1 bg-black rounded-full left-0 top-1/2 transform -translate-y-1/2"></div>
      <div className="absolute w-1 h-1 bg-black rounded-full right-0 top-1/2 transform -translate-y-1/2"></div>
      <div className="absolute w-1 h-1 bg-black rounded-full top-1/4 left-1/4"></div>
      <div className="absolute w-1 h-1 bg-black rounded-full bottom-1/4 right-1/4"></div>
    </div>
  </div>
);

export const TennisBallIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-yellow-300 shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute w-full h-1/3 border-t border-b border-white/70 top-1/3"></div>
    <div className="absolute h-full w-1/3 border-l border-r border-white/70 left-1/3"></div>
  </div>
);

export const BaseballIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <div className={`${className} relative rounded-full bg-white shadow-inner flex items-center justify-center hover:scale-110 transition-transform duration-300`}>
    <div className="absolute w-full h-[2px] bg-red-500 top-1/2 transform -translate-y-1/2"></div>
    <div className="absolute h-full w-[2px] bg-red-500 left-1/2 transform -translate-x-1/2"></div>
  </div>
);

// Floating Icon interface
interface FloatingIconProps {
  icon: React.FC<{ className?: string }>;
  delay?: number;
  size?: string;
  position: string;
  zIndex?: string;
}

// Animated Floating Component
export const FloatingIcon = ({ icon: Icon, delay = 0, size = "h-6 w-6", position, zIndex = "z-10" }: FloatingIconProps) => {
  return (
    <div 
      className={`absolute ${position} ${zIndex} animate-float`}
      style={{ animationDelay: `${delay}s` }}
    >
      <Icon className={size} />
    </div>
  );
};

// Random animated planet and ball decorations
export const DecorativeElements = () => {
  const icons = [
    { icon: MercuryIcon, position: "top-10 left-10", delay: 0, size: "h-4 w-4" },
    { icon: VenusIcon, position: "top-20 right-20", delay: 1.5, size: "h-5 w-5" },
    { icon: EarthIcon, position: "bottom-10 left-1/4", delay: 3, size: "h-6 w-6" },
    { icon: MarsIcon, position: "top-1/4 right-10", delay: 2, size: "h-4 w-4" },
    { icon: JupiterIcon, position: "bottom-20 right-40", delay: 0.5, size: "h-8 w-8" },
    { icon: SaturnIcon, position: "top-32 left-1/3", delay: 2.5, size: "h-7 w-7" },
    { icon: BasketballIcon, position: "bottom-14 right-14", delay: 1, size: "h-5 w-5" },
    { icon: SoccerBallIcon, position: "top-10 right-1/3", delay: 3.5, size: "h-5 w-5" },
    { icon: TennisBallIcon, position: "bottom-1/3 left-10", delay: 2.2, size: "h-4 w-4" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((props, index) => (
        <FloatingIcon key={index} {...props} />
      ))}
    </div>
  );
}; 