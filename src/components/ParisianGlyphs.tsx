import { useState } from 'react';

interface ParisianGlyphsProps {
  onBack: () => void;
}

// PARISIAN GLYPH LIBRARY — SACRED GEOMETRY COLLECTIBLES
// Ultra-thin line art (0.5–1pt), sage green, no fills, pure geometric precision

const GuimardMetroEntrance = () => (
  <svg width="100%" height="100%" viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Left vertical stem with organic Art Nouveau curve */}
    <path 
      d="M 65 200 L 65 120 Q 65 105 70 95" 
      stroke="currentColor" 
      strokeWidth="0.6" 
      fill="none"
      strokeLinecap="round"
    />
    
    {/* Right vertical stem with organic curve */}
    <path 
      d="M 135 200 L 135 120 Q 135 105 130 95" 
      stroke="currentColor" 
      strokeWidth="0.6" 
      fill="none"
      strokeLinecap="round"
    />
    
    {/* Left stem base ornament */}
    <circle cx="65" cy="200" r="3" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <circle cx="65" cy="200" r="1.5" stroke="currentColor" strokeWidth="0.4" fill="none" />
    
    {/* Right stem base ornament */}
    <circle cx="135" cy="200" r="3" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <circle cx="135" cy="200" r="1.5" stroke="currentColor" strokeWidth="0.4" fill="none" />
    
    {/* Iconic insect-like glass canopy - main arc */}
    <path 
      d="M 70 95 Q 75 75 85 65 Q 95 55 100 50 Q 105 55 115 65 Q 125 75 130 95" 
      stroke="currentColor" 
      strokeWidth="0.8" 
      fill="none"
      strokeLinecap="round"
    />
    
    {/* Inner canopy arc (glass panel) */}
    <path 
      d="M 72 96 Q 77 78 86 69 Q 95 60 100 56 Q 105 60 114 69 Q 123 78 128 96" 
      stroke="currentColor" 
      strokeWidth="0.4" 
      fill="none"
      strokeLinecap="round"
      opacity="0.7"
    />
    
    {/* Glass panel ribs (Art Nouveau organic divisions) */}
    <path d="M 80 88 Q 88 70 100 58" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
    <path d="M 120 88 Q 112 70 100 58" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
    <path d="M 90 92 Q 94 77 100 62" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
    <path d="M 110 92 Q 106 77 100 62" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
    
    {/* Canopy apex ornament */}
    <circle cx="100" cy="50" r="4" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <circle cx="100" cy="50" r="2" stroke="currentColor" strokeWidth="0.4" fill="none" />
    <path d="M 100 46 L 100 42" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
    <circle cx="100" cy="40" r="1.5" stroke="currentColor" strokeWidth="0.4" fill="none" />
    
    {/* Left wing support - organic curve */}
    <path 
      d="M 70 95 Q 60 100 55 110 Q 52 115 52 120" 
      stroke="currentColor" 
      strokeWidth="0.5" 
      fill="none"
      strokeLinecap="round"
      opacity="0.8"
    />
    
    {/* Right wing support - organic curve */}
    <path 
      d="M 130 95 Q 140 100 145 110 Q 148 115 148 120" 
      stroke="currentColor" 
      strokeWidth="0.5" 
      fill="none"
      strokeLinecap="round"
      opacity="0.8"
    />
    
    {/* Left wing ornamental curl */}
    <path 
      d="M 52 120 Q 50 125 52 130 Q 54 133 57 133" 
      stroke="currentColor" 
      strokeWidth="0.4" 
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
    
    {/* Right wing ornamental curl */}
    <path 
      d="M 148 120 Q 150 125 148 130 Q 146 133 143 133" 
      stroke="currentColor" 
      strokeWidth="0.4" 
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
    
    {/* Vertical symmetry line (invisible guide) */}
    <line 
      x1="100" y1="40" x2="100" y2="205" 
      stroke="currentColor" 
      strokeWidth="0.1" 
      opacity="0.1"
      strokeDasharray="2,4"
    />
    
    {/* Golden ratio circles (sacred geometry foundation) */}
    <circle cx="100" cy="120" r="60" stroke="currentColor" strokeWidth="0.15" opacity="0.08" fill="none" />
    <circle cx="100" cy="80" r="37" stroke="currentColor" strokeWidth="0.15" opacity="0.08" fill="none" />
    
    {/* Métro text banner (Art Nouveau lettering suggestion) */}
    <path 
      d="M 75 110 Q 100 108 125 110" 
      stroke="currentColor" 
      strokeWidth="0.4" 
      fill="none"
      opacity="0.5"
    />
    <path 
      d="M 77 113 Q 100 111 123 113" 
      stroke="currentColor" 
      strokeWidth="0.4" 
      fill="none"
      opacity="0.5"
    />
  </svg>
);

const OrnamentalGate = () => (
  <svg width="100%" height="100%" viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Gate posts */}
    <rect x="25" y="40" width="8" height="100" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <rect x="87" y="40" width="8" height="100" stroke="currentColor" strokeWidth="0.5" fill="none" />
    
    {/* Gate top ornaments */}
    <circle cx="29" cy="35" r="6" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <circle cx="91" cy="35" r="6" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <path d="M 29 29 L 29 20 L 26 23 M 29 20 L 32 23" stroke="currentColor" strokeWidth="0.4" fill="none" />
    <path d="M 91 29 L 91 20 L 88 23 M 91 20 L 94 23" stroke="currentColor" strokeWidth="0.4" fill="none" />
    
    {/* Vertical bars */}
    <line x1="40" y1="45" x2="40" y2="130" stroke="currentColor" strokeWidth="0.4" />
    <line x1="48" y1="48" x2="48" y2="130" stroke="currentColor" strokeWidth="0.4" />
    <line x1="56" y1="50" x2="56" y2="130" stroke="currentColor" strokeWidth="0.4" />
    <line x1="64" y1="48" x2="64" y2="130" stroke="currentColor" strokeWidth="0.4" />
    <line x1="72" y1="50" x2="72" y2="130" stroke="currentColor" strokeWidth="0.4" />
    <line x1="80" y1="48" x2="80" y2="130" stroke="currentColor" strokeWidth="0.4" />
    
    {/* Horizontal ornamental bands */}
    <line x1="33" y1="70" x2="87" y2="70" stroke="currentColor" strokeWidth="0.5" />
    <line x1="33" y1="100" x2="87" y2="100" stroke="currentColor" strokeWidth="0.5" />
    
    {/* Central medallion */}
    <circle cx="60" cy="85" r="12" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <circle cx="60" cy="85" r="8" stroke="currentColor" strokeWidth="0.3" fill="none" />
    <path d="M 60 77 L 60 93 M 52 85 L 68 85" stroke="currentColor" strokeWidth="0.3" />
    
    {/* Decorative spikes on top */}
    <path d="M 40 45 L 38 38 L 40 40 M 40 45 L 42 40 L 38 38" stroke="currentColor" strokeWidth="0.3" fill="none" />
    <path d="M 56 50 L 54 42 L 56 45 M 56 50 L 58 45 L 54 42" stroke="currentColor" strokeWidth="0.3" fill="none" />
    <path d="M 72 50 L 70 42 L 72 45 M 72 50 L 74 45 L 70 42" stroke="currentColor" strokeWidth="0.3" fill="none" />
    
    {/* Base */}
    <rect x="20" y="135" width="80" height="5" stroke="currentColor" strokeWidth="0.5" fill="none" />
  </svg>
);

