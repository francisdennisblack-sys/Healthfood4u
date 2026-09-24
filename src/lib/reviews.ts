export type ReviewEntry = {
  id?: string;
  name: string;
  rating: number;
  review: string;
  createdAt: string;
  photo?: string;
  video?: string;
};

function normalizeSingleReview(entry: Record<string, unknown>): ReviewEntry | null {
  if (!entry || typeof entry !== "object") return null;

  const name = typeof entry.name === "string"
    ? entry.name
    : typeof entry.reviewer === "string"
      ? entry.reviewer
      : "Customer";

  const review = typeof entry.review === "string"
    ? entry.review
    : typeof entry.comment === "string"
      ? entry.comment
      : "";

  const rating = Number(entry.rating);
  if (!review || !Number.isFinite(rating) || rating < 1 || rating > 5) return null;

  return {
    id: typeof entry.id === "string" ? entry.id : undefined,
    name,
    rating,
    review,
    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
    photo: typeof entry.photo === "string" ? entry.photo : undefined,
    video: typeof entry.video === "string" ? entry.video : undefined,
  };
}

export function normalizeReviewEntries(payload: unknown): ReviewEntry[] {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const normalized = normalizeSingleReview(entry as Record<string, unknown>);
      return normalized ? [normalized] : [];
    });
  }

  if (typeof payload === "object") {
    return Object.values(payload as Record<string, unknown>).flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const normalized = normalizeSingleReview(entry as Record<string, unknown>);
      return normalized ? [normalized] : [];
    });
  }

  return [];
}

export function calculateAverageRating(reviews: ReviewEntry[]): number {
  if (!reviews.length) return 0;

  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return Number((total / reviews.length).toFixed(1));
}

export function emptyReviewState() {
  return { name: "", rating: "5", review: "", photo: "", video: "" };
}

export type ProductReview = ReviewEntry & {
  id: string;
  productName: string;
  reviewer: string;
  comment: string;
};

export function productReviewKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function normalizeProductReviews(payload: unknown, productName = ""): ProductReview[] {
  if (!payload || typeof payload !== "object") return [];
  const visit = (value: unknown, product: string, key: string): ProductReview[] => {
    if (!value || typeof value !== "object") return [];
    const entry = value as Record<string, unknown>;
    if (typeof entry.review === "string" || typeof entry.comment === "string") {
      const normalized = normalizeSingleReview(entry);
      const name = typeof entry.productName === "string" ? entry.productName : product;
      if (!normalized || !name) return [];
      return [{ ...normalized, id: normalized.id ?? key, productName: name,
        reviewer: normalized.name, comment: normalized.review }];
    }
    return Object.entries(entry).flatMap(([childKey, child]) =>
      visit(child, product || childKey, key ? `${key}/${childKey}` : childKey));
  };
  if (Array.isArray(payload)) {
    return payload.flatMap((entry, index) => visit(entry, productName, `${productReviewKey(productName)}-${index}`));
  }
  return visit(payload, productName, "");
}

export function mergeProductReviews(current: ProductReview[], incoming: ProductReview[]): ProductReview[] {
  const reviews = new Map(current.map(review => [`${productReviewKey(review.productName)}:${review.id}`, review]));
  for (const review of incoming) reviews.set(`${productReviewKey(review.productName)}:${review.id}`, review);
  return [...reviews.values()];
}

export function getProductReviews(reviews: ProductReview[], productName: string): ProductReview[] {
  return reviews.filter(review => productReviewKey(review.productName) === productReviewKey(productName));
}
