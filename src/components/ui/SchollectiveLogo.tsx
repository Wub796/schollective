/**
 * SchollectiveLogo — inline SVG logo mark
 * Transparent background, accent blue (var(--accent)) accents on dark navy circle.
 * No image file needed — zero artifacts, exact theme colors.
 */
export function SchollectiveLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Schollective logo"
    >
      {/* Deep contrast circle fill */}
      <circle cx="50" cy="50" r="46" fill="#141005" />

      {/* Ice blue outer ring */}
      <circle cx="50" cy="50" r="46" stroke="#A1C5D1" strokeWidth="3.5" fill="none" />

      {/* Graduation cap — Main ocean blue (#008CBB) */}
      <polygon
        points="50,18 86,36 50,54 14,36"
        fill="#008CBB"
      />

      {/* Cap brim / body */}
      <path
        d="M28 43 L28 60 Q50 72 72 60 L72 43"
        fill="#008CBB"
        opacity="0.9"
      />

      {/* Tassel stem (Gold #FFC20F) */}
      <line x1="86" y1="36" x2="86" y2="52" stroke="#FFC20F" strokeWidth="2.5" strokeLinecap="round" />

      {/* Tassel ball (Gold #FFC20F) */}
      <circle cx="86" cy="55" r="3.5" fill="#FFC20F" />

      {/* Tassel fringe (Gold #FFC20F) */}
      <line x1="83" y1="58" x2="81" y2="68" stroke="#FFC20F" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
      <line x1="86" y1="58" x2="86" y2="69" stroke="#FFC20F" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
      <line x1="89" y1="58" x2="91" y2="68" stroke="#FFC20F" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}