const ManuscriptPen = () => (
  <svg width="100%" height="100%" viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Quill feather */}
    <path d="M 80 30 Q 75 50 73 80 Q 72 110 70 140" stroke="currentColor" strokeWidth="0.6" fill="none" />
    
    {/* Feather barbs - left side */}
    <path d="M 73 50 Q 60 48 50 50" stroke="currentColor" strokeWidth="0.3" opacity="0.7" />
    <path d="M 73 60 Q 55 56 40 60" stroke="currentColor" strokeWidth="0.3" opacity="0.7" />
    <path d="M 72 75 Q 52 70 35 75" stroke="currentColor" strokeWidth="0.3" opacity="0.7" />
    <path d="M 72 90 Q 55 85 42 88" stroke="currentColor" strokeWidth="0.3" opacity="0.7" />
    <path d="M 71 105 Q 56 100 48 102" stroke="currentColor" strokeWidth="0.3" opacity="0.7" />
    <path d="M 71 120 Q 60 116 54 118" stroke="currentColor" strokeWidth="0.3" opacity="0.7" />
    
    {/* Feather barbs - right side */}
    <path d="M 75 45 Q 82 43 88 45" stroke="currentColor" strokeWidth="0.3" opacity="0.7" />
    <path d="M 74 58 Q 84 55 92 58" stroke="currentColor" strokeWidth="0.3" opacity="0.7" />
    <path d="M 73 72 Q 85 68 94 72" stroke="currentColor" strokeWidth="0.3" opacity="0.7" />
    <path d="M 72 86 Q 83 82 90 85" stroke="currentColor" strokeWidth="0.3" opacity="0.7" />
    <path d="M 72 100 Q 82 96 88 99" stroke="currentColor" strokeWidth="0.3" opacity="0.7" />
    
    {/* Nib detail */}
    <path d="M 70 140 L 68 145 L 70 148 L 72 145 Z" stroke="currentColor" strokeWidth="0.4" fill="currentColor" opacity="0.3" />
    <line x1="70" y1="145" x2="70" y2="148" stroke="currentColor" strokeWidth="0.2" />
    
    {/* Ink flourish */}
    <path d="M 68 145 Q 55 150 45 148 Q 35 146 32 140" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1,2" opacity="0.5" />
    
    {/* Decorative curl */}
    <path d="M 75 35 Q 78 32 82 32 Q 85 32 86 35 Q 87 38 84 40" stroke="currentColor" strokeWidth="0.3" opacity="0.6" fill="none" />
  </svg>
);

const MapCompass = () => (
  <svg width="100%" height="100%" viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer compass ring */}
    <circle cx="60" cy="80" r="45" stroke="currentColor" strokeWidth="0.6" fill="none" />
    <circle cx="60" cy="80" r="42" stroke="currentColor" strokeWidth="0.3" fill="none" />
    
    {/* Cardinal points */}
    <text x="60" y="28" textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="serif">N</text>
    <text x="60" y="138" textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="serif">S</text>
    <text x="13" y="84" textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="serif">O</text>
    <text x="107" y="84" textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="serif">E</text>
    
    {/* Degree marks */}
    {Array.from({ length: 36 }).map((_, i) => {
      const angle = (i * 10 * Math.PI) / 180;
      const innerR = i % 3 === 0 ? 38 : 40;
      const outerR = 45;
      const x1 = 60 + Math.cos(angle - Math.PI / 2) * innerR;
      const y1 = 80 + Math.sin(angle - Math.PI / 2) * innerR;
      const x2 = 60 + Math.cos(angle - Math.PI / 2) * outerR;
      const y2 = 80 + Math.sin(angle - Math.PI / 2) * outerR;
      return (
        <line 
          key={i} 
          x1={x1} 
          y1={y1} 
          x2={x2} 
          y2={y2} 
          stroke="currentColor" 
          strokeWidth={i % 3 === 0 ? "0.5" : "0.3"}
          opacity="0.6"
        />
      );
    })}
    
    {/* Compass needle - North (dark) */}
    <path 
      d="M 60 80 L 56 50 L 60 45 L 64 50 Z" 
      stroke="currentColor" 
      strokeWidth="0.4" 
      fill="currentColor"
      opacity="0.7"
    />
    
    {/* Compass needle - South (light) */}
    <path 
      d="M 60 80 L 56 110 L 60 115 L 64 110 Z" 
      stroke="currentColor" 
      strokeWidth="0.4" 
      fill="none"
      opacity="0.5"
    />
    
    {/* Center pivot */}
    <circle cx="60" cy="80" r="4" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <circle cx="60" cy="80" r="1.5" fill="currentColor" />
    
    {/* Decorative corner ornaments */}
    <path d="M 30 25 L 20 20 L 25 30" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
    <path d="M 90 25 L 100 20 L 95 30" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
    <path d="M 30 135 L 20 140 L 25 130" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
    <path d="M 90 135 L 100 140 L 95 130" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
  </svg>
);

