"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useProductReviews } from "@/lib/useProductReviews";

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
  const { reviews: allReviews } = useProductReviews();
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
          <p className="eyebrow product-kicker">Fresh essentials</p>

          {!isScoprio && (
            <>
              <h1>{product.name}</h1>
              <div className="product-price-cart-row">
                <div className="price-line product-price-line">
                  <strong>{product.price}</strong>
                </div>

                <div className="rating-line product-rating-line">
                  <span className="rating-text" aria-live="polite">{productRating.toFixed(1)} / 5 ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
                </div>
              </div>
            </>
          )}

          <div className="product-detail-cta-row">
            {!isScoprio && (
              <button className="product-primary-button" aria-label={`Add ${product.name} to cart`} onClick={addToCart}>
                Add to cart
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

        </div>
      </div>
    </main>
  );
}
