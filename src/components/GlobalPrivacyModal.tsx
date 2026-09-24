"use client";

import { useState } from "react";

export default function GlobalPrivacyModal() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      className="privacy-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={() => setIsOpen(false)}
    >
      <div className="privacy-modal privacy-video-modal">
        <video
          autoPlay
          muted
          playsInline
          loop={false}
          preload="auto"
          src="/tiding-advertisement.mp4"
          onClick={(event) => event.stopPropagation()}
          onEnded={() => setIsOpen(false)}
          onError={() => setIsOpen(false)}
          className="privacy-video"
        />
      </div>
    </div>
  );
}
