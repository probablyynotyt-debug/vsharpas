import React from 'react';

interface VSharpLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const VSharpLogo: React.FC<VSharpLogoProps> = ({
  size = 24,
  showText = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Bespoke Geometric V# Emblem */}
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-lg p-1"
        style={{ width: size + 8, height: size + 8 }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-200 hover:scale-105"
        >
          {/* Subtle glow / back-layer geometric grid */}
          <rect
            x="2"
            y="2"
            width="28"
            height="28"
            rx="7"
            fill="#121824"
            stroke="rgba(34, 211, 238, 0.25)"
            strokeWidth="1.2"
          />

          {/* Sharp stylized V */}
          <path
            d="M8 9L15.5 24.5C15.8 25.1 16.6 25.1 16.9 24.5L20 18"
            stroke="url(#vsharp-grad-v)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sharp modern # (Hash) mark interlocking with the V */}
          {/* Horizontal lines */}
          <path
            d="M17.5 13H27"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M16 18H25.5"
            stroke="#22d3ee"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Vertical / Slanted lines */}
          <path
            d="M20 10.5L18 20.5"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M24.5 10.5L22.5 20.5"
            stroke="#22d3ee"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Precision corner accent */}
          <circle cx="8" cy="9" r="1.5" fill="#38bdf8" />

          <defs>
            <linearGradient
              id="vsharp-grad-v"
              x1="8"
              y1="9"
              x2="20"
              y2="25"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f8fafc" />
              <stop offset="0.6" stopColor="#38bdf8" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-sm tracking-tight text-white flex items-center">
            V<span className="text-cyan-400 font-bold">#</span>
          </span>
          <span className="text-[10px] font-medium tracking-wider uppercase text-zinc-500">
            Studio
          </span>
        </div>
      )}
    </div>
  );
};
