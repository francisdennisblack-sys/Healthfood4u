"use client";

import { useEffect, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getDatabase, onValue, ref } from "firebase/database";
import { useLocalStorageState } from "./useLocalStorageState";
import { mergeProductReviews, normalizeProductReviews, saveProductReview, type ProductReview } from "./reviews";

const databaseUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
const storageKey = "healthfood4u_home_reviews";

function database() {
  if (!databaseUrl) throw new Error("Review database is not configured.");
  const app = getApps().find(app => app.name === "product-reviews")
    ?? initializeApp({ databaseURL: databaseUrl }, "product-reviews");
  return getDatabase(app);
}

function parseReviews(value: string) {
  return normalizeProductReviews(JSON.parse(value));
}

export function useProductReviews() {
  const [reviews, setReviews] = useLocalStorageState<ProductReview[]>(storageKey, [], parseReviews);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith("healthfood4u_reviews_")) continue;
      try {
        const existing = normalizeProductReviews(JSON.parse(localStorage.getItem(key) ?? "[]"), key.slice("healthfood4u_reviews_".length));
        if (existing.length) setReviews(current => mergeProductReviews(current, existing));
      } catch {
        continue;
      }
    }
    if (!databaseUrl) return;
    return onValue(ref(database(), "reviews"), snapshot => {
      const incoming = normalizeProductReviews(snapshot.val());
      setReviews(incoming);
      setSyncError("");
    }, () => setSyncError("Live reviews are unavailable. Showing reviews saved on this device."));
  }, [setReviews]);

  const submitReview = async (review: ProductReview) => {
    try {
      await saveProductReview(databaseUrl, review);
      setReviews(current => mergeProductReviews(current, [review]));
      setSyncError("");
    } catch {
      const message = "Your review could not be saved to the database. Your text is still here; please try submitting again.";
      setSyncError(message);
      throw new Error(message);
    }
  };

  return { reviews, submitReview, syncError };
}