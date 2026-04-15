interface SectionDividerProps {
  variant?: "wave-up" | "wave-down";
  colorFrom?: string;
  colorTo?: string;
  className?: string;
}

export function SectionDivider({
  variant = "wave-down",
  colorFrom = "var(--primary)",
  colorTo = "var(--teal)",
  className = "",
}: SectionDividerProps) {
  const gradientId = `divider-grad-${variant}-${colorFrom.replace(/[^a-zA-Z0-9]/g, "")}`;
  const flip = variant === "wave-up" ? "rotate(180deg)" : undefined;

  return (
    <div
      className={`w-full overflow-hidden leading-[0] ${className}`}
      aria-hidden="true"
      style={{ transform: flip }}
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="block w-full h-[clamp(40px,5vw,80px)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorFrom} stopOpacity="0.25" />
            <stop offset="50%" stopColor={colorTo} stopOpacity="0.18" />
            <stop offset="100%" stopColor={colorFrom} stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <path
          d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
          fill={`url(#${gradientId})`}
          className="animate-mesh-shift"
        />
        <path
          d="M0,50 C360,10 720,70 1080,30 C1260,10 1380,50 1440,50 L1440,80 L0,80 Z"
          fill={`url(#${gradientId})`}
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
