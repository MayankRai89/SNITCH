import React from "react";

/**
 * SnitchIcon Component
 * Renders the Golden Snitch wing & orb icon matching the official brand asset.
 * Supports vector rendering (crisp at any resolution) as well as the PNG asset.
 */
export function SnitchIcon({
  size = 28,
  className = "",
  color = "#f5c518",
  highlightColor = "#ffffff",
  variant = "vector", // "vector" | "image"
  style = {},
  ...props
}) {
  if (variant === "image") {
    return (
      <img
        src="/snitch-icon.png"
        alt="Snitch"
        width={size}
        height={size}
        className={`inline-block object-contain ${className}`}
        style={{ width: size, height: size, ...style }}
        {...props}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={{ verticalAlign: "middle", ...style }}
      {...props}
    >
      <defs>
        <linearGradient id={`snitchGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color === "#f5c518" ? "#ffe259" : color} />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor={color === "#f5c518" ? "#c99200" : color} />
        </linearGradient>
      </defs>

      {/* Left Wing */}
      <path
        d="M210 365 C 190 320, 150 250, 95 180 C 60 135, 30 75, 42 12 C 45 4, 52 0, 58 6 C 75 35, 110 80, 175 145 C 155 120, 140 92, 132 70 C 130 62, 140 58, 145 64 C 165 95, 195 145, 230 220 C 215 190, 205 160, 200 135 C 198 127, 208 123, 213 130 C 235 165, 260 225, 275 285 C 255 305, 235 330, 210 365 Z"
        fill={`url(#snitchGradient-${size})`}
      />

      {/* Right Wing */}
      <path
        d="M302 365 C 322 320, 362 250, 417 180 C 452 135, 482 75, 470 12 C 467 4, 460 0, 454 6 C 437 35, 402 80, 337 145 C 357 120, 372 92, 380 70 C 382 62, 372 58, 367 64 C 347 95, 317 145, 282 220 C 297 190, 307 160, 312 135 C 314 127, 304 123, 299 130 C 277 165, 252 225, 237 285 C 257 305, 277 330, 302 365 Z"
        fill={`url(#snitchGradient-${size})`}
      />

      {/* Main Orb */}
      <circle cx="256" cy="395" r="105" fill={`url(#snitchGradient-${size})`} />

      {/* Highlight crescent */}
      <path
        d="M205 400 C 195 435, 225 470, 265 470"
        stroke={highlightColor}
        strokeWidth="24"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}

export default SnitchIcon;