const RosaceHaussmann = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Center point - sacred geometry origin */}
    <circle cx="100" cy="120" r="0.8" fill="currentColor" opacity="0.4" />
    
    {/* Outer architectural frame (square window surround) */}
    <rect x="40" y="60" width="120" height="120" stroke="currentColor" strokeWidth="0.4" opacity="0.3" fill="none" />
    
    {/* Primary outer circle - stone medallion border */}
    <circle cx="100" cy="120" r="55" stroke="currentColor" strokeWidth="0.8" fill="none" />
    <circle cx="100" cy="120" r="53" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    
    {/* Outer decorative ring - egg-and-dart pattern suggestion */}
    <circle cx="100" cy="120" r="50" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    {Array.from({ length: 24 }).map((_, i) => {
      const angle = (i * 15 * Math.PI) / 180;
      const r = 50;
      const x = 100 + Math.cos(angle - Math.PI / 2) * r;
      const y = 120 + Math.sin(angle - Math.PI / 2) * r;
      return (
        <circle 
          key={`outer-${i}`} 
          cx={x} 
          cy={y} 
          r="1.2" 
          stroke="currentColor" 
          strokeWidth="0.3" 
          fill="none"
          opacity="0.4"
        />
      );
    })}
    
    {/* Secondary circle - inner medallion frame */}
    <circle cx="100" cy="120" r="42" stroke="currentColor" strokeWidth="0.6" fill="none" />
    
    {/* 8-petal rosette - main radial geometry */}
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * 45 * Math.PI) / 180;
      const innerR = 15;
      const midR = 28;
      const outerR = 40;
      
      const x1 = 100 + Math.cos(angle - Math.PI / 2) * innerR;
      const y1 = 120 + Math.sin(angle - Math.PI / 2) * innerR;
      const x2 = 100 + Math.cos(angle - Math.PI / 2) * midR;
      const y2 = 120 + Math.sin(angle - Math.PI / 2) * midR;
      const x3 = 100 + Math.cos(angle - Math.PI / 2) * outerR;
      const y3 = 120 + Math.sin(angle - Math.PI / 2) * outerR;
      
      // Petal outline (almond shape)
      const leftAngle = angle - (22.5 * Math.PI) / 180;
      const rightAngle = angle + (22.5 * Math.PI) / 180;
      const lx = 100 + Math.cos(leftAngle - Math.PI / 2) * midR;
      const ly = 120 + Math.sin(leftAngle - Math.PI / 2) * midR;
      const rx = 100 + Math.cos(rightAngle - Math.PI / 2) * midR;
      const ry = 120 + Math.sin(rightAngle - Math.PI / 2) * midR;
      
      return (
        <g key={`petal-${i}`}>
          {/* Main petal line */}
          <line 
            x1={x1} 
            y1={y1} 
            x2={x3} 
            y2={y3} 
            stroke="currentColor" 
            strokeWidth="0.5"
            opacity="0.7"
          />
          
          {/* Petal outline (teardrop/almond) */}
          <path 
            d={`M ${lx} ${ly} Q ${x3} ${y3} ${rx} ${ry} Q ${x2} ${y2} ${lx} ${ly}`}
            stroke="currentColor" 
            strokeWidth="0.4" 
            fill="none"
            opacity="0.5"
          />
        </g>
      );
    })}
    
    {/* 8 secondary radials (between petals) - thinner */}
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = ((i * 45 + 22.5) * Math.PI) / 180;
      const innerR = 20;
      const outerR = 38;
      const x1 = 100 + Math.cos(angle - Math.PI / 2) * innerR;
      const y1 = 120 + Math.sin(angle - Math.PI / 2) * innerR;
      const x2 = 100 + Math.cos(angle - Math.PI / 2) * outerR;
      const y2 = 120 + Math.sin(angle - Math.PI / 2) * outerR;
      
      return (
        <line 
          key={`secondary-${i}`}
          x1={x1} 
          y1={y1} 
          x2={x2} 
          y2={y2} 
          stroke="currentColor" 
          strokeWidth="0.3"
          opacity="0.4"
        />
      );
    })}
    
    {/* Central rosette - inner circle */}
    <circle cx="100" cy="120" r="15" stroke="currentColor" strokeWidth="0.6" fill="none" />
    <circle cx="100" cy="120" r="13" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.6" />
    
    {/* Central 4-fold cross (cardinal alignment) */}
    <line x1="100" y1="107" x2="100" y2="133" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
    <line x1="87" y1="120" x2="113" y2="120" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
    
    {/* Central ornament - 4 small circles at cardinal points */}
    {[0, 90, 180, 270].map((deg, i) => {
      const angle = (deg * Math.PI) / 180;
      const r = 10;
      const x = 100 + Math.cos(angle - Math.PI / 2) * r;
      const y = 120 + Math.sin(angle - Math.PI / 2) * r;
      return (
        <circle 
          key={`center-${i}`}
          cx={x} 
          cy={y} 
          r="2" 
          stroke="currentColor" 
          strokeWidth="0.4" 
          fill="none"
          opacity="0.7"
        />
      );
    })}
    
    {/* Golden ratio guide circles (invisible construction) */}
    <circle cx="100" cy="120" r="34" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="21" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    
    {/* Vertical and horizontal symmetry axes (barely visible) */}
    <line x1="100" y1="60" x2="100" y2="180" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
    <line x1="40" y1="120" x2="160" y2="120" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
    
    {/* Corner ornaments (architectural context - suggests building facade) */}
    <circle cx="45" cy="65" r="3" stroke="currentColor" strokeWidth="0.3" opacity="0.3" fill="none" />
    <circle cx="155" cy="65" r="3" stroke="currentColor" strokeWidth="0.3" opacity="0.3" fill="none" />
    <circle cx="45" cy="175" r="3" stroke="currentColor" strokeWidth="0.3" opacity="0.3" fill="none" />
    <circle cx="155" cy="175" r="3" stroke="currentColor" strokeWidth="0.3" opacity="0.3" fill="none" />
  </svg>
);

const SerrureParisienne = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Center point - sacred geometry origin */}
    <circle cx="100" cy="120" r="0.6" fill="currentColor" opacity="0.3" />
    
    {/* Outer decorative plate - main rectangle with subtle rounded corners */}
    <rect 
      x="55" 
      y="75" 
      width="90" 
      height="90" 
      rx="2" 
      stroke="currentColor" 
      strokeWidth="0.7" 
      fill="none" 
    />
    
    {/* Inner plate border - double frame effect */}
    <rect 
      x="58" 
      y="78" 
      width="84" 
      height="84" 
      rx="1.5" 
      stroke="currentColor" 
      strokeWidth="0.4" 
      fill="none"
      opacity="0.6"
    />
    
    {/* Four decorative screws in corners (Louis XVI style) */}
    {/* Top-left screw */}
    <circle cx="65" cy="85" r="2.5" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.7" />
    <circle cx="65" cy="85" r="1.2" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    <path d="M 63.5 85 L 66.5 85 M 65 83.5 L 65 86.5" stroke="currentColor" strokeWidth="0.25" opacity="0.6" />
    
    {/* Top-right screw */}
    <circle cx="135" cy="85" r="2.5" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.7" />
    <circle cx="135" cy="85" r="1.2" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    <path d="M 133.5 85 L 136.5 85 M 135 83.5 L 135 86.5" stroke="currentColor" strokeWidth="0.25" opacity="0.6" />
    
    {/* Bottom-left screw */}
    <circle cx="65" cy="155" r="2.5" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.7" />
    <circle cx="65" cy="155" r="1.2" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    <path d="M 63.5 155 L 66.5 155 M 65 153.5 L 65 156.5" stroke="currentColor" strokeWidth="0.25" opacity="0.6" />
    
    {/* Bottom-right screw */}
    <circle cx="135" cy="155" r="2.5" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.7" />
    <circle cx="135" cy="155" r="1.2" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    <path d="M 133.5 155 L 136.5 155 M 135 153.5 L 135 156.5" stroke="currentColor" strokeWidth="0.25" opacity="0.6" />
    
    {/* Central keyhole - inverted drop shape (vertical oval) */}
    {/* Top circle part of keyhole */}
    <circle cx="100" cy="110" r="8" stroke="currentColor" strokeWidth="0.6" fill="none" />
    <circle cx="100" cy="110" r="6.5" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.6" />
    
    {/* Bottom trapezoid/slot part of keyhole */}
    <path 
      d="M 96 117 L 94 130 L 106 130 L 104 117 Z" 
      stroke="currentColor" 
      strokeWidth="0.6" 
      fill="none"
    />
    <path 
      d="M 96.5 118 L 95 129 L 105 129 L 103.5 118" 
      stroke="currentColor" 
      strokeWidth="0.3" 
      fill="none"
      opacity="0.5"
    />
    
    {/* Decorative Louis XVI volutes - top corners (very light) */}
    {/* Top-left volute */}
    <path 
      d="M 70 95 Q 75 90 80 95" 
      stroke="currentColor" 
      strokeWidth="0.35" 
      fill="none"
      opacity="0.5"
    />
    <path 
      d="M 72 93 Q 75 91 78 93" 
      stroke="currentColor" 
      strokeWidth="0.25" 
      fill="none"
      opacity="0.4"
    />
    
    {/* Top-right volute (mirrored) */}
    <path 
      d="M 130 95 Q 125 90 120 95" 
      stroke="currentColor" 
      strokeWidth="0.35" 
      fill="none"
      opacity="0.5"
    />
    <path 
      d="M 128 93 Q 125 91 122 93" 
      stroke="currentColor" 
      strokeWidth="0.25" 
      fill="none"
      opacity="0.4"
    />
    
    {/* Bottom decorative geometric patterns (Louis XVI style) */}
    {/* Left pattern */}
    <path 
      d="M 75 145 L 80 140 L 75 135" 
      stroke="currentColor" 
      strokeWidth="0.3" 
      fill="none"
      opacity="0.5"
    />
    <circle cx="75" cy="140" r="1.5" stroke="currentColor" strokeWidth="0.25" fill="none" opacity="0.4" />
    
    {/* Right pattern (mirrored) */}
    <path 
      d="M 125 145 L 120 140 L 125 135" 
      stroke="currentColor" 
      strokeWidth="0.3" 
      fill="none"
      opacity="0.5"
    />
    <circle cx="125" cy="140" r="1.5" stroke="currentColor" strokeWidth="0.25" fill="none" opacity="0.4" />
    
    {/* Subtle engraved lines (texture suggestion) - top */}
    <line x1="70" y1="88" x2="130" y2="88" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
    
    {/* Subtle engraved lines (texture suggestion) - bottom */}
    <line x1="70" y1="152" x2="130" y2="152" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
    
    {/* Sacred geometry construction guides (invisible) */}
    <circle cx="100" cy="120" r="55" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="34" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    
    {/* Vertical symmetry axis */}
    <line x1="100" y1="70" x2="100" y2="170" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
    
    {/* Horizontal symmetry axis */}
    <line x1="50" y1="120" x2="150" y2="120" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
    
    {/* Corner decoration - tiny flourishes suggesting age */}
    <path d="M 145 75 Q 148 75 148 78" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
    <path d="M 55 75 Q 52 75 52 78" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
    <path d="M 145 165 Q 148 165 148 162" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
    <path d="M 55 165 Q 52 165 52 162" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
  </svg>
);

