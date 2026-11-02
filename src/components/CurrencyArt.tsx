import React from 'react';

/**
 * Distinct Art for the 3 In-Game Currencies:
 * 1. Arcade Match Credits (Plasma Core / Cyan-Emerald Pulsing Energy Cell)
 * 2. Shop Telegram Stars (Golden Celestial Star XTR)
 * 3. In-Game Crypto Tokens (Hexagonal Forged Cyber Medallion)
 */

interface IconProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

// 1. Multiplayer Arcade Match Credit: Glowing Cybernetic Star-Core / Plasma Cell
export const ArcadeCreditArt: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] ${className}`}
    >
      <defs>
        <linearGradient id="plasmaGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <filter id="coreGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer Hex Energy Ring */}
      <polygon
        points="12,2 21,7 21,17 12,22 3,17 3,7"
        stroke="url(#plasmaGrad)"
        strokeWidth="1.8"
        fill="#082f49"
        fillOpacity="0.8"
      />
      {/* Circuit Nodes */}
      <circle cx="12" cy="4" r="1" fill="#38bdf8" />
      <circle cx="20" cy="12" r="1" fill="#38bdf8" />
      <circle cx="12" cy="20" r="1" fill="#34d399" />
      <circle cx="4" cy="12" r="1" fill="#34d399" />
      {/* Inner Plasma Core */}
      <path
        d="M13 3L6 13H12L11 21L18 11H12L13 3Z"
        fill="url(#plasmaGrad)"
        filter="url(#coreGlow)"
      />
    </svg>
  );
};

// 2. Shop Balance / Real-Currency: Golden Telegram Cosmic Star (XTR)
export const ShopStarArt: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] ${className}`}
    >
      <defs>
        <linearGradient id="starGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Celestial Star Halo */}
      <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
      {/* 5-Point Cosmic Telegram Star */}
      <path
        d="M12 2L14.9 8.26L21.8 9.27L16.8 14.14L18 21.02L12 17.77L6 21.02L7.2 14.14L2.2 9.27L9.1 8.26L12 2Z"
        fill="url(#starGrad)"
        stroke="#fef08a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Center Shine */}
      <polygon points="12,5 13.5,9.5 18,10.2 14.5,13.5 15.5,18 12,15.8" fill="#fff" opacity="0.4" />
    </svg>
  );
};

// 3. In-Game Earned Crypto Tokens: Hexagonal Forged Cyber Medallion
export const CryptoTokenArt: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] ${className}`}
    >
      <defs>
        <linearGradient id="medallionRim" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
        <linearGradient id="medallionInlay" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14532d" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>
      {/* Outer Coin Body */}
      <circle cx="12" cy="12" r="10" fill="#78350f" stroke="url(#medallionRim)" strokeWidth="2" />
      {/* Inner Enamel Inlay */}
      <circle cx="12" cy="12" r="7.5" fill="url(#medallionInlay)" stroke="#eab308" strokeWidth="0.8" />
      {/* Crypto Cyber Rune 'C' with Blockchain Links */}
      <path
        d="M14.5 8.5C13.8 7.8 12.8 7.5 11.8 7.5C9.4 7.5 7.5 9.5 7.5 12C7.5 14.5 9.4 16.5 11.8 16.5C13 16.5 14 16 14.7 15.2M11 5V7M13 5V7M11 17V19M13 17V19"
        stroke="#fef08a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export interface CurrencyBadgeProps {
  type: 'arcade_credits' | 'telegram_stars' | 'crypto_tokens';
  amount: number | string;
  label?: string;
  onClick?: () => void;
  className?: string;
  showIconOnly?: boolean;
}

export const CurrencyBadge: React.FC<CurrencyBadgeProps> = ({
  type,
  amount,
  label,
  onClick,
  className = '',
  showIconOnly = false,
}) => {
  const formattedAmount = typeof amount === 'number' ? amount.toLocaleString() : amount;

  if (type === 'arcade_credits') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-emerald-950/80 border border-cyan-500/40 text-cyan-200 shadow-sm transition-all ${
          onClick ? 'cursor-pointer hover:border-cyan-400 hover:scale-105 active:scale-95' : ''
        } ${className}`}
        title="Multiplayer Arcade Fuel: 10 Credits deducted per word/debug attempt in arena matches"
      >
        <ArcadeCreditArt size={18} />
        {!showIconOnly && (
          <div className="flex items-baseline gap-1 font-mono">
            <span className="font-extrabold text-cyan-300 text-xs sm:text-sm tracking-tight">{formattedAmount}</span>
            <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider">{label || 'Credits'}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'telegram_stars') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-900/40 border border-amber-500/50 text-amber-200 shadow-sm transition-all ${
          onClick ? 'cursor-pointer hover:border-amber-400 hover:scale-105 active:scale-95' : ''
        } ${className}`}
        title="Telegram Stars (XTR): Real-currency premium balance to buy credits, passes, and academy seats"
      >
        <ShopStarArt size={18} />
        {!showIconOnly && (
          <div className="flex items-baseline gap-1 font-mono">
            <span className="font-extrabold text-amber-300 text-xs sm:text-sm tracking-tight">{formattedAmount}</span>
            <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">{label || 'Stars'}</span>
          </div>
        )}
      </div>
    );
  }

  // crypto_tokens
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/90 via-emerald-950/60 to-slate-900 border border-emerald-500/40 text-emerald-200 shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:border-emerald-400 hover:scale-105 active:scale-95' : ''
      } ${className}`}
      title="In-Game Crypto Tokens: Earned in combat, podium finishes & quests. Used in Cyber Arsenal & Base upgrades."
    >
      <CryptoTokenArt size={18} />
      {!showIconOnly && (
        <div className="flex items-baseline gap-1 font-mono">
          <span className="font-extrabold text-emerald-300 text-xs sm:text-sm tracking-tight">{formattedAmount}</span>
          <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">{label || 'Tokens'}</span>
        </div>
      )}
    </div>
  );
};
