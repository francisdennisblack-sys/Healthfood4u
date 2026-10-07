"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useProductReviews } from "@/lib/useProductReviews";
import ProductReviewDialog from "@/components/ProductReviewDialog";

import { calculateAverageRating, getProductReviews } from "@/lib/reviews";

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
const REVIEW_PRODUCT_STORAGE_KEY = "healthfood4u_open_review_product";
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
  }));
}

export default function ProductDetails({ product, slug }: { product: Product; slug: string }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const { reviews: allReviews, submitReview, deleteReview } = useProductReviews();
  const [reviewOpen, setReviewOpen] = useState(false);
  const reviews = getProductReviews(allReviews, slug);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const reviewTouchStart = useRef<{ x: number; y: number } | null>(null);
  const reviewIndex = reviews.length ? activeReviewIndex % reviews.length : 0;
  const activeReview = reviews[reviewIndex];
  const reviewHold = useRef<{ timer: number; pointerId: number; x: number; y: number } | null>(null);
  const reviewDeletePending = useRef(false);
  const [reviewDeleteMessage, setReviewDeleteMessage] = useState("");
  const productRating = calculateAverageRating(reviews);
  const slides = useMemo(() => getSlides(product), [product]);
  const isScoprio = product.name === "Scoprio";

  const cancelReviewHold = useCallback(() => {
    if (reviewHold.current) window.clearTimeout(reviewHold.current.timer);
    reviewHold.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("blur", cancelReviewHold);
    document.addEventListener("visibilitychange", cancelReviewHold);
    return () => {
      cancelReviewHold();
      window.removeEventListener("blur", cancelReviewHold);
      document.removeEventListener("visibilitychange", cancelReviewHold);
    };
  }, [activeReview, slug, cancelReviewHold]);

  useEffect(() => {
    if (isScoprio || window.sessionStorage.getItem(REVIEW_PRODUCT_STORAGE_KEY) !== slug) return;
    const frame = window.requestAnimationFrame(() => {
      window.sessionStorage.removeItem(REVIEW_PRODUCT_STORAGE_KEY);
      setReviewOpen(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isScoprio, slug]);

  const changeReview = (direction: number) => {
    cancelReviewHold();
    if (reviews.length < 2) return;
    setActiveReviewIndex((current) => (current % reviews.length + direction + reviews.length) % reviews.length);
  };

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
                <div key={slide.id} className="product-gallery-slide">
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
          {!isScoprio && (
            <>
              <h1>{product.name}</h1>
              <div className="product-price-cart-row">
                <div className="price-line product-price-line">
                  <strong>{product.price}</strong>
                </div>

                <div className="rating-line product-rating-line">
                  <span className="rating-text" aria-live="polite">{productRating.toFixed(1)} / 5 ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
                  <button type="button" className="product-primary-button product-review-button" aria-haspopup="dialog" onClick={() => setReviewOpen(true)}>
                    Leave a review
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="product-detail-cta-row">
            {!isScoprio && (
              <button className="product-primary-button" aria-label={`Add ${product.name} to cart`} onClick={addToCart}>
                <span>Add to cart</span>
                <svg className="button-cart-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.5 5.5h2l2.2 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8l1.6-7.2H6.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9.4" cy="18.4" r="1.9" fill="currentColor" />
                  <circle cx="17.2" cy="18.4" r="1.9" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>

          {!isScoprio && (
            <section className="product-reviews" aria-label="Customer Reviews">
              {activeReview && (
                <>
                  <div
                    className="product-review-viewport"
                    aria-live="polite"
                    aria-atomic="true"
                    onScroll={cancelReviewHold}
                    onTouchStart={(event) => {
                      const touch = event.touches[0];
                      reviewTouchStart.current = { x: touch.clientX, y: touch.clientY };
                    }}
                    onTouchCancel={() => {
                      cancelReviewHold();
                      reviewTouchStart.current = null;
                    }}
                    onTouchEnd={(event) => {
                      cancelReviewHold();
                      const start = reviewTouchStart.current;
                      reviewTouchStart.current = null;
                      if (!start) return;
                      const touch = event.changedTouches[0];
                      const deltaX = touch.clientX - start.x;
                      const deltaY = touch.clientY - start.y;
                      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
                        changeReview(deltaX < 0 ? 1 : -1);
                      }
                    }}
                  >
                    <article
                      className="product-review-entry"
                      key={activeReview.id}
                      title="Hold for 5 seconds to delete this review"
                      onPointerDown={(event) => {
                        cancelReviewHold();
                        if (event.button !== 0 || !event.isPrimary || reviewDeletePending.current) return;
                        setReviewDeleteMessage("");
                        reviewHold.current = {
                          pointerId: event.pointerId,
                          x: event.clientX,
                          y: event.clientY,
                          timer: window.setTimeout(() => {
                            reviewHold.current = null;
                            reviewTouchStart.current = null;
                            reviewDeletePending.current = true;
                            setReviewDeleteMessage("Deleting review...");
                            void deleteReview(activeReview)
                              .then(() => setReviewDeleteMessage("Review deleted."))
                              .catch((error: unknown) => setReviewDeleteMessage(error instanceof Error ? error.message : "Review could not be deleted."))
                              .finally(() => { reviewDeletePending.current = false; });
                          }, 5000),
                        };
                      }}
                      onPointerMove={(event) => {
                        const hold = reviewHold.current;
                        if (hold && (event.pointerId !== hold.pointerId || Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > 10)) {
                          cancelReviewHold();
                        }
                      }}
                      onPointerUp={cancelReviewHold}
                      onPointerLeave={cancelReviewHold}
                      onPointerCancel={cancelReviewHold}
                      onLostPointerCapture={cancelReviewHold}
                      onContextMenu={(event) => event.preventDefault()}
                    >
                      <div className="product-review-stars" aria-label={`${activeReview.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} size={16} aria-hidden="true" fill={index < Math.round(activeReview.rating) ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <p>{activeReview.comment}</p>
                      <span className="product-review-author">{activeReview.reviewer}</span>
                    </article>
                  </div>
                  {reviews.length > 1 && (
                    <div className="product-review-navigation" aria-label="Review navigation">
                      <button type="button" aria-label="Previous review" title="Previous review" onClick={() => changeReview(-1)}>
                        <ChevronLeft size={20} aria-hidden="true" />
                      </button>
                      <span>{reviewIndex + 1} / {reviews.length}</span>
                      <button type="button" aria-label="Next review" title="Next review" onClick={() => changeReview(1)}>
                        <ChevronRight size={20} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </>
              )}
              {reviewDeleteMessage && <p role="status">{reviewDeleteMessage}</p>}
            </section>
          )}

          {isScoprio && <p className="lead profile-description">{product.description}</p>}

        </div>
      </div>
      {reviewOpen && !isScoprio && (
        <ProductReviewDialog key={product.name} productName={product.name} submitReview={submitReview} onClose={() => setReviewOpen(false)} />
      )}
    </main>
  );
}
