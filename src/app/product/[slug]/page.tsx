import Link from "next/link";
import ProductDetails from "./ProductDetails";

const productCatalog = {
  "tofu-pho-bowl": {
    name: "Tofu Pho Bowl",
    icon: "🥢",
    image: "/assets/healthfood/tofu-pho-bowl.jpg",
    price: "$20",
    rating: 0,
    description: "A warm, comforting bowl with rich broth and fresh tofu flavor.",
    details: [],
  },
  "8-ounce-steak": {
    name: "8 Ounce Steak",
    icon: "🥩",
    image: "/assets/healthfood/veggie-bowl.jpg",
    price: "$17",
    rating: 0,
    description: "8 ounce steak with tomatoes and a savory glaze for a hearty, satisfying meal.",
    details: [],
  },
  "tomato-harvest-box": {
    name: "Tomato Harvest Box",
    icon: "🍅",
    image: "/assets/healthfood/tomato-harvest.jpg",
    price: "$15",
    rating: 0,
    description: "Sun-ripened tomatoes and fresh produce for vibrant meals.",
    details: [],
  },
  "berry-nut-pack": {
    name: "Berry Nut Pack",
    icon: "🫐",
    image: "/assets/healthfood/berry-citrus-pack.jpg",
    price: "$19",
    rating: 0,
    description: "A colorful blend of berries and citrus for a fresh, feel-good boost.",
    details: [],
  },
  "chicken-bell-pepper-stir-fry": {
    name: "Chicken Bell Pepper Stir Fry",
    icon: "🍲",
    image: "/assets/healthfood/chicken-bell-pepper-stir-fry-transparent.png",
    price: "$18",
    rating: 0,
    description: "Lean protein and colorful peppers for a savory, satisfying meal.",
    details: [],
  },
  "8-ounce-salmon-with-lemon": {
    name: "8-Ounce Salmon with Lemon",
    icon: "🍋",
    image: "/assets/healthfood/citrus-garden-mix.jpg",
    price: "$14",
    rating: 0,
    description: "8-ounce salmon with a bright lemon finish for a light, clean, protein-rich meal.",
    details: [],
  },
  "organic-greens-box": {
    name: "Organic Greens Box",
    icon: "🥬",
    image: "/assets/healthfood/product-05.jpg",
    price: "$26",
    rating: 0,
    description: "Fresh greens for easy meals and everyday energy.",
    details: [
      "Organic greens and nutrient-dense vegetables",
      "Prepared for easy weekday lunches and quick routines",
      "High-quality ingredients with a fresh, clean finish",
    ],
  },
  "citrus-glow-pack": {
    name: "Citrus Glow Pack",
    icon: "🍊",
    image: "/assets/healthfood/product-02.jpg",
    price: "$18",
    rating: 0,
    description: "Bright citrus for a fresh, feel-good boost.",
    details: [
      "Vitamin-rich citrus profile for a fresh boost",
      "Perfect for quick energy and hydration support",
      "Simple ingredients with a clean, vibrant taste",
    ],
  },
  "protein-balance-kit": {
    name: "Protein Balance Kit",
    icon: "🥗",
    image: "/assets/healthfood/product-09.jpg",
    price: "$34",
    rating: 0,
    description: "Protein support for busy days and strong routines.",
    details: [
      "Balanced protein support for active routines",
      "Easy to prep into breakfasts, lunches, and post-workout meals",
      "Designed for clean nutrition without extra filler",
    ],
  },
  "daily-gut-blend": {
    name: "Daily Gut Blend",
    icon: "🌿",
    image: "/assets/healthfood/product-04.jpg",
    price: "$22",
    rating: 0,
    description: "A gut-friendly blend for simple daily wellness.",
    details: [
      "Supports daily wellness with gut-friendly ingredients",
      "Designed for easy morning or midday use",
      "Whole-food ingredients with a natural, balanced taste",
    ],
  },
  "two-avocados": {
    name: "Two Avocados",
    icon: "🥑",
    image: "/assets/healthfood/product-01.jpg",
    price: "$4",
    rating: 0,
    description: "Simple avocado goodness for easy snacking.",
    details: [
      "Lightly crunchy texture with clean ingredients",
      "Easy snack option for busy afternoons",
      "Nutrient-rich and naturally satisfying",
    ],
  },
  "berry-core-bites": {
    name: "Berry Core Bites",
    icon: "🫐",
    image: "/assets/healthfood/product-06.jpg",
    price: "$19",
    rating: 0,
    description: "Sweet berry bites for a light, satisfying snack.",
    details: [
      "Naturally berry-forward with a satisfying bite",
      "Great option for lighter snacking and energy boosts",
      "Simple ingredients with a naturally sweet finish",
    ],
  },
  "nature-fuel-granola": {
    name: "Nature Fuel Granola",
    icon: "🌾",
    image: "/assets/healthfood/product-08.jpg",
    price: "$14",
    rating: 0,
    description: "Crisp granola for breakfast and quick energy.",
    details: [
      "Crisp granola texture with wholesome ingredients",
      "Ideal for breakfast bowls, parfaits, or snacking",
      "Light sweetness without feeling heavy",
    ],
  },
  "lemon-mint-water": {
    name: "Lemon Mint Water",
    icon: "🍋",
    image: "/assets/healthfood/product-07.jpg",
    price: "$12",
    rating: 0,
    description: "Refreshing lemon and mint hydration.",
    details: [
      "Hydrating and refreshing all day",
      "Bright citrus and mint flavor profile",
      "Simple, clean ingredients with no artificial additives",
    ],
  },
  "plant-protein-shake": {
    name: "Plant Protein Shake",
    icon: "🥤",
    image: "/assets/healthfood/product-03.svg",
    price: "$24",
    rating: 0,
    description: "Smooth plant protein for quick meals and recovery.",
    details: [
      "Convenient protein source for active mornings",
      "Smooth texture and clean, balanced flavor",
      "A practical addition to everyday routines",
    ],
  },
  "superfood-snack-duo": {
    name: "Superfood Snack Duo",
    icon: "🥭",
    image: "/assets/healthfood/product-11.jpg",
    price: "$20",
    rating: 0,
    description: "A simple combo of nutrient-rich snacks.",
    details: [
      "Balanced snack combo for any time of day",
      "Tasty, portable, and easy to enjoy on the go",
      "Nutrient-rich ingredients built for easier choices",
    ],
  },
  "omega-seed-box": {
    name: "Omega Seed Box",
    icon: "🌱",
    image: "/assets/healthfood/omega-seed-box-screenshot.png",
    price: "$17",
    rating: 0,
    description: "A nutrient-rich, crunchy seed blend for smoothies, bowls, and easy everyday nourishment.",
    details: [
      "Omega-rich ingredients for daily wellness support",
      "Easy to mix into bowls, smoothies, or meals",
      "Clean texture and balanced flavorful crunch",
    ],
  },
  "celery-bundle": {
    name: "Celery Bundle",
    icon: "🥬",
    image: "/assets/healthfood/product-10.jpg",
    price: "$10",
    rating: 0,
    description: "Crisp celery bundles for juicing, soups, and easy everyday freshness.",
    details: [
      "Fresh celery for juicing, soups, and quick meals",
      "Clean, crisp flavor with everyday versatility",
      "Simple produce-forward support for lighter routines",
    ],
  },
  "feed-box": {
    name: "Feed Box",
    icon: "🌱",
    image: "/assets/healthfood/omega-seed-box-screenshot.png",
    price: "$17",
    rating: 0,
    description: "A nutrient-rich, crunchy seed blend for smoothies, bowls, and easy everyday nourishment.",
    details: [
      "Seed-forward nutrition for bowls and smoothies",
      "Easy to add to daily recipes and routines",
      "Balanced, clean ingredients with a satisfying finish",
    ],
  },
  scoprio: {
    name: "Scoprio",
    icon: "🍊",
    image: "/assets/healthfood/one-orange.png",
    price: "$1",
    rating: 0,
    description: "After graduating with five AP's under my belt, I attended Colorado College before launching my first tech company, Tiding.",
    details: [
      "A pure produce-forward pick for healthier everyday meals",
      "Fresh taste and satisfying texture",
      "Simple ingredients that fit real routines",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(productCatalog).map((slug) => ({ slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productCatalog[slug as keyof typeof productCatalog];

  if (!product) {
    return (
      <main className="page-shell product-page-shell">
        <div className="product-not-found">
          <p className="eyebrow">Product not found</p>
          <h1>That item isn’t available right now.</h1>
          <Link href="/" className="primary-button">Back to shop</Link>
        </div>
      </main>
    );
  }

  return <ProductDetails product={product} slug={slug} />;
}
