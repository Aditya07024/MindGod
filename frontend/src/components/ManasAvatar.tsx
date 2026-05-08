type Props = { size?: number; className?: string };

export function ManasAvatar({ size = 40, className = '' }: Props) {
  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      aria-label="Manas"
    >
      <svg viewBox="0 0 64 64" width={size} height={size} role="img">
        <defs>
          <radialGradient id="manas-bg" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="oklch(0.65 0.08 180)" />
            <stop offset="100%" stopColor="oklch(0.32 0.06 180)" />
          </radialGradient>
          <radialGradient id="manas-glow" cx="50%" cy="55%" r="40%">
            <stop offset="0%" stopColor="oklch(0.95 0.05 60)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="oklch(0.95 0.05 60)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="32" fill="url(#manas-bg)" />
        <circle cx="32" cy="36" r="22" fill="url(#manas-glow)" />
        {/* eyes */}
        <circle cx="24" cy="28" r="2.4" fill="oklch(0.99 0.005 90)" />
        <circle cx="40" cy="28" r="2.4" fill="oklch(0.99 0.005 90)" />
        {/* gentle smile */}
        <path
          d="M22 40 Q32 48 42 40"
          fill="none"
          stroke="oklch(0.95 0.05 60)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
