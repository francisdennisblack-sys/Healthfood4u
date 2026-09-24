"use client";

import { useState, useRef, useEffect } from "react";

export default function GlobalPrivacyModal() {
  const [isOpen, setIsOpen] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => setIsOpen(false);
    const handleError = () => setIsOpen(false);

    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
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
        onClick={(event) => {
          if (event.target !== videoRef.current) {
            setIsOpen(false);
          }
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          controls={false}
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
