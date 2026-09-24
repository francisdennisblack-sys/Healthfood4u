"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { useProductReviews } from "@/lib/useProductReviews";
import { calculateAverageRating, getProductReviews, type ProductReview } from "@/lib/reviews";
import { productCorrections } from "@/lib/productCorrections";

import ProductDetails from "./product/[slug]/ProductDetails";

const firebaseDatabaseUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

type ProductItem = {
  name: string;
  icon: string;
  image: string;
  price: string;
  rating: number;
  description: string;
  reviews?: number;
  oldPrice?: string;
  tag?: string;
};

const productAssetMap: Record<string, string> = {
  "Organic Greens Box": "/assets/healthfood/product-05.jpg",
  "Citrus Glow Pack": "/assets/healthfood/product-02.jpg",
  "Protein Balance Kit": "/assets/healthfood/product-09.jpg",
  "Daily Gut Blend": "/assets/healthfood/product-04.jpg",
  "Two Avocados": "/assets/healthfood/product-01.jpg",
  "Berry Core Bites": "/assets/healthfood/product-06.jpg",
  "Nature Fuel Granola": "/assets/healthfood/product-08.jpg",
  "Lemon Mint Water": "/assets/healthfood/product-07.jpg",
  "Plant Protein Shake": "/assets/healthfood/product-03.svg",
  "Superfood Snack Duo": "/assets/healthfood/product-11.jpg",
  "Omega Seed Box": "/assets/healthfood/omega-seed-box-screenshot.png",
  "Feed Box": "/assets/healthfood/omega-seed-box-screenshot.png",
  "Celery Bundle": "/assets/healthfood/product-10.jpg",
  "Chicken Bell Pepper Stir Fry": "/assets/healthfood/chicken-bell-pepper-stir-fry-transparent.png",
  "Tofu Pho Bowl": "/assets/healthfood/tofu-pho-bowl.jpg",
  "Tomato Harvest Box": "/assets/healthfood/tomato-harvest.jpg",
  "8-Ounce Salmon with Lemon": "/assets/healthfood/citrus-garden-mix.jpg",
  "8 Ounce Steak": "/assets/healthfood/veggie-bowl.jpg",
  "Berry Nut Pack": "/assets/healthfood/berry-citrus-pack.jpg",
};

const topAssetMap = {
  primary: "/assets/healthfood/top-01.png",
  secondary: "/assets/healthfood/top-02.jpg",
};

const fallbackTopItems: ProductItem[] = [
  {
    name: "Organic Greens Box",
    icon: "🥬",
    image: "/assets/healthfood/product-05.jpg",
    price: "$26",
    rating: 0,
    tag: "Best Seller",
    description: "Fresh greens for easy meals and everyday energy.",
  },
  {
    name: "Omega Seed Box",
    icon: "🌱",
    image: "/assets/healthfood/omega-seed-box-screenshot.png",
    price: "$17",
    rating: 0,
    tag: "New",
    description: "A nutrient-rich, crunchy seed blend for smoothies, bowls, and easy everyday nourishment.",
  },
  {
    name: "Tofu Pho Bowl",
    icon: "🥢",
    image: "/assets/healthfood/tofu-pho-bowl.jpg",
    price: "$20",
    rating: 0,
    tag: "Popular",
    description: "A warm, comforting bowl with rich broth and fresh tofu flavor.",
  },
  {
    name: "Daily Gut Blend",
    icon: "🌿",
    image: "/assets/healthfood/product-04.jpg",
    price: "$22",
    oldPrice: "$28",
    rating: 0,
    tag: "Top Rated",
    description: "A gut-friendly blend for simple daily wellness.",
  },
];

