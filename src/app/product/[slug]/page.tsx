import Link from "next/link";
import ProductDetails from "./ProductDetails";
import { productCorrections } from "@/lib/productCorrections";

import { productCatalog } from "@/lib/productCatalog";

export function generateStaticParams() {
  return Object.entries(productCatalog)
    .filter(([slug]) => slug !== "scoprio")
    .map(([slug]) => ({ slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug.toLowerCase() === "scoprio") {
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

  return <ProductDetails product={{ ...product, ...productCorrections[slug] }} slug={slug} />;
}
