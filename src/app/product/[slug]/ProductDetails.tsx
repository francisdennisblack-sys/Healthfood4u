"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocalStorageState } from "@/lib/useLocalStorageState";

import { calculateAverageRating, emptyReviewState, normalizeReviewEntries, type ReviewEntry } from "@/lib/reviews";

type Product = {
  name: string;
  icon: string;
  image?: string;
  price: string;
  rating: number;
  description: string;
  details: string[];
};

const STORAGE_KEY = "healthfood4u_cart";
const firebaseDatabaseUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

function parseStoredReviews(stored: string): ReviewEntry[] {
  return normalizeReviewEntries(JSON.parse(stored));
}

const galleryLabels = [
  "Fresh pick",
  "Daily prep",
  "On the go",
  "Wellness favorite",
];

function getSlides(product: Product) {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `${product.name}-${index}`,
    image: product.image || "/assets/healthfood/product-01.svg",
    label: galleryLabels[index],
    accent: "#ffffff",
  }));
}

export default function ProductDetails({ product, slug }: { product: Product; slug: string }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState(emptyReviewState);
  const localReviewKey = `healthfood4u_reviews_${slug}`;
  const [reviews, setReviews] = useLocalStorageState<ReviewEntry[]>(localReviewKey, [], parseStoredReviews);
  const productRating = calculateAverageRating(reviews);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const slides = useMemo(() => getSlides(product), [product]);
  const isScoprio = product.name === "Scoprio";

  useEffect(() => {
    if (!slug || !firebaseDatabaseUrl) return;
    let cancelled = false;

    const hydrateReviewState = (nextReviews: ReviewEntry[]) => {
      if (!cancelled) setReviews(nextReviews);
    };

    const loadReviews = async () => {
      const fallbackReviews = (() => {
        if (typeof window === "undefined") return [] as ReviewEntry[];

        try {
          const stored = window.localStorage.getItem(localReviewKey);
          if (!stored) return [] as ReviewEntry[];
          return normalizeReviewEntries(JSON.parse(stored));
        } catch {
          return [] as ReviewEntry[];
        }
      })();

      try {
        const response = await fetch(`${firebaseDatabaseUrl}/reviews/${slug}.json`, { cache: "no-store" });
        if (response.ok) {
          const payload = await response.json();
          const nextReviews = normalizeReviewEntries(payload);
          hydrateReviewState(nextReviews.length > 0 ? nextReviews : fallbackReviews);

          await fetch(`${firebaseDatabaseUrl}/products/${slug}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: product.name,
              image: product.image,
              price: product.price,
              rating: calculateAverageRating(nextReviews.length > 0 ? nextReviews : fallbackReviews),
              reviews: (nextReviews.length > 0 ? nextReviews : fallbackReviews).length,
              description: product.description,
            }),
          });
          return;
        }

        hydrateReviewState(fallbackReviews);
      } catch (error) {
        console.warn("Could not load live product reviews from Firebase:", error);
        hydrateReviewState(fallbackReviews);
      }
    };
    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [slug, localReviewKey, product.name, product.image, product.price, product.description, setReviews]);

  const nextSlide = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const previousSlide = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;

    const delta = event.changedTouches[0].clientX - touchStartX;
    if (delta > 40) previousSlide();
    if (delta < -40) nextSlide();
    setTouchStartX(null);
  };

  const addToCart = () => {
    const existing = (() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored ? (JSON.parse(stored) as Array<{ name: string; price: string; icon: string; image?: string; quantity: number }>) : [];
      } catch {
        return [];
      }
    })();

    const nextCart = [...existing];
    const index = nextCart.findIndex((item) => item.name === product.name);
    const productImage = product.image || "/assets/healthfood/product-01.jpg";

    if (index >= 0) {
      nextCart[index].quantity += 1;
      nextCart[index].image = nextCart[index].image || productImage;
    } else {
      nextCart.push({
        name: product.name,
        price: product.price,
        icon: product.icon,
        image: productImage,
        quantity: 1,
      });
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCart));
    router.push("/cart");
  };

  const syncReviewState = async (nextReviews: ReviewEntry[]) => {
    const average = calculateAverageRating(nextReviews);
    setReviews(nextReviews);

    if (!firebaseDatabaseUrl || !slug) return;

    try {
      await fetch(`${firebaseDatabaseUrl}/reviews/${slug}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextReviews),
      });

      await fetch(`${firebaseDatabaseUrl}/products/${slug}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          image: product.image,
          price: product.price,
          rating: average,
          reviews: nextReviews.length,
          description: product.description,
        }),
      });
    } catch (error) {
      console.warn("Could not sync reviews to Firebase; local fallback was preserved.", error);
    }
  };

  const handleReviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reviewForm.name.trim() || !reviewForm.review.trim()) {
      return;
    }

    const trimmedName = reviewForm.name.trim();
    const trimmedReview = reviewForm.review.trim();
    const parsedRating = Number(reviewForm.rating) || 5;

    const nextReview: ReviewEntry = {
      id: `${Date.now()}`,
      name: trimmedName,
      rating: parsedRating,
      review: trimmedReview,
      createdAt: new Date().toISOString(),
      photo: reviewForm.photo || undefined,
      video: reviewForm.video || undefined,
    };

    const nextReviews = [...reviews, nextReview];

    try {
      await syncReviewState(nextReviews);
      setReviewSubmitted(true);
      setReviewForm(emptyReviewState());
    } catch (error) {
      console.error("Could not save review to Firebase:", error);
      setReviewSubmitted(true);
      setReviewForm(emptyReviewState());
    }
  };

  const handleDeleteReview = async (id?: string) => {
    if (!id) return;

    const nextReviews = reviews.filter((review) => review.id !== id);
    await syncReviewState(nextReviews);
  };

  return (
    <main className="page-shell product-page-shell">
      <div className="product-detail-card" onClick={(event) => event.stopPropagation()}>
        <div className="product-gallery-wrap">
          <div
            className="product-detail-visual"
            aria-label={`${product.name} image gallery`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="product-gallery-track"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {slides.map((slide) => (
                <div key={slide.id} className="product-gallery-slide" style={{ background: slide.accent }}>
                  <img src={slide.image} alt={slide.label} className="product-gallery-image" />
                </div>
              ))}
            </div>
          </div>

          <div className="product-gallery-controls" aria-label="Product image navigation">
            <div className="gallery-dots" aria-label="Slide position">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.id}-dot`}
                  type="button"
                  className={index === activeIndex ? "gallery-dot active" : "gallery-dot"}
                  aria-label={`View slide ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="product-detail-copy">
          <p className="eyebrow product-kicker">Fresh essentials</p>

          {!isScoprio && (
            <>
              <h1>{product.name}</h1>
              <div className="product-price-cart-row">
                <div className="price-line product-price-line">
                  <strong>{product.price}</strong>
                </div>

                <div className="rating-line product-rating-line">
                  <span className="rating-text">{productRating === 0 ? "0 stars" : `${productRating.toFixed(1)} stars`}</span>
                </div>
              </div>
            </>
          )}

          <div className="product-detail-cta-row">
            {!isScoprio && (
              <button className="product-primary-button" aria-label={`Add ${product.name} to cart`} onClick={addToCart}>
                Add to bag
              </button>
            )}
          </div>

          <p className={isScoprio ? "lead product-lead profile-description" : "lead product-lead"}>{product.description}</p>

          {!isScoprio && product.details?.length > 0 && (
            <div className="product-spec-block" aria-label="Product details">
              <h3>Details</h3>
              <ul className="product-attribute-list">
                {product.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          )}

          {!isScoprio && reviews.length > 0 && (
            <div className="existing-reviews" aria-label="Existing product reviews">
              <div className="mini-review-panel">
                {reviews.slice(0, 3).map((review) => (
                  <article key={review.id ?? `${review.createdAt}-${review.name}`} className="mini-review-item">
                    <div className="mini-review-head">
                      <div className="review-header">
                        <strong>{review.name}</strong>
                        <span className="review-tag">{review.rating} stars</span>
                      </div>
                    </div>
                    <p>“{review.review}”</p>
                    <button
                      type="button"
                      className="secondary-review-button small-delete-button"
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      Delete review
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
