import React from "react";
import { IoTMeshLogo } from "@/components/IoTMeshLogo";

export interface MeshLoadingScreenProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function MeshLoadingScreen({
  className = "",
  size = "md",
}: MeshLoadingScreenProps) {
  const sizeClasses = {
    sm: "h-12 w-auto",
    md: "h-18 w-auto sm:h-22",
    lg: "h-24 w-auto sm:h-28",
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center bg-[#edece8] text-[#18191c] px-4 selection:bg-[#18191c] selection:text-white ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {/* Pure Kinetic Mesh Animation: Only dynamic lines and moving holes */}
      <div className="relative flex items-center justify-center">
        <IoTMeshLogo
          className={`${sizeClasses[size]} text-[#18191c] drop-shadow-sm transition-all duration-300`}
          speed={1.25}
          amplitude={1.35}
        />
      </div>
    </div>
  );
}

export default MeshLoadingScreen;
