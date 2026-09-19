function normalizeSingleReview(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const name = typeof entry.name === 'string'
    ? entry.name
    : typeof entry.reviewer === 'string'
      ? entry.reviewer
      : 'Customer';

  const review = typeof entry.review === 'string'
    ? entry.review
    : typeof entry.comment === 'string'
      ? entry.comment
      : '';

  if (!review) return null;

  return {
    id: typeof entry.id === 'string' ? entry.id : undefined,
    name,
    rating: Number(entry.rating) || 0,
    review,
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
    photo: typeof entry.photo === 'string' ? entry.photo : undefined,
    video: typeof entry.video === 'string' ? entry.video : undefined,
  };
}

export function normalizeReviewEntries(payload) {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => {
      const normalized = normalizeSingleReview(entry);
      return normalized ? [normalized] : [];
    });
  }

  if (typeof payload === 'object') {
    return Object.values(payload).flatMap((entry) => {
      const normalized = normalizeSingleReview(entry);
      return normalized ? [normalized] : [];
    });
  }

  return [];
}

export function calculateAverageRating(reviews) {
  if (!reviews.length) return 0;

  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return Number((total / reviews.length).toFixed(1));
}

export function emptyReviewState() {
  return { name: '', rating: '5', review: '', photo: '', video: '' };
}
