"use client";

import { useState, useRef, useEffect } from "react";
import { useLocalStorageState } from "@/lib/useLocalStorageState";

const consentStorageKey = "healthfood4u_privacy_consent";

type PrivacyConsent = { version: 1; savedAt: string };

function parsePrivacyConsent(value: string): PrivacyConsent | null {
  try {
    const parsed = JSON.parse(value);
    return parsed?.version === 1 && typeof parsed.savedAt === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export default function GlobalPrivacyModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [consent, setConsent] = useLocalStorageState<PrivacyConsent | null>(consentStorageKey, null, parsePrivacyConsent);
  const videoRef = useRef<HTMLVideoElement>(null);
  const consentDialogRef = useRef<HTMLDialogElement>(null);
  const showConsent = !isOpen && consent?.version !== 1;

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

  useEffect(() => {
    const dialog = consentDialogRef.current;
    if (showConsent && dialog && !dialog.open) dialog.showModal();
    if (!showConsent && dialog?.open) dialog.close();
  }, [showConsent]);

  function acceptConsent() {
    try {
      setConsent({ version: 1, savedAt: new Date().toISOString() });
      setSaveError("");
    } catch {
      setSaveError("Your preference could not be saved. Check your browser storage settings and try again.");
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="privacy-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="privacy-modal privacy-video-modal"
            onClick={() => setIsOpen(false)}
          >
            <button
              type="button"
              className="privacy-video-close"
              aria-label="Close video"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              controls={false}
              preload="auto"
              src="/tiding-advertisement.mp4"
              onClick={() => setIsOpen(false)}
              onEnded={() => setIsOpen(false)}
              onError={() => setIsOpen(false)}
              className="privacy-video"
            />
          </div>
        </div>
      )}
      <dialog
        ref={consentDialogRef}
        className="privacy-consent-dialog"
        aria-labelledby="privacy-consent-title"
        onCancel={(event) => event.preventDefault()}
      >
        <section className="privacy-consent-banner">
          <div className="privacy-consent-copy">
            <h2 id="privacy-consent-title">Privacy Promise</h2>
            <p>
              We use essential browser storage to keep your cart, reviews, and display preferences working. We do not currently use analytics cookies or advertising trackers.
            </p>
            {settingsOpen && (
              <div className="privacy-consent-settings" aria-label="Cookie settings">
                <h3>Essential browser storage <span>Always active</span></h3>
                <p>Required for cart contents, product reviews, and saved display preferences on this device.</p>
                <h3>Analytics and advertising</h3>
                <p>These optional trackers are not active on this site.</p>
              </div>
            )}
            {saveError && <p className="privacy-consent-error" role="alert">{saveError}</p>}
          </div>
          <div className="privacy-consent-actions">
            <button
              type="button"
              className="privacy-settings-button"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((open) => !open)}
            >
              {settingsOpen ? "Close Settings" : "Cookie Settings"}
            </button>
            <button type="button" className="privacy-accept-button" onClick={acceptConsent}>Accept</button>
          </div>
        </section>
      </dialog>
    </>
  );
}