const fallbackProducts: ProductItem[] = [
  { name: "Two Avocados", icon: "🥑", image: "/assets/healthfood/product-01.jpg", price: "$4", rating: 0, reviews: 0, description: "Simple avocado goodness for easy snacking." },
  { name: "Plant Protein Shake", icon: "🥤", image: "/assets/healthfood/product-03.svg", price: "$24", rating: 0, reviews: 0, description: "Smooth plant protein for quick meals and recovery." },
  { name: "Nature Fuel Granola", icon: "🌾", image: "/assets/healthfood/product-08.jpg", price: "$14", rating: 0, reviews: 0, description: "Crisp granola for breakfast and quick energy." },
  { name: "Lemon Mint Water", icon: "🍋", image: "/assets/healthfood/product-07.jpg", price: "$12", rating: 0, reviews: 0, description: "Refreshing lemon and mint hydration." },
  { name: "Berry Core Bites", icon: "🫐", image: "/assets/healthfood/product-06.jpg", price: "$19", rating: 0, reviews: 0, description: "Sweet berry bites for a light, satisfying snack." },
  { name: "Superfood Snack Duo", icon: "🥭", image: "/assets/healthfood/product-11.jpg", price: "$20", rating: 0, reviews: 0, description: "A simple combo of nutrient-rich snacks." },
  { name: "Celery Bundle", icon: "🥬", image: "/assets/healthfood/product-10.jpg", price: "$10", rating: 0, reviews: 0, description: "Crisp celery bundles for juicing, soups, and easy everyday freshness." },
];

const profileProduct: ProductItem = {
  name: "Scoprio",
  icon: "🍊",
  image: "/assets/healthfood/one-orange.png",
  price: "$1",
  rating: 0,
  reviews: 0,
  description: "After graduating with five AP's under my belt, I attended and left Colorado College before launching my first tech company, Tiding.",
};

const secondRowItems: ProductItem[] = [
  { name: "8 Ounce Steak", icon: "🥩", image: "/assets/healthfood/veggie-bowl.jpg", price: "$17", rating: 0, reviews: 0, description: "8 ounce steak with tomatoes and a savory glaze for a hearty, satisfying meal." },
  { name: "Tomato Harvest Box", icon: "🍅", image: "/assets/healthfood/tomato-harvest.jpg", price: "$15", rating: 0, reviews: 0, description: "Sun-ripened tomatoes and fresh produce for vibrant meals." },
  { name: "Berry Nut Pack", icon: "🫐", image: "/assets/healthfood/berry-citrus-pack.jpg", price: "$19", rating: 0, reviews: 0, description: "A colorful blend of berries and citrus for a fresh, feel-good boost." },
  { name: "Chicken Bell Pepper Stir Fry", icon: "🍲", image: "/assets/healthfood/chicken-bell-pepper-stir-fry-transparent.png", price: "$18", rating: 0, reviews: 0, description: "Lean protein and colorful peppers for a savory, satisfying meal." },
  { name: "8-Ounce Salmon with Lemon", icon: "🍋", image: "/assets/healthfood/citrus-garden-mix.jpg", price: "$14", rating: 0, reviews: 0, description: "8-ounce salmon with a bright lemon finish for a light, clean, protein-rich meal." },
  { name: "Citrus Glow Pack", icon: "🍊", image: "/assets/healthfood/product-02.jpg", price: "$18", rating: 0, reviews: 0, description: "Bright citrus for a fresh, feel-good boost." },
  { name: "Nature Fuel Granola", icon: "🌾", image: "/assets/healthfood/product-08.jpg", price: "$14", rating: 0, reviews: 0, description: "Crisp granola for breakfast and quick energy." },
  { name: "Two Avocados", icon: "🥑", image: "/assets/healthfood/product-01.jpg", price: "$4", rating: 0, reviews: 0, description: "Simple avocado goodness for easy snacking." },
];

const brandLogos = ["NOURISH", "PURELY", "VITAL", "GREENLY", "ORIGIN", "EARTHY"];

function shuffleArray<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function normalizeFirebaseProducts(payload: unknown): Record<string, unknown>[] | null {
  if (!payload || typeof payload !== "object") return null;

  const entries = payload as Record<string, unknown>;

  if (Array.isArray(entries.products)) {
    return entries.products.map((item) => ({
      ...(typeof item === "object" && item ? (item as Record<string, unknown>) : {}),
    })) as Record<string, unknown>[];
  }

  if (typeof entries.data === "object" && entries.data) {
    return normalizeFirebaseProducts(entries.data);
  }

  if (typeof entries === "object") {
    return Object.entries(entries).flatMap(([key, item]) =>
      item && typeof item === "object" ? [{ ...item, catalogSlug: key }] : []);
  }

  return null;
}

function renderStars(value: number) {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  const starLabel = normalizedValue === 1 ? "1 star" : `${normalizedValue} stars`;

  return (
    <span className="rating-text" aria-label={`${starLabel}`}>
      <span className="rating-number">{normalizedValue.toFixed(1)}</span>
      <svg className="rating-star-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 2.7l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.3l6.2-.9L12 2.7z" fill="currentColor" />
      </svg>
    </span>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCartItems(storedValue?: string) {
  if (typeof window === "undefined") return [] as Array<{ name: string; price: string; icon: string; image: string; quantity: number }>;

  try {
    const stored = storedValue ?? window.localStorage.getItem("healthfood4u_cart");
    return stored
      ? (JSON.parse(stored) as Array<{ name: string; price: string; icon: string; image?: string; quantity: number }>).filter((item) => item.name !== "Scoprio").map((item) => ({
          name: item.name ?? "Healthy Product",
          price: item.price ?? "$0",
          icon: item.icon ?? "•",
          image: item.image ?? productAssetMap[item.name ?? ""] ?? "/assets/healthfood/product-01.jpg",
          quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        }))
      : [];
  } catch {
    return [] as Array<{ name: string; price: string; icon: string; image: string; quantity: number }>;
  }
}

function ProductCard({ product, featured = false, onAddToCart, onOpenProduct }: { product: ProductItem; featured?: boolean; onAddToCart?: (product: ProductItem) => void; onOpenProduct?: (product: ProductItem) => void }) {
  const href = `/product/${slugify(product.name)}`;
  const router = useRouter();
  const isScoprio = product.name === "Scoprio";
  const savings = (() => {
    if (!product.oldPrice) return null;

    const current = Number.parseFloat(product.price.replace(/[^\d.]/g, ""));
    const previous = Number.parseFloat(product.oldPrice.replace(/[^\d.]/g, ""));

    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= current) {
      return null;
    }

    return `$${(previous - current).toFixed(0)}`;
  })();

  return (
    <Link
      href={href}
      className={`product-card ${featured ? "feature-card" : "slim-card"}`}
      onClick={(event) => {
        if (onOpenProduct) {
          event.preventDefault();
          onOpenProduct(product);
        }
      }}
    >
      <div className="card-topline" />

      <div className={`product-art ${featured ? "" : "small-art"}`} aria-hidden="true">
        {savings && <span className="discount-badge">Save {savings}</span>}
        <img src={product.image || "/assets/healthfood/product-01.svg"} alt={product.name} className="product-art-image" />
      </div>

      <div className="product-copy">
        {!isScoprio && (
          <>
            <h4>{product.name}</h4>
            <div className="product-card-meta">
              <div className="price-line">
                <strong>{product.price}</strong>
              </div>
              <div className="product-rating-inline" aria-live="polite" aria-label={`${product.rating.toFixed(1)} out of 5 from ${product.reviews ?? 0} reviews`}>
                <span className="rating-number">{product.rating > 0 ? product.rating.toFixed(1) : "0.0"}</span>
                <svg className="rating-star-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 2.7l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.3l6.2-.9L12 2.7z" fill="currentColor" />
                </svg>
                <span className="product-review-count">({product.reviews ?? 0} {(product.reviews ?? 0) === 1 ? "review" : "reviews"})</span>
              </div>
              <button
                type="button"
                className="mini-cart-button"
                aria-label={`Add ${product.name} to cart`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onAddToCart?.(product);
                  router.push("/cart");
                }}
              >
                <svg className="small-cart-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.5 5.5h2l2.2 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8l1.6-7.2H6.3" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="18.3" r="1.35" fill="currentColor" />
                  <circle cx="17" cy="18.3" r="1.35" fill="currentColor" />
                </svg>
                <span className="cart-add-symbol" aria-hidden="true">+</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className={isScoprio ? "product-description profile-description" : "product-description"}>
        {product.description}
      </div>
    </Link>
  );
}

const faqItems = [
  {
    question: "How do you actually make a website for my business?",
    answer: "I start by understanding all the complexities of what you want, what your goals are, and where your website might go in the future. Then I help you design a better website and build a site that is simple or complex, professional, and ready to launch to the internet when it is time.",
  },
  {
    question: "How can my website be better than my competitors?",
    answer: "A good website is more than a nice-looking page. It includes the backend systems that support purchases, checkout, shipping and handling, reviews, contact forms, and anything else people would need to do on the website. That kind of full setup is what separates a basic site from a working premium platform.",
  },
  {
    question: "Do I really need a website, or can I just use social media?",
    answer: "Social media can help, but it is only reachable by certain groups of people, and the advertising options are limited compared to what we can do with your own website. A website gives you a place that is yours, makes your business feel more trustworthy, and gives you more control over how people find you and learn about your brand. I can also help with SEO marketing, which could make a site like healthfoodforyou.com rank higher in search results for health food and related terms.",
  },
  {
    question: "How much does a website cost, and what am I paying for?",
    answer: "A simple landing page usually costs somewhere between $2,000 and $10,000 depending on the design, features, and how custom it is. If you want shipping, product reviews, checkout, and a full e-commerce setup, the cost can go up to $30,000. You are paying for the planning, design, development, backend infrastructure, and the work it takes to make the site actually function well for your customers. After that, what you are really paying for is a launched website that can stay online for as long as you need it, with updates and support available year after year. Unlike some developers, I include the work it takes to launch the site and get the domain connected properly, which can otherwise cost extra money and cause headaches later on.",
  },
];

export default function Home() {
  const [topItems, setTopItems] = useState<ProductItem[]>(fallbackTopItems);
  const [products, setProducts] = useState<ProductItem[]>(fallbackProducts);
  const randomizedSecondRowItems = secondRowItems;
  const [storedCartItems] = useLocalStorageState("healthfood4u_cart", [], getCartItems);
  const cartCount = storedCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<"shop" | "contact-form" | "free-response" | "review-form" | "video" | null>(null);
  const [freeResponseActive, setFreeResponseActive] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    question: "",
  });
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [reviewFormActive, setReviewFormActive] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    productName: fallbackProducts[0]?.name ?? "Organic Greens Box",
    reviewer: "",
    rating: 5,
    comment: "",
  });
  const { reviews: userReviews, submitReview, syncError: reviewSyncError } = useProductReviews();
  const [reviewStatus, setReviewStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const withReviews = (product: ProductItem): ProductItem => {
    const reviews = getProductReviews(userReviews, product.name);
    return { ...product, ...productCorrections[slugify(product.name)], rating: calculateAverageRating(reviews), reviews: reviews.length };
  };

  const reviewableProducts = Array.from(
    new Map(
      [...topItems, ...randomizedSecondRowItems, ...products].map((product) => [product.name, product]),
    ).values(),
  );

  const marqueeReviews = useMemo(() => {
    if (userReviews.length === 0) return [];

    return [...userReviews, ...userReviews].map((review, index) => ({
      ...review,
      marqueeKey: `${review.id ?? `${review.productName}-${index}`}-${index >= userReviews.length ? "b" : "a"}`,
    }));
  }, [userReviews]);

  const heroSlides = useMemo(
    () => [
      {
        title: "Healthy food shipped to you.",
        subtitle: "Fresh, clean ingredients for routines that feel easier, lighter, and more sustainable.",
      },
      {
        title: "Real nutrition, made easy.",
        subtitle: "Thoughtful food choices built for energy, recovery, and the pace of real life.",
      },
      {
        title: "Clean meals, delivered daily.",
        subtitle: "Premium ingredients, better balance, and healthier habits without the stress.",
      },
      {
        title: "Better ingredients. Better routines.",
        subtitle: "Simple, satisfying nourishment designed to support a stronger everyday rhythm.",
      },
    ],
    [],
  );

  useEffect(() => {
    const rotationTimer = window.setInterval(() => {
      setActiveHeroIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(rotationTimer);
  }, [heroSlides.length]);

  const triggerFreeResponse = (index = 0) => {
    const section = document.getElementById("free-response");
    if (!section) return;

    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveFaq(index);
    setFreeResponseActive(true);
    setTimeout(() => setFreeResponseActive(false), 900);
  };

  const triggerReviewForm = () => {
    const section = document.getElementById("review-form");
    if (!section) return;

    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setReviewFormActive(true);
    setTimeout(() => setReviewFormActive(false), 900);
  };

  const handleMenuAction = (action: "shop" | "contact-form" | "free-response" | "review-form" | "video", faqIndex?: number) => {
    setMenuOpen(false);

    if (action === "shop") {
      setActivePanel("shop");
      return;
    }

    if (action === "contact-form") {
      setActivePanel("contact-form");
      setContactStatus("idle");
      return;
    }

    if (action === "free-response") {
      setActivePanel("free-response");
      setActiveFaq(faqIndex ?? 0);
      return;
    }

    if (action === "video") {
      setActivePanel("video");
      return;
    }

    setActivePanel("review-form");
  };

  const panelVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (activePanel !== "video") return;
    const video = panelVideoRef.current;
    if (!video) return;

    const handleEnded = () => setActivePanel(null);
    const handleError = () => setActivePanel(null);

    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [activePanel]);

  const closeActivePanel = () => {
    setActivePanel(null);
  };

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = contactForm.name.trim();
    const trimmedEmail = contactForm.email.trim();
    const trimmedQuestion = contactForm.question.trim();

    if (!trimmedName || !trimmedEmail || !trimmedQuestion) return;

    setContactStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedQuestion,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setContactStatus("success");
      setContactForm({ name: "", email: "", question: "" });

      window.setTimeout(() => {
        setActivePanel(null);
        setContactStatus("idle");
      }, 1200);
    } catch {
      setContactStatus("error");
    }
  };

  const handleReviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = reviewForm.reviewer.trim();
    const trimmedComment = reviewForm.comment.trim();

    if (!trimmedName || !trimmedComment) return;

    const nextReview: ProductReview = {
      id: crypto.randomUUID(),
      productName: reviewForm.productName,
      name: trimmedName,
      reviewer: trimmedName,
      rating: reviewForm.rating,
      review: trimmedComment,
      comment: trimmedComment,
      createdAt: new Date().toISOString(),
    };

    setReviewStatus("sending");
    try {
      await submitReview(nextReview);
      setReviewStatus("success");
    } catch {
      setReviewStatus("error");
      return;
    }

    setReviewForm((current) => ({
      ...current,
      reviewer: "",
      rating: 5,
      comment: "",
    }));
  };

  const handleAddToCart = (product: ProductItem) => {
    const cartItems = getCartItems();
    const nextCart = [...cartItems];
    const index = nextCart.findIndex((item) => item.name === product.name);

    if (index >= 0) {
      nextCart[index].quantity += 1;
    } else {
      nextCart.push({
        name: product.name,
        price: product.price,
        icon: product.icon,
        image: product.image || productAssetMap[product.name] || "/assets/healthfood/product-01.jpg",
        quantity: 1,
      });
    }

    window.localStorage.setItem("healthfood4u_cart", JSON.stringify(nextCart));
    window.dispatchEvent(new Event("storage"));
  };

  useEffect(() => {
    if (!firebaseDatabaseUrl) return;

    const fetchCatalog = async () => {
      try {
        const response = await fetch(`${firebaseDatabaseUrl}/products.json`, { cache: "no-store" });

        if (!response.ok) {
          console.warn(`Firebase request failed with status ${response.status}. Using fallback catalog.`);
          return;
        }

        const payload = await response.json();
        const normalized = normalizeFirebaseProducts(payload);

        if (!normalized || normalized.length === 0) return;

        const liveProducts: ProductItem[] = normalized.map((item) => {
          const correction = productCorrections[String(item.catalogSlug)] ?? productCorrections[slugify(String(item.name ?? ""))];
          const product = { ...item, ...correction } as Record<string, unknown>;

          return {
            name: typeof product.name === "string" ? product.name : "Healthy Product",
            icon: typeof product.icon === "string" ? product.icon : "🌿",
            image: correction?.image ?? productAssetMap[typeof product.name === "string" ? product.name : "Healthy Product"] ?? "/assets/healthfood/product-01.jpg",
            price: typeof product.price === "string" ? product.price : "$0",
            rating: typeof product.rating === "number" ? product.rating : Number(product.rating) || 0,
            reviews: typeof product.reviews === "number" ? product.reviews : Number(product.reviews) || 0,
            description: typeof product.description === "string" ? product.description : "Fresh, healthy essentials made for everyday routines.",
            oldPrice: typeof product.oldPrice === "string" ? product.oldPrice : undefined,
            tag: typeof product.tag === "string" ? product.tag : "Popular",
          };
        });

        const shuffledLiveProducts = shuffleArray([...new Map(liveProducts.map(product => [product.name, product])).values()]);
        setProducts(shuffledLiveProducts);
        setTopItems(
          shuffleArray(
            shuffledLiveProducts.slice(0, 4).map((product) => ({
              name: product.name,
              icon: product.icon,
              image: productAssetMap[product.name] ?? product.image,
              price: product.price,
              oldPrice: product.oldPrice ?? product.price,
              rating: product.rating,
              tag: product.tag,
              description: product.description,
            })),
          ),
        );
      } catch (error) {
        console.error("Could not load live products from Firebase:", error);
      }
    };

    fetchCatalog();
  }, []);

  return (
    <main className="page-shell">
      <div className="top-banner" aria-label="Store announcement">
        <div className="top-banner-track">
          <span>Possibilities for Personalization</span>
          <span>Francis Black builds it.</span>
          <span>All packages shipped within two days</span>
          <span>Possibilities for Personalization</span>
          <span>Francis Black builds it.</span>
          <span>All packages shipped within two days</span>
          <span>Possibilities for Personalization</span>
          <span>Francis Black builds it.</span>
          <span>All packages shipped within two days</span>
        </div>
      </div>

      <header className="topbar logo-header">
        <div className="brand-cluster" aria-label="Healthfood4u brand">
          <div className="brand-lockup" />
          <div className="top-right-menu-wrap">
            {menuOpen && <button type="button" className="menu-overlay" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
            <div className="top-menu">
              <button
                type="button"
                className="top-menu-toggle"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="top-menu-panel"
              >
                <span className="menu-toggle-label">Menu</span>
              </button>
              <Link
                href="/cart"
                className="menu-cart-button"
                aria-label={`Go to shopping cart with ${cartCount} items`}
                onClick={(event) => event.stopPropagation()}
              >
                <svg className="menu-cart-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.5 5.5h2l2.2 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8l1.6-7.2H6.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9.4" cy="18.4" r="1.9" fill="currentColor" />
                  <circle cx="17.2" cy="18.4" r="1.9" fill="currentColor" />
                </svg>
                {cartCount > 0 && <span className="menu-cart-count">{cartCount}</span>}
              </Link>
              {menuOpen && (
                <div id="top-menu-panel" className="top-menu-panel" role="menu">
                  <button type="button" className="menu-link" onClick={() => handleMenuAction("contact-form")}>Tell Us What You Need</button>
                  <button type="button" className="menu-link" onClick={() => handleMenuAction("free-response", 1)}>Response Questions</button>
                  <button type="button" className="menu-link" onClick={() => handleMenuAction("video")}>Tiding</button>
                  <button type="button" className="menu-link" onClick={() => handleMenuAction("review-form")}>Leave a Review</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="hero-title-row hero-swap-shell">
            <div key={activeHeroIndex} className="hero-slide">
              <h1>{heroSlides[activeHeroIndex].title}</h1>
            </div>
          </div>
          <p key={`${activeHeroIndex}-subtitle`} className="lead hero-slide-subtitle">
            {heroSlides[activeHeroIndex].subtitle}
          </p>

          <div className="mini-stats mini-stats-hidden" />
        </div>

      </section>

      <section id="shop" className="section-block">
        <div className="product-grid featured-grid">
          {topItems.map((item) => (
            <ProductCard
              key={item.name}
              product={withReviews(item)}
              featured={true}
              onAddToCart={handleAddToCart}
              onOpenProduct={setSelectedProduct}
            />
          ))}
        </div>
      </section>

      <section className="section-block second-row-block">
        <div className="product-grid catalog-grid second-row-grid">
          {randomizedSecondRowItems.filter(item => !topItems.some(product => product.name === item.name)).map((item) => (
            <ProductCard
              key={item.name}
              product={withReviews(item)}
              featured={false}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </section>

      <section className="benefit-banner" aria-label="Key product benefits">
        <div className="benefit-banner-track">
          <span className="benefit-token green">Probiotics for gut health</span>
          <span className="benefit-token red">Zero preservatives</span>
          <span className="benefit-token yellow">Healthy food, low calorie</span>
          <span className="benefit-token green">Fresh ingredients, real nutrition</span>
          <span className="benefit-token red">No artificial fillers</span>
          <span className="benefit-token yellow">Clean fuel for everyday routines</span>
          <span className="benefit-token green">Probiotics for gut health</span>
          <span className="benefit-token red">Zero preservatives</span>
          <span className="benefit-token yellow">Healthy food, low calorie</span>
          <span className="benefit-token green">Fresh ingredients, real nutrition</span>
          <span className="benefit-token red">No artificial fillers</span>
          <span className="benefit-token yellow">Clean fuel for everyday routines</span>
        </div>
      </section>

      <section className="section-block lower-products-block">
        <div className="product-grid catalog-grid">
          {[...products.filter(product => ![...topItems, ...randomizedSecondRowItems].some(item => item.name === product.name)), profileProduct].map((item) => (
            <ProductCard
              key={item.name}
              product={withReviews(item)}
              featured={false}
              onAddToCart={handleAddToCart}
              onOpenProduct={setSelectedProduct}
            />
          ))}
        </div>
      </section>

      {selectedProduct && (
        <div className="product-overlay-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="product-overlay-shell" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="product-overlay-close" aria-label="Close product preview" onClick={() => setSelectedProduct(null)}>×</button>
            <ProductDetails
              product={{
                name: selectedProduct.name,
                icon: selectedProduct.icon,
                image: selectedProduct.image,
                price: selectedProduct.price,
                rating: selectedProduct.rating,
                description: selectedProduct.description,
                details: [selectedProduct.description],
              }}
              slug={slugify(selectedProduct.name)}
            />
          </div>
        </div>
      )}

      {activePanel && (
        <div className="panel-backdrop" onClick={closeActivePanel}>
          <div
            className="panel-sheet"
            role="dialog"
            aria-modal="true"
            onClick={(event) => {
              if (activePanel === "video" && event.target !== panelVideoRef.current) {
                closeActivePanel();
              } else {
                event.stopPropagation();
              }
            }}
          >
            <button type="button" className="panel-close" aria-label="Close panel" onClick={closeActivePanel}>×</button>

            {activePanel === "shop" && (
              <div className="panel-content">
                <span className="section-kicker">Menu</span>
                <h3>Shop the collection</h3>
                <div className="panel-product-list">
                  {products.map((product) => (
                    <div key={product.name} className="panel-product-item">
                      <span>{product.name}</span>
                      <strong>{product.price}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "contact-form" && (
              <div className="panel-content contact-panel-content">
                <form className="contact-panel-form" onSubmit={handleContactSubmit}>
                  <div className="contact-field-grid">
                    <label className="contact-field">
                      <span>Name</span>
                      <input
                        type="text"
                        value={contactForm.name}
                        onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Your name"
                      />
                    </label>

                    <label className="contact-field">
                      <span>Email</span>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder="you@example.com"
                      />
                    </label>
                  </div>

                  <label className="contact-field">
                    <span>What are you looking for?</span>
                    <textarea
                      value={contactForm.question}
                      onChange={(event) => setContactForm((current) => ({ ...current, question: event.target.value }))}
                      placeholder="Tell us about your goals, budget, preferred delivery, or the kind of food experience you want..."
                    />
                  </label>

                  <button type="submit" className="primary-button review-submit-button" disabled={contactStatus === "sending"}>
                    {contactStatus === "sending" ? "Sending..." : "Send message"}
                  </button>
                </form>

                {contactStatus === "success" && (
                  <p className="contact-form-status success">Your request has been sent successfully.</p>
                )}

                {contactStatus === "error" && (
                  <p className="contact-form-status error">Something went wrong. Please try again or email me directly.</p>
                )}
              </div>
            )}

            {activePanel === "free-response" && (
              <div className="panel-content free-response-panel-content">
                <div className="faq-list" aria-label="Frequently asked questions">
                  {faqItems.map((item, index) => {
                    const isOpen = activeFaq === index;
                    return (
                      <div className={`faq-item ${isOpen ? "faq-item-open" : ""}`} key={item.question}>
                        <button
                          type="button"
                          className="faq-question"
                          onClick={() => setActiveFaq(isOpen ? null : index)}
                          aria-expanded={isOpen}
                        >
                          <span>{item.question}</span>
                          <span className="faq-plus" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                        </button>
                        <div className={`faq-answer ${isOpen ? "faq-answer-open" : ""}`} aria-hidden={!isOpen}>
                          <p>{item.answer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activePanel === "video" && (
              <div className="panel-content video-panel-content" onClick={closeActivePanel}>
                <div className="video-wrapper" onClick={closeActivePanel}>
                  <video
                    ref={panelVideoRef}
                    autoPlay
                    muted
                    playsInline
                    controls={false}
                    preload="auto"
                    src="/tiding-advertisement.mp4"
                    onClick={(event) => event.stopPropagation()}
                    onEnded={closeActivePanel}
                    onError={closeActivePanel}
                  />
                </div>
              </div>
            )}

            {activePanel === "review-form" && (
              <div className="panel-content review-panel-content">
                <form className="review-form" onSubmit={handleReviewSubmit}>
                  <div className="contact-field-grid">
                    <label className="contact-field">
                      <span>Product</span>
                      <select
                        value={reviewForm.productName}
                        onChange={(event) => setReviewForm((current) => ({ ...current, productName: event.target.value }))}
                      >
                        {reviewableProducts.map((product) => (
                          <option key={product.name} value={product.name}>{product.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="contact-field">
                      <span>Rating</span>
                      <select
                        value={reviewForm.rating}
                        onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                      >
                        {[5, 4, 3, 2, 1].map((score) => (
                          <option key={score} value={score}>{score} star{score > 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="contact-field">
                    <span>Your name</span>
                    <input
                      type="text"
                      value={reviewForm.reviewer}
                      onChange={(event) => setReviewForm((current) => ({ ...current, reviewer: event.target.value }))}
                      placeholder="Your name"
                    />
                  </label>

                  <label className="contact-field">
                    <span>Review</span>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                      placeholder="What did you like about this product?"
                    />
                  </label>

                  <button type="submit" className="primary-button review-submit-button" disabled={reviewStatus === "sending"}>{reviewStatus === "sending" ? "Saving..." : "Submit review"}</button>
                  {reviewStatus === "success" && <p role="status">Your review has been published.</p>}
                  {reviewSyncError && <p role="alert">{reviewSyncError}</p>}
                </form>

              </div>
            )}
          </div>
        </div>
      )}

      <section className="reviews-section" aria-label="Customer reviews">
        <div className="reviews-marquee">
          <div className="reviews-track">
            {marqueeReviews.length > 0 ? (
              marqueeReviews.map((review, index) => (
                <article className="review-card" key={`${review.marqueeKey}-${index}`}>
                  <div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(Math.round(review.rating))}{"☆".repeat(5 - Math.round(review.rating))}</div>
                  <p>“{review.comment}”</p>
                  <span className="review-author">{review.reviewer} · {review.productName}</span>
                </article>
              ))
            ) : null}
          </div>
        </div>
      </section>



      <footer className="site-footer">
        <div className="footer-brand-copy footer-context-left">
          <div className="footer-brand-year">2026 HealthFood4U.com</div>
          <div className="footer-service-inline">
            <span className="footer-service-label">Web/Mobile Development</span>
          </div>
        </div>

        <div className="footer-brand-copy footer-context-right footer-contact-icons" aria-label="Contact options">
          <a href="mailto:francisdennisblack@gmail.com" className="contact-icon-button" aria-label="Email Francis Black" title="Email">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m4 7 8 6 8-6" />
            </svg>
          </a>
          <a href="tel:3602988653" className="contact-icon-button" aria-label="Call Francis Black" title="Call">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.1 5.18 2 2 0 0 1 5.08 3h3a2 2 0 0 1 2 1.72c.12.9.34 1.77.66 2.6a2 2 0 0 1-.45 2.11L9 9.91a16 16 0 0 0 6.09 6.09l.48-.29a2 2 0 0 1 2.11-.45c.83.32 1.7.54 2.6.66A2 2 0 0 1 22 16.92Z" />
            </svg>
          </a>
          <div className="footer-rate">$120/hr</div>
        </div>
      </footer>
    </main>
  );
}
