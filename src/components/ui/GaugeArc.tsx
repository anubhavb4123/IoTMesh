import React from "react";
import { cn } from "@/lib/utils";

interface GaugeArcProps {
  value: number | string;
  label: string;
  percentage?: number; // 0 to 100
  color?: string; // hex or rgb
  unit?: string;
  size?: number;
  className?: string;
}

export const GaugeArc: React.FC<GaugeArcProps> = ({
  value,
  label,
  percentage = 50,
  color = "#ff7a00",
  unit = "",
  size = 72,
  className,
}) => {
  const radius = 28;
  const strokeWidth = 5;
  const circumference = Math.PI * radius; // Half circle arc
  const clamped = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", className)}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size * 0.65 }}>
        <svg
          width={size}
          height={size * 0.65}
          viewBox="0 0 70 42"
          className="overflow-visible"
        >
          {/* Background Arc */}
          <path
            d="M 7 35 A 28 28 0 0 1 63 35"
            fill="none"
            stroke="#e4e3dd"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active Colored Arc */}
          <path
            d="M 7 35 A 28 28 0 0 1 63 35"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Value in Center */}
        <div className="absolute bottom-0 text-center font-bold text-xs text-[#18191c] font-mono leading-none">
          {value}{unit}
        </div>
      </div>

      {/* Label under gauge */}
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#797a82] mt-1 font-mono">
        {label}
      </span>
    </div>
  );
};
