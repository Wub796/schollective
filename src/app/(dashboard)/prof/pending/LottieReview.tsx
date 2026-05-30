"use client";

import React from "react";
import { motion } from "framer-motion";

export function LottieReview() {
  return (
    <div style={{
      position: "relative",
      width: "12rem",
      height: "12rem",
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      filter: "drop-shadow(0 0 15px rgba(212, 146, 42, 0.15))",
    }}>
      {/* Outer dashed ring rotating */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        style={{
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          border: "2px dashed rgba(61, 122, 106, 0.35)",
          position: "absolute",
        }}
      />
      {/* Pulsing center dot */}
      <motion.div
        animate={{ scale: [1, 1.22, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "rgba(212, 146, 42, 0.9)",
          position: "absolute",
          boxShadow: "0 0 12px rgba(212, 146, 42, 0.45)",
        }}
      />
    </div>
  );
}
