"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
  const { reviews: allReviews, submitReview } = useProductReviews();
  const [reviewOpen, setReviewOpen] = useState(false);
  const reviews = getProductReviews(allReviews, slug);
  const productRating = calculateAverageRating(reviews);
  const slides = useMemo(() => getSlides(product), [product]);
  const isScoprio = product.name === "Scoprio";

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

          {isScoprio && <p className="lead profile-description">{product.description}</p>}

        </div>
      </div>
      {reviewOpen && !isScoprio && (
        <ProductReviewDialog key={product.name} productName={product.name} submitReview={submitReview} onClose={() => setReviewOpen(false)} />
      )}
    </main>
  );
}
