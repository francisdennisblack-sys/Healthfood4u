"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ProductReview } from "@/lib/reviews";

export default function ProductReviewDialog({ productName, submitReview, onClose }: {
  productName: string;
  submitReview: (review: ProductReview) => Promise<void>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reviewer, setReviewer] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const busy = status === "sending" || status === "success";

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    nameRef.current?.focus();
    return () => {
      if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
      dialog?.close();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = reviewer.trim();
    const text = comment.trim();
    if (busy || !name || !text) return;

    setStatus("sending");
    setError("");
    try {
      await submitReview({
        id: crypto.randomUUID(),
        productName,
        name,
        reviewer: name,
        rating,
        review: text,
        comment: text,
        createdAt: new Date().toISOString(),
      });
      if (!dialogRef.current?.isConnected) return;
      setStatus("success");
      closeTimerRef.current = setTimeout(onClose, 500);
    } catch (error) {
      if (!dialogRef.current?.isConnected) return;
      setStatus("error");
      setError(error instanceof Error ? error.message : "Your review could not be saved. Please try again.");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="panel-sheet product-review-dialog"
      aria-label={`Review ${productName}`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        event.stopPropagation();
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <button type="button" className="panel-close" aria-label="Close review form" onClick={onClose}>&times;</button>
      <div className="panel-content review-panel-content">
        <form className="review-form" onSubmit={handleSubmit}>
          <label className="contact-field">
            <span>Rating</span>
            <select value={rating} onChange={(event) => setRating(Number(event.target.value))} disabled={busy}>
              {[5, 4, 3, 2, 1].map(score => <option key={score} value={score}>{score} star{score > 1 ? "s" : ""}</option>)}
            </select>
          </label>
          <label className="contact-field">
            <span>Your name</span>
            <input ref={nameRef} type="text" autoComplete="name" value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Your name" required maxLength={120} disabled={busy} />
          </label>
          <label className="contact-field">
            <span>Review</span>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What did you like about this product?" required maxLength={5000} disabled={busy} />
          </label>
          <button type="submit" className="primary-button review-submit-button" disabled={busy}>{status === "sending" ? "Saving..." : "Submit review"}</button>
          {status === "success" && <p role="status">Your review has been published.</p>}
          {error && <p role="alert">{error}</p>}
        </form>
      </div>
    </dialog>
  );
}