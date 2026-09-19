"use client";

import { useEffect, useState } from "react";

export default function GlobalPrivacyModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="privacy-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="privacy-modal privacy-video-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <video
          autoPlay
          muted
          playsInline
          loop={false}
          preload="auto"
          src="/tiding-advertisement.mp4"
          onEnded={() => setIsOpen(false)}
          onError={() => setIsOpen(false)}
          className="privacy-video"
        />
      </div>
    </div>
  );
}