const PlaqueDeRue = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Center point - sacred geometry origin */}
    <circle cx="100" cy="120" r="0.7" fill="currentColor" opacity="0.3" />
    
    {/* Main plaque frame - rectangle with rounded top corners (classic Parisian style) */}
    <path 
      d="M 45 160 L 45 85 Q 45 75 55 75 L 145 75 Q 155 75 155 85 L 155 160 L 45 160 Z" 
      stroke="currentColor" 
      strokeWidth="0.8" 
      fill="none"
    />
    
    {/* Inner border - double frame effect (enamel edge) */}
    <path 
      d="M 48 157 L 48 86 Q 48 78 56 78 L 144 78 Q 152 78 152 86 L 152 157 L 48 157 Z" 
      stroke="currentColor" 
      strokeWidth="0.4" 
      fill="none"
      opacity="0.6"
    />
    
    {/* Green trim border (classic Parisian green edge) */}
    <path 
      d="M 50 154 L 50 87 Q 50 80 57 80 L 143 80 Q 150 80 150 87 L 150 154 L 50 154 Z" 
      stroke="currentColor" 
      strokeWidth="0.3" 
      fill="none"
      opacity="0.5"
    />
    
    {/* Four corner rivets/screws */}
    {/* Top-left rivet */}
    <circle cx="55" cy="85" r="2.2" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.7" />
    <circle cx="55" cy="85" r="1" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    <path d="M 53.8 85 L 56.2 85" stroke="currentColor" strokeWidth="0.2" opacity="0.6" />
    
    {/* Top-right rivet */}
    <circle cx="145" cy="85" r="2.2" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.7" />
    <circle cx="145" cy="85" r="1" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    <path d="M 143.8 85 L 146.2 85" stroke="currentColor" strokeWidth="0.2" opacity="0.6" />
    
    {/* Bottom-left rivet */}
    <circle cx="55" cy="150" r="2.2" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.7" />
    <circle cx="55" cy="150" r="1" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    <path d="M 53.8 150 L 56.2 150" stroke="currentColor" strokeWidth="0.2" opacity="0.6" />
    
    {/* Bottom-right rivet */}
    <circle cx="145" cy="150" r="2.2" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.7" />
    <circle cx="145" cy="150" r="1" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    <path d="M 143.8 150 L 146.2 150" stroke="currentColor" strokeWidth="0.2" opacity="0.6" />
    
    {/* Text area guides (where street name would go) - three subtle horizontal lines */}
    <line x1="65" y1="105" x2="135" y2="105" stroke="currentColor" strokeWidth="0.15" opacity="0.2" strokeDasharray="3,2" />
    <line x1="60" y1="120" x2="140" y2="120" stroke="currentColor" strokeWidth="0.15" opacity="0.2" strokeDasharray="3,2" />
    <line x1="65" y1="135" x2="135" y2="135" stroke="currentColor" strokeWidth="0.15" opacity="0.2" strokeDasharray="3,2" />
    
    {/* Subtle enamel texture lines (horizontal bands suggesting manufacturing) */}
    <line x1="50" y1="92" x2="150" y2="92" stroke="currentColor" strokeWidth="0.15" opacity="0.15" />
    <line x1="50" y1="145" x2="150" y2="145" stroke="currentColor" strokeWidth="0.15" opacity="0.15" />
    
    {/* Sacred geometry construction guides (invisible) */}
    <circle cx="100" cy="120" r="60" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="37" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="23" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    
    {/* Vertical symmetry axis */}
    <line x1="100" y1="70" x2="100" y2="165" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
    
    {/* Horizontal symmetry axis */}
    <line x1="40" y1="120" x2="160" y2="120" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
    
    {/* Golden ratio proportions guide - horizontal thirds */}
    <line x1="45" y1="100" x2="155" y2="100" stroke="currentColor" strokeWidth="0.08" opacity="0.06" strokeDasharray="1,3" />
    <line x1="45" y1="140" x2="155" y2="140" stroke="currentColor" strokeWidth="0.08" opacity="0.06" strokeDasharray="1,3" />
    
    {/* Subtle corner detail (aging/weathering suggestion) */}
    <path d="M 155 160 L 157 160 L 157 158" stroke="currentColor" strokeWidth="0.2" opacity="0.2" />
    <path d="M 45 160 L 43 160 L 43 158" stroke="currentColor" strokeWidth="0.2" opacity="0.2" />
  </svg>
);

const FontaineWallace = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Center point - sacred geometry origin */}
    <circle cx="100" cy="120" r="0.7" fill="currentColor" opacity="0.3" />
    
    {/* Dome top - elegant cupola */}
    <ellipse cx="100" cy="70" rx="18" ry="8" stroke="currentColor" strokeWidth="0.6" fill="none" />
    <ellipse cx="100" cy="70" rx="16" ry="7" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    
    {/* Dome support - decorative capital */}
    <path d="M 82 70 L 85 78 L 115 78 L 118 70" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.7" />
    <line x1="85" y1="78" x2="115" y2="78" stroke="currentColor" strokeWidth="0.4" />
    
    {/* Four caryatids - simplified female figures */}
    {/* Front-left caryatid */}
    <ellipse cx="88" cy="95" rx="4" ry="5" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    <line x1="88" y1="100" x2="88" y2="125" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
    <path d="M 88 110 L 85 115 M 88 110 L 91 115" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
    
    {/* Front-right caryatid */}
    <ellipse cx="112" cy="95" rx="4" ry="5" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    <line x1="112" y1="100" x2="112" y2="125" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
    <path d="M 112 110 L 109 115 M 112 110 L 115 115" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
    
    {/* Back-left caryatid (implied) */}
    <ellipse cx="92" cy="92" rx="3" ry="4" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.4" />
    <line x1="92" y1="96" x2="92" y2="122" stroke="currentColor" strokeWidth="0.35" opacity="0.5" />
    
    {/* Back-right caryatid (implied) */}
    <ellipse cx="108" cy="92" rx="3" ry="4" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.4" />
    <line x1="108" y1="96" x2="108" y2="122" stroke="currentColor" strokeWidth="0.35" opacity="0.5" />
    
    {/* Upper basin - water collection */}
    <path d="M 85 78 Q 85 82 88 82 L 112 82 Q 115 82 115 78" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    
    {/* Central basin - main water feature */}
    <ellipse cx="100" cy="128" rx="22" ry="6" stroke="currentColor" strokeWidth="0.6" fill="none" />
    <ellipse cx="100" cy="128" rx="20" ry="5" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    <line x1="78" y1="128" x2="78" y2="135" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
    <line x1="122" y1="128" x2="122" y2="135" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
    
    {/* Lower basin connection */}
    <path d="M 78 135 Q 78 138 80 138 L 120 138 Q 122 138 122 135" stroke="currentColor" strokeWidth="0.5" fill="none" />
    
    {/* Base pedestal */}
    <rect x="85" y="138" width="30" height="12" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.7" />
    <rect x="87" y="140" width="26" height="8" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    
    {/* Ground base - foundation */}
    <ellipse cx="100" cy="155" rx="28" ry="5" stroke="currentColor" strokeWidth="0.6" fill="none" />
    <ellipse cx="100" cy="155" rx="26" ry="4" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    
    {/* Sacred geometry construction guides */}
    <circle cx="100" cy="120" r="55" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="34" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="21" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    
    {/* Vertical symmetry axis */}
    <line x1="100" y1="65" x2="100" y2="160" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
    
    {/* Horizontal symmetry axis */}
    <line x1="70" y1="120" x2="130" y2="120" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
  </svg>
);

