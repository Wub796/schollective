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
      <circle cx="50" cy="50" r="46" fill="#0f172a" />

      {/* Ice blue outer ring */}
      <circle cx="50" cy="50" r="46" stroke="#818cf8" strokeWidth="3.5" fill="none" />

      {/* Graduation cap — Main ocean blue (#4f46e5) */}
      <polygon
        points="50,18 86,36 50,54 14,36"
        fill="#4f46e5"
      />

      {/* Cap brim / body */}
      <path
        d="M28 43 L28 60 Q50 72 72 60 L72 43"
        fill="#4f46e5"
        opacity="0.9"
      />

      {/* Tassel stem (Indigo mid-tone #6366f1) */}
      <line x1="86" y1="36" x2="86" y2="52" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />

      {/* Tassel ball (Indigo mid-tone #6366f1) */}
      <circle cx="86" cy="55" r="3.5" fill="#6366f1" />

      {/* Tassel fringe (Indigo mid-tone #6366f1) */}
      <line x1="83" y1="58" x2="81" y2="68" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
      <line x1="86" y1="58" x2="86" y2="69" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
      <line x1="89" y1="58" x2="91" y2="68" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}
