import React from "react";

interface BrandedVehicleImageProps {
  src: string;
  alt: string;
  className?: string;
}

const BrandedVehicleImage: React.FC<BrandedVehicleImageProps> = ({ 
  src, 
  alt, 
  className = "" 
}) => {
  return (
    <div className={`relative ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
      />
      {/* MOOVY Branding Overlay - Fixed position, never changes */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md">
        {/* M Logo - Turquoise */}
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 100 100" 
          className="flex-shrink-0"
        >
          <path
            d="M15 85 C15 85, 15 35, 35 25 C45 20, 50 30, 50 45 C50 30, 55 20, 65 25 C85 35, 85 85, 85 85"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* MOOVY Text - Gray */}
        <span 
          className="text-sm font-bold tracking-wide"
          style={{ color: '#6b7280' }}
        >
          MOOVY
        </span>
      </div>
    </div>
  );
};

export default BrandedVehicleImage;
