import React from "react";
import Image from "next/image";

interface SchollectiveLogoProps {
  size?: number;
  className?: string;
}

export function SchollectiveLogo({ size = 36, className = "" }: SchollectiveLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Schollective Logo"
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 select-none ${className}`}
      priority
    />
  );
}
