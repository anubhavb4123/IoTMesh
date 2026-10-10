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
      className={`fixed inset-0 z-50 min-h-[100dvh] min-h-screen w-full flex items-center justify-center bg-black text-white px-4 selection:bg-white selection:text-black [color-scheme:dark] ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {/* Pure Kinetic Mesh Animation: Only dynamic lines and moving holes */}
      <div className="relative flex items-center justify-center">
        <IoTMeshLogo
          className={`${sizeClasses[size]} text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.18)] transition-all duration-300`}
          strokeColor="#ffffff"
          speed={1.25}
          amplitude={1.35}
        />
      </div>
    </div>
  );
}

export default MeshLoadingScreen;