const ReverbereHaussmannien = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Center point - sacred geometry origin */}
    <circle cx="100" cy="120" r="0.6" fill="currentColor" opacity="0.3" />
    
    {/* Lantern top - decorative finial */}
    <circle cx="100" cy="55" r="3" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    <line x1="100" y1="52" x2="100" y2="48" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
    <circle cx="100" cy="47" r="1.5" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    
    {/* Lantern dome/roof */}
    <path d="M 88 72 L 100 58 L 112 72" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <line x1="88" y1="72" x2="112" y2="72" stroke="currentColor" strokeWidth="0.5" />
    
    {/* Lantern glass enclosure */}
    <rect x="90" y="72" width="20" height="24" stroke="currentColor" strokeWidth="0.6" fill="none" />
    <rect x="92" y="74" width="16" height="20" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    
    {/* Glass panes - vertical divisions */}
    <line x1="100" y1="72" x2="100" y2="96" stroke="currentColor" strokeWidth="0.25" opacity="0.4" />
    <line x1="95" y1="72" x2="95" y2="96" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
    <line x1="105" y1="72" x2="105" y2="96" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
    
    {/* Lantern base decorative band */}
    <rect x="88" y="96" width="24" height="4" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.7" />
    <line x1="88" y1="98" x2="112" y2="98" stroke="currentColor" strokeWidth="0.25" opacity="0.4" />
    
    {/* Upper pole connection - ornamental collar */}
    <path d="M 97 100 L 95 105 L 105 105 L 103 100 Z" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    
    {/* Main pole - slender vertical */}
    <line x1="100" y1="105" x2="100" y2="165" stroke="currentColor" strokeWidth="0.6" />
    <line x1="98" y1="105" x2="98" y2="165" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
    <line x1="102" y1="105" x2="102" y2="165" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
    
    {/* Decorative mid-pole bands */}
    <ellipse cx="100" cy="130" rx="4" ry="2" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.5" />
    <ellipse cx="100" cy="150" rx="4" ry="2" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.5" />
    
    {/* Base - ground anchor */}
    <path d="M 95 165 L 90 170 L 90 172 L 110 172 L 110 170 L 105 165" stroke="currentColor" strokeWidth="0.6" fill="none" />
    <rect x="92" y="172" width="16" height="3" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.7" />
    
    {/* Ground plate */}
    <ellipse cx="100" cy="178" rx="20" ry="3" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.6" />
    
    {/* Sacred geometry construction guides */}
    <circle cx="100" cy="120" r="60" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="37" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="23" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    
    {/* Vertical symmetry axis */}
    <line x1="100" y1="45" x2="100" y2="180" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
    
    {/* Horizontal symmetry axis */}
    <line x1="70" y1="120" x2="130" y2="120" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
  </svg>
);

const OeilDeBoeuf = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Center point - sacred geometry origin */}
    <circle cx="100" cy="120" r="0.7" fill="currentColor" opacity="0.3" />
    
    {/* Outer stone frame - architectural surround */}
    <circle cx="100" cy="120" r="40" stroke="currentColor" strokeWidth="0.7" fill="none" />
    <circle cx="100" cy="120" r="37" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    
    {/* Keystone at top - decorative architectural element */}
    <path d="M 95 80 L 100 77 L 105 80 L 103 85 L 97 85 Z" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.7" />
    <line x1="100" y1="77" x2="100" y2="82" stroke="currentColor" strokeWidth="0.25" opacity="0.4" />
    
    {/* Inner window frame - wood or metal */}
    <circle cx="100" cy="120" r="32" stroke="currentColor" strokeWidth="0.6" fill="none" />
    <circle cx="100" cy="120" r="30" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    
    {/* Crossbars - muntins dividing the window */}
    {/* Vertical crossbar */}
    <line x1="100" y1="88" x2="100" y2="152" stroke="currentColor" strokeWidth="0.5" />
    {/* Horizontal crossbar */}
    <line x1="68" y1="120" x2="132" y2="120" stroke="currentColor" strokeWidth="0.5" />
    
    {/* Decorative cross center - rosette */}
    <circle cx="100" cy="120" r="3" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    <circle cx="100" cy="120" r="1.5" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    
    {/* Stone texture suggestion - radial segments */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 100 + Math.cos(rad) * 37;
      const y1 = 120 + Math.sin(rad) * 37;
      const x2 = 100 + Math.cos(rad) * 40;
      const y2 = 120 + Math.sin(rad) * 40;
      return (
        <line 
          key={`stone-${i}`}
          x1={x1} 
          y1={y1} 
          x2={x2} 
          y2={y2} 
          stroke="currentColor" 
          strokeWidth="0.2" 
          opacity="0.25"
        />
      );
    })}
    
    {/* Sacred geometry construction guides */}
    <circle cx="100" cy="120" r="55" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="34" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="21" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    
    {/* Vertical symmetry axis */}
    <line x1="100" y1="75" x2="100" y2="165" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
    
    {/* Horizontal symmetry axis */}
    <line x1="55" y1="120" x2="145" y2="120" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
  </svg>
);

const GrilleDeMetro = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Center point - sacred geometry origin */}
    <circle cx="100" cy="120" r="0.6" fill="currentColor" opacity="0.3" />
    
    {/* Outer frame - metal border */}
    <rect x="60" y="80" width="80" height="80" stroke="currentColor" strokeWidth="0.7" fill="none" />
    <rect x="62" y="82" width="76" height="76" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    
    {/* Diamond/diagonal slat pattern - ventilation */}
    {/* Create diagonal lines forming diamond grid */}
    {Array.from({ length: 12 }).map((_, i) => {
      const spacing = 12;
      const offset = 60 + i * spacing;
      return (
        <g key={`diag-a-${i}`}>
          <line 
            x1={offset} 
            y1="80" 
            x2={offset + 80} 
            y2="160" 
            stroke="currentColor" 
            strokeWidth="0.4" 
            opacity="0.7"
          />
        </g>
      );
    })}
    
    {Array.from({ length: 12 }).map((_, i) => {
      const spacing = 12;
      const offset = 60 + i * spacing;
      return (
        <g key={`diag-b-${i}`}>
          <line 
            x1={offset} 
            y1="160" 
            x2={offset + 80} 
            y2="80" 
            stroke="currentColor" 
            strokeWidth="0.4" 
            opacity="0.7"
          />
        </g>
      );
    })}
    
    {/* Corner reinforcement rivets */}
    <circle cx="68" cy="88" r="2" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    <circle cx="132" cy="88" r="2" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    <circle cx="68" cy="152" r="2" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    <circle cx="132" cy="152" r="2" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.6" />
    
    {/* Central rivet */}
    <circle cx="100" cy="120" r="2.5" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.7" />
    <circle cx="100" cy="120" r="1.2" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.5" />
    
    {/* Sacred geometry construction guides */}
    <circle cx="100" cy="120" r="56" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="35" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="22" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    
    {/* Vertical symmetry axis */}
    <line x1="100" y1="75" x2="100" y2="165" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
    
    {/* Horizontal symmetry axis */}
    <line x1="55" y1="120" x2="145" y2="120" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
  </svg>
);

