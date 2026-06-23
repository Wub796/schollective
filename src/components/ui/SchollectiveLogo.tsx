/**
 * SchollectiveLogo — inline SVG logo mark
 * Transparent background, indigo (var(--accent)) accents on dark navy circle.
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
      {/* Navy circle fill */}
      <circle cx="50" cy="50" r="46" fill="#0f1f4a" />

      {/* Indigo ring */}
      <circle cx="50" cy="50" r="46" stroke="var(--accent)" strokeWidth="3.5" fill="none" />

      {/* Graduation cap — mortarboard top (flat diamond), scaled up */}
      <polygon
        points="50,18 86,36 50,54 14,36"
        fill="var(--accent)"
      />

      {/* Cap brim / body — taller and wider */}
      <path
        d="M28 43 L28 60 Q50 72 72 60 L72 43"
        fill="var(--accent)"
        opacity="0.85"
      />

      {/* Tassel stem */}
      <line x1="86" y1="36" x2="86" y2="52" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Tassel ball */}
      <circle cx="86" cy="55" r="3" fill="var(--accent)" />

      {/* Tassel fringe */}
      <line x1="83" y1="58" x2="81" y2="68" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="86" y1="58" x2="86" y2="69" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="89" y1="58" x2="91" y2="68" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />


    </svg>
  );
}
