import React from "react";
import { cn } from "@/lib/utils";

interface BarcodeSparklineProps {
  className?: string;
  variant?: "primary" | "orange" | "purple" | "emerald" | "muted";
  count?: number;
}

export const BarcodeSparkline: React.FC<BarcodeSparklineProps> = ({
  className,
  variant = "muted",
  count = 28,
}) => {
  // Pre-calculated heights for a realistic audio-wave/barcode rhythm
  const heights = [
    60, 85, 100, 75, 45, 90, 100, 80, 55, 95,
    100, 70, 40, 65, 85, 100, 90, 60, 45, 80,
    95, 100, 75, 50, 85, 95, 70, 40, 60, 80,
  ];

  const getColor = () => {
    switch (variant) {
      case "orange":
        return "bg-[#ff7a00]";
      case "purple":
        return "bg-[#6366f1]";
      case "emerald":
        return "bg-[#10b981]";
      case "primary":
        return "bg-[#18191c]";
      default:
        return "bg-[#a8a7a0]";
    }
  };

  return (
    <div className={cn("flex items-end gap-[1.5px] h-5 overflow-hidden", className)}>
      {Array.from({ length: count }).map((_, i) => {
        const heightPct = heights[i % heights.length];
        const isDense = i % 2 === 0;
        return (
          <span
            key={i}
            className={cn(
              "w-[1.5px] rounded-full transition-all duration-300",
              getColor(),
              isDense ? "opacity-90" : "opacity-40"
            )}
            style={{
              height: `${heightPct}%`,
              animation: `equalizer-pulse ${1.2 + (i % 5) * 0.2}s ease-in-out infinite ${(i % 7) * 0.15}s`,
            }}
          />
        );
      })}
    </div>
  );
};