const PaveParisien = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Center point - sacred geometry origin */}
    <circle cx="100" cy="120" r="0.7" fill="currentColor" opacity="0.3" />
    
    {/* Main cobblestone - slightly irregular trapezoid (perspective) */}
    <path 
      d="M 70 95 L 130 98 L 128 142 L 72 139 Z" 
      stroke="currentColor" 
      strokeWidth="0.7" 
      fill="none"
    />
    
    {/* Inner edge - worn beveled edge */}
    <path 
      d="M 73 99 L 127 102 L 125 138 L 75 135 Z" 
      stroke="currentColor" 
      strokeWidth="0.4" 
      fill="none"
      opacity="0.6"
    />
    
    {/* Surface texture lines - weathering and aging */}
    {/* Horizontal wear lines */}
    <line x1="75" y1="108" x2="125" y2="110" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
    <line x1="73" y1="118" x2="127" y2="120" stroke="currentColor" strokeWidth="0.2" opacity="0.35" />
    <line x1="74" y1="128" x2="126" y2="130" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
    
    {/* Vertical subtle cracks */}
    <line x1="90" y1="98" x2="88" y2="138" stroke="currentColor" strokeWidth="0.15" opacity="0.25" />
    <line x1="110" y1="99" x2="112" y2="139" stroke="currentColor" strokeWidth="0.15" opacity="0.25" />
    
    {/* Corner chips/wear */}
    <path d="M 70 95 L 72 96" stroke="currentColor" strokeWidth="0.25" opacity="0.3" />
    <path d="M 130 98 L 129 100" stroke="currentColor" strokeWidth="0.25" opacity="0.3" />
    <path d="M 72 139 L 74 138" stroke="currentColor" strokeWidth="0.25" opacity="0.3" />
    <path d="M 128 142 L 127 140" stroke="currentColor" strokeWidth="0.25" opacity="0.3" />
    
    {/* Surface irregularity dots (stone grain) */}
    <circle cx="85" cy="112" r="0.5" fill="currentColor" opacity="0.25" />
    <circle cx="100" cy="125" r="0.5" fill="currentColor" opacity="0.2" />
    <circle cx="115" cy="115" r="0.5" fill="currentColor" opacity="0.25" />
    <circle cx="95" cy="132" r="0.5" fill="currentColor" opacity="0.2" />
    
    {/* Context - suggest adjacent stones (partial edges) */}
    <line x1="130" y1="98" x2="145" y2="99" stroke="currentColor" strokeWidth="0.3" opacity="0.2" />
    <line x1="70" y1="95" x2="55" y2="94" stroke="currentColor" strokeWidth="0.3" opacity="0.2" />
    <line x1="72" y1="139" x2="70" y2="155" stroke="currentColor" strokeWidth="0.3" opacity="0.2" />
    <line x1="128" y1="142" x2="130" y2="158" stroke="currentColor" strokeWidth="0.3" opacity="0.2" />
    
    {/* Sacred geometry construction guides */}
    <circle cx="100" cy="120" r="50" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="31" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    <circle cx="100" cy="120" r="19" stroke="currentColor" strokeWidth="0.1" opacity="0.08" fill="none" />
    
    {/* Vertical symmetry axis */}
    <line x1="100" y1="90" x2="100" y2="150" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
    
    {/* Horizontal symmetry axis */}
    <line x1="65" y1="120" x2="135" y2="120" stroke="currentColor" strokeWidth="0.1" opacity="0.1" strokeDasharray="2,4" />
  </svg>
);

export function ParisianGlyphs({ onBack }: ParisianGlyphsProps) {
  const [selectedGlyph, setSelectedGlyph] = useState<string | null>(null);

  const glyphs = [
    {
      id: 'guimard-metro',
      title: 'Entrée de Métro Guimard',
      category: 'Architecture Art Nouveau',
      year: '1900',
      arrondissement: 'Multiple',
      description: 'L\'iconique édicule de métro parisien signé Hector Guimard. Ses tiges organiques et sa verrière "libellule" incarnent l\'Art Nouveau à son apogée.',
      rarity: 'Emblématique',
      component: <GuimardMetroEntrance />,
      discovered: true,
      meaning: 'Symbole de la modernité parisienne du début XXe siècle. Les courbes naturelles de Guimard transforment l\'entrée utilitaire en sculpture urbaine.',
      locations: [
        'Abbesses (18e) — Édicule complet',
        'Porte Dauphine (16e) — Édicule complet',
        'Châtelet (1er) — Balustrades',
      ]
    },
    {
      id: 'rosace-haussmann',
      title: 'Rosace d\'Haussmann',
      category: 'Architecture Classique',
      year: '1853-1870',
      arrondissement: 'Tous',
      description: 'Le médaillon circulaire en pierre qui apparaît au-dessus des fenêtres, balcons et corniches haussmaniennes. Géométrie pure, symétrie parfaite, rythme urbain.',
      rarity: 'Omniprésent',
      component: <RosaceHaussmann />,
      discovered: true,
      meaning: 'Le Souffle de l\'Ordre — incarnation de la symétrie, l\'alignement et du rythme classique imposé par Haussmann. Contraste total avec les courbes organiques de Guimard.',
      locations: [
        'Boulevard Haussmann (8e/9e) — Façades typiques',
        'Avenue de l\'Opéra (1er) — Médaillons multiples',
        'Rue de Rivoli (1er/4e) — Rosaces en série',
      ]
    },
    {
      id: 'serrure-parisienne',
      title: 'Serrure Parisienne',
      category: 'Détail Architectural',
      year: 'XVIIe–XIXe',
      arrondissement: 'Multiple',
      description: 'La plaque de serrure ancienne, ornement mystérieux des portes du vieux Paris. Symbole des passages secrets, des seuils et des énigmes urbaines.',
      rarity: 'Mystérieux',
      component: <SerrureParisienne />,
      discovered: true,
      meaning: 'Le Seuil de l\'Invisible — symbole des portes secrètes, du caché, du passage. Cette serrure représente la clé invisible du Vieux Paris, celle qui ouvre vers l\'ARCHÉ.',
      locations: [
        'Hôtel de Sully (4e) — Plaques Louis XVI',
        'Île Saint-Louis (4e) — Serrures anciennes',
        'Saint-Germain-des-Prés (6e) — Portes XVIIIe',
      ]
    },
    {
      id: 'plaque-de-rue',
      title: 'Plaque de Rue',
      category: 'Mobilier Urbain',
      year: 'XIXe–XXe',
      arrondissement: 'Tous',
      description: 'L\'iconique plaque bleue aux coins arrondis qui nomme chaque rue parisienne. Symbole de navigation urbaine et d\'identité toponymique.',
      rarity: 'Iconique',
      component: <PlaqueDeRue />,
      discovered: true,
      meaning: 'Le Nom de la Ville — marqueur d\'orientation et d\'identité. Chaque plaque est une coordonnée narrative, un point d\'ancrage pour les récits de l\'ARCHÉ.',
      locations: [
        'Rue de Rivoli (1er/4e) — Plaques historiques',
        'Montmartre (18e) — Quartier des plaques anciennes',
        'Le Marais (3e/4e) — Variantes typographiques',
      ]
    },
    {
      id: 'fontaine-wallace',
      title: 'Fontaine Wallace',
      category: 'Mobilier Urbain',
      year: '1872',
      arrondissement: 'Multiple',
      description: 'Don philanthropique de Sir Richard Wallace après le siège de 1870. Quatre cariatides soutiennent un dôme élégant, symbole de générosité urbaine.',
      rarity: 'Historique',
      component: <FontaineWallace />,
      discovered: true,
      meaning: 'Le Don de l\'Eau — générosité, partage, mémoire collective. Les quatre cariatides représentent les vertus : Bonté, Simplicité, Charité, Sobriété.',
      locations: [
        'Place Saint-Sulpice (6e) — Fontaine complète',
        'Square de la Roquette (11e) — Modèle classique',
        'Boulevard de la Villette (19e) — Wallace verte',
      ]
    },
    {
      id: 'reverbere-haussmannien',
      title: 'Réverbère Haussmannien',
      category: 'Mobilier Urbain',
      year: '1853-1870',
      arrondissement: 'Tous',
      description: 'Le lampadaire élégant des boulevards haussmanniens. Lanterne à verre, fût cannelé, et finial décoratif incarnent l\'éclairage public du Second Empire.',
      rarity: 'Élégant',
      component: <ReverbereHaussmannien />,
      discovered: true,
      meaning: 'La Lumière de l\'Empire — ordre urbain, sécurité nocturne, modernité. Le réverbère transforme Paris en théâtre permanent, même la nuit.',
      locations: [
        'Place Vendôme (1er) — Réverbères d\'origine',
        'Avenue de l\'Opéra (1er/9e) — Alignement parfait',
        'Pont Alexandre III (7e/8e) — Candélabres monumentaux',
      ]
    },
    {
      id: 'oeil-de-boeuf',
      title: 'Œil-de-Bœuf',
      category: 'Architecture Classique',
      year: 'XVIIe–XVIIIe',
      arrondissement: 'Multiple',
      description: 'La fenêtre ronde des combles mansardés. Cadre en pierre, croisillons, et keystone créent un regard circulaire sur la rue depuis les toits.',
      rarity: 'Observateur',
      component: <OeilDeBoeuf />,
      discovered: true,
      meaning: 'Le Regard d\'en Haut — observation silencieuse, témoin des toits. Cette fenêtre voit tout depuis les mansardes, l\'œil secret de Paris.',
      locations: [
        'Île Saint-Louis (4e) — Œils-de-bœuf classiques',
        'Hôtel de Ville (4e) — Fenêtres rondes multiples',
        'Rue de Varenne (7e) — Architecture aristocratique',
      ]
    },
    {
      id: 'grille-de-metro',
      title: 'Grille de Métro',
      category: 'Mobilier Urbain',
      year: '1900–1930',
      arrondissement: 'Multiple',
      description: 'La grille de ventilation Art Déco du métro parisien. Motif diamant, rivets métalliques, souffle souterrain — respiration de la ville invisible.',
      rarity: 'Souterrain',
      component: <GrilleDeMetro />,
      discovered: true,
      meaning: 'Le Souffle du Sous-Sol — connexion avec le Paris invisible, l\'infrastructure cachée. Cette grille est le poumon du métro, l\'haleine de la machine urbaine.',
      locations: [
        'Châtelet-Les Halles (1er) — Grilles multiples',
        'Gare du Nord (10e) — Ventilation Art Déco',
        'Réaumur-Sébastopol (2e/3e) — Grilles anciennes',
      ]
    },
    {
      id: 'pave-parisien',
      title: 'Pavé Parisien',
      category: 'Infrastructure',
      year: 'Médiéval–XIXe',
      arrondissement: 'Tous',
      description: 'Le pavé de grès des rues parisiennes. Pierre irrégulière, usée par les siècles, portant la mémoire de millions de pas et de révolutions.',
      rarity: 'Fondateur',
      component: <PaveParisien />,
      discovered: true,
      meaning: 'La Pierre du Sol — fondation, ancrage, mémoire physique. Le pavé est le matériau brut de Paris, témoin de toutes les époques, base de tout récit.',
      locations: [
        'Montmartre (18e) — Rues pavées originales',
        'Île de la Cité (1er/4e) — Pavés médiévaux',
        'Belleville (20e) — Pavés des révoltes',
      ]
    }
  ];

  const discoveredGlyphs = glyphs.filter(g => g.discovered);
  const selectedGlyphData = glyphs.find(g => g.id === selectedGlyph);

  const parisGreen = '#2F493D';
  const sageGreen = '#2F493D';
  const parchment = '#FAF8F2';
  const antiqueDark = '#0F3D33';
  const antiqueGold = '#DCC68A';

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        background: parchment,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Sacred geometry background */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.02,
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="glyphGrid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="30" stroke={sageGreen} strokeWidth="0.2" fill="none" />
              <circle cx="40" cy="40" r="18.5" stroke={sageGreen} strokeWidth="0.15" fill="none" />
              <path d="M 40 10 L 40 70 M 10 40 L 70 40" stroke={sageGreen} strokeWidth="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#glyphGrid)" />
        </svg>
      </div>

      {/* Radial vignette */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, transparent 0%, ${parchment} 100%)`,
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: 'fixed',
          top: '32px',
          left: '32px',
          background: 'transparent',
          border: 'none',
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: antiqueDark,
          opacity: 0.4,
          cursor: 'pointer',
          transition: 'opacity 0.3s',
          zIndex: 100
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
      >
        ‹ Retour au Codex
      </button>

      {/* Main content */}
      <div 
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '80px 60px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {!selectedGlyph ? (
          <>
            {/* HEADER */}
            <header 
              style={{
                textAlign: 'center',
                marginBottom: '80px'
              }}
            >
              <div 
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: antiqueDark,
                  opacity: 0.5,
                  marginBottom: '16px'
                }}
              >
                CITYNODES PARIS — COLLECTION
              </div>
              
              <h1 
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '64px',
                  fontWeight: '400',
                  letterSpacing: '0.01em',
                  color: sageGreen,
                  marginBottom: '12px',
                  lineHeight: '1.1'
                }}
              >
                Glyphes Parisiens
              </h1>

              {/* Underline engraving */}
              <div 
                style={{
                  width: '120px',
                  height: '1px',
                  background: `linear-gradient(to right, transparent, ${sageGreen}, transparent)`,
                  margin: '20px auto',
                  opacity: 0.3
                }}
              />
              
              <p 
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '16px',
                  fontStyle: 'italic',
                  color: antiqueDark,
                  opacity: 0.6,
                  fontWeight: '300',
                  marginBottom: '8px'
                }}
              >
                Géométrie sacrée de l'architecture parisienne
              </p>

              <div 
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  color: antiqueGold,
                  opacity: 0.7
                }}
              >
                {discoveredGlyphs.length} / {glyphs.length} découverts
              </div>
            </header>

            {/* GLYPH COLLECTION GRID */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '40px',
                maxWidth: '1400px',
                margin: '0 auto'
              }}
            >
              {glyphs.map((glyph) => (
                <div 
                  key={glyph.id}
                  style={{
                    position: 'relative'
                  }}
                >
                  {/* Catalog number */}
                  <div 
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '9px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: antiqueDark,
                      opacity: 0.3,
                      marginBottom: '12px',
                      textAlign: 'center'
                    }}
                  >
                    Glyphe {String(glyphs.indexOf(glyph) + 1).padStart(2, '0')}
                  </div>

                  {/* Glyph card */}
                  <button
                    onClick={() => glyph.discovered && setSelectedGlyph(glyph.id)}
                    disabled={!glyph.discovered}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: `1px solid ${sageGreen}${glyph.discovered ? '20' : '08'}`,
                      borderRadius: '0px',
                      padding: '48px 32px',
                      textAlign: 'center',
                      cursor: glyph.discovered ? 'pointer' : 'not-allowed',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: glyph.discovered 
                        ? '0 2px 12px rgba(47, 73, 61, 0.06)' 
                        : '0 1px 4px rgba(47, 73, 61, 0.02)',
                      opacity: glyph.discovered ? 1 : 0.4,
                      filter: glyph.discovered ? 'none' : 'blur(2px)'
                    }}
                    onMouseEnter={(e) => {
                      if (glyph.discovered) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(47, 73, 61, 0.12)';
                        e.currentTarget.style.borderColor = `${sageGreen}40`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (glyph.discovered) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(47, 73, 61, 0.06)';
                        e.currentTarget.style.borderColor = `${sageGreen}20`;
                      }
                    }}
                  >
                    {/* Sacred geometry watermark */}
                    <div 
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: glyph.discovered ? 0.03 : 0.01,
                        pointerEvents: 'none'
                      }}
                    >
                      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                        <defs>
                          <pattern id={`cardGeo-${glyph.id}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                            <circle cx="30" cy="30" r="20" stroke={sageGreen} strokeWidth="0.3" fill="none" />
                            <path d="M 10 30 L 50 30 M 30 10 L 30 50" stroke={sageGreen} strokeWidth="0.2" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#cardGeo-${glyph.id})`} />
                      </svg>
                    </div>

                    {/* Glyph illustration */}
                    <div 
                      style={{
                        width: '100%',
                        height: '240px',
                        margin: '0 auto 32px',
                        color: sageGreen,
                        opacity: glyph.discovered ? 0.9 : 0.2,
                        position: 'relative'
                      }}
                    >
                      {glyph.discovered ? (
                        glyph.component
                      ) : (
                        // Locked state - question mark silhouette
                        <div 
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-serif)',
                            fontSize: '80px',
                            color: sageGreen,
                            opacity: 0.1
                          }}
                        >
                          ?
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '24px',
                        fontWeight: '400',
                        letterSpacing: '0.01em',
                        color: sageGreen,
                        marginBottom: '8px',
                        lineHeight: '1.3',
                        opacity: glyph.discovered ? 1 : 0.3
                      }}
                    >
                      {glyph.discovered ? glyph.title : '???'}
                    </h3>

                    {/* Category */}
                    <p 
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '9px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: antiqueGold,
                        marginBottom: '20px',
                        fontWeight: '500'
                      }}
                    >
                      {glyph.discovered ? glyph.category : 'Non découvert'}
                    </p>

                    {/* Metadata */}
                    {glyph.discovered && (
                      <div 
                        style={{
                          paddingTop: '20px',
                          borderTop: `0.5px solid ${sageGreen}20`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div 
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '9px',
                            color: antiqueDark,
                            opacity: 0.5,
                            textAlign: 'left'
                          }}
                        >
                          {glyph.year}
                        </div>

                        <div 
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '9px',
                            letterSpacing: '0.08em',
                            color: sageGreen,
                            opacity: 0.6,
                            border: `0.5px solid ${sageGreen}30`,
                            padding: '4px 8px',
                            borderRadius: '2px'
                          }}
                        >
                          {glyph.rarity}
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* GLYPH DETAIL VIEW */}
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {/* Back to collection */}
              <button
                onClick={() => setSelectedGlyph(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: antiqueDark,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: 0.4,
                  transition: 'opacity 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
              >
                ‹ Collection complète
              </button>

              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '48px',
                  marginBottom: '48px'
                }}
              >
                {/* LEFT: Glyph large view */}
                <div 
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${sageGreen}15`,
                    padding: '64px 48px',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  {/* Sacred geometry guides */}
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0.04,
                      pointerEvents: 'none'
                    }}
                  >
                    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                      <line x1="50%" y1="0" x2="50%" y2="100%" stroke={sageGreen} strokeWidth="0.5" strokeDasharray="4,8" />
                      <line x1="0" y1="50%" x2="100%" y2="50%" stroke={sageGreen} strokeWidth="0.5" strokeDasharray="4,8" />
                      <circle cx="50%" cy="50%" r="40%" stroke={sageGreen} strokeWidth="0.3" fill="none" />
                    </svg>
                  </div>

                  <div 
                    style={{
                      width: '100%',
                      height: '400px',
                      color: sageGreen,
                      margin: '0 auto'
                    }}
                  >
                    {selectedGlyphData?.component}
                  </div>

                  {/* Catalog label */}
                  <div 
                    style={{
                      marginTop: '32px',
                      paddingTop: '24px',
                      borderTop: `0.5px solid ${sageGreen}20`,
                      fontFamily: 'var(--font-sans)',
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                      color: antiqueDark,
                      opacity: 0.4
                    }}
                  >
                    GLYPHE {String(glyphs.findIndex(g => g.id === selectedGlyph) + 1).padStart(2, '0')} / {glyphs.length}
                  </div>
                </div>

                {/* RIGHT: Metadata */}
                <div>
                  {/* Category badge */}
                  <div 
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '9px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: antiqueGold,
                      border: `0.5px solid ${antiqueGold}60`,
                      padding: '6px 12px',
                      marginBottom: '20px',
                      borderRadius: '2px'
                    }}
                  >
                    {selectedGlyphData?.category}
                  </div>

                  {/* Title */}
                  <h1 
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '42px',
                      fontWeight: '400',
                      letterSpacing: '0.01em',
                      color: sageGreen,
                      marginBottom: '16px',
                      lineHeight: '1.2'
                    }}
                  >
                    {selectedGlyphData?.title}
                  </h1>

                  {/* Year & Arrondissement */}
                  <div 
                    style={{
                      display: 'flex',
                      gap: '24px',
                      marginBottom: '32px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      color: antiqueDark,
                      opacity: 0.6
                    }}
                  >
                    <div>
                      <span style={{ opacity: 0.5, marginRight: '8px' }}>Année:</span>
                      {selectedGlyphData?.year}
                    </div>
                    <div>
                      <span style={{ opacity: 0.5, marginRight: '8px' }}>Localisation:</span>
                      {selectedGlyphData?.arrondissement}
                    </div>
                  </div>

                  {/* Description */}
                  <p 
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '16px',
                      lineHeight: '1.9',
                      color: '#1A1A1A',
                      marginBottom: '32px',
                      letterSpacing: '0.005em'
                    }}
                  >
                    {selectedGlyphData?.description}
                  </p>

                  {/* Meaning section */}
                  <div 
                    style={{
                      background: `${sageGreen}05`,
                      border: `0.5px solid ${sageGreen}15`,
                      padding: '24px',
                      marginBottom: '32px'
                    }}
                  >
                    <div 
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '9px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: sageGreen,
                        marginBottom: '12px',
                        opacity: 0.7
                      }}
                    >
                      Signification
                    </div>
                    <p 
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '14px',
                        lineHeight: '1.8',
                        color: antiqueDark,
                        fontStyle: 'italic',
                        opacity: 0.8
                      }}
                    >
                      {selectedGlyphData?.meaning}
                    </p>
                  </div>

                  {/* Locations */}
                  <div>
                    <div 
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '9px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: antiqueDark,
                        marginBottom: '16px',
                        opacity: 0.5
                      }}
                    >
                      Où observer ce glyphe
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedGlyphData?.locations.map((location, i) => (
                        <div 
                          key={i}
                          style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '14px',
                            color: sageGreen,
                            paddingLeft: '16px',
                            borderLeft: `1px solid ${sageGreen}30`,
                            lineHeight: '1.6'
                          }}
                        >
                          {location}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 1200px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"],
          div[style*="grid-template-columns: repeat(2, 1fr)"],
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
