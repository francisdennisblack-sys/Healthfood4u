import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateAverageRating, normalizeReviewEntries, normalizeProductReviews, mergeProductReviews, getProductReviews } from './reviews.ts';

test('normalizes object-style Firebase review payloads', () => {
  const result = normalizeReviewEntries({
    review1: { name: 'Ava', rating: 5, review: 'Loved it' },
    review2: { name: 'Noah', rating: 3, review: 'Solid' },
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].rating, 5);
  assert.equal(result[1].review, 'Solid');
});

test('accepts Firebase reviewer/comment payloads', () => {
  const result = normalizeReviewEntries({
    review1: { reviewer: 'Ava', rating: 5, comment: 'Loved it' },
    review2: { reviewer: 'Noah', rating: 3, comment: 'Solid' },
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].name, 'Ava');
  assert.equal(result[0].review, 'Loved it');
  assert.equal(result[1].name, 'Noah');
  assert.equal(result[1].rating, 3);
});

test('calculates a real average from review ratings', () => {
  const result = calculateAverageRating([
    { name: 'A', rating: 5, review: 'Great', createdAt: '2026-01-01' },
    { name: 'B', rating: 3, review: 'Okay', createdAt: '2026-01-02' },
    { name: 'C', rating: 4, review: 'Nice', createdAt: '2026-01-03' },
  ]);

  assert.equal(result, 4);
});

test('returns zero when there are no reviews', () => {
  assert.equal(calculateAverageRating([]), 0);
  assert.deepEqual(normalizeReviewEntries(null), []);
});

test('normalizes keyed and array reviews without losing their product identity', () => {
  const reviews = normalizeProductReviews({
    'two-avocados': { first: { name: 'Ava', rating: 5, review: 'Great' } },
    'celery-bundle': [{ id: 'second', reviewer: 'Sam', rating: 2, comment: 'Okay' }],
  });
  assert.equal(reviews.length, 2);
  assert.equal(getProductReviews(reviews, 'Two Avocados')[0].rating, 5);
  assert.equal(getProductReviews(reviews, 'Celery Bundle')[0].rating, 2);
  assert.deepEqual(normalizeProductReviews({ error: 'Permission denied' }), []);
});

test('merges stable review IDs and updates only the reviewed product average', () => {
  const initial = normalizeProductReviews({ 'two-avocados': {
    first: { name: 'Ava', rating: 5, review: 'Great' },
  } });
  const next = normalizeProductReviews({ 'two-avocados': {
    first: { name: 'Ava', rating: 5, review: 'Great' },
    second: { name: 'Sam', rating: 1, review: 'Not for me' },
  } });
  const merged = mergeProductReviews(initial, next);
  assert.equal(merged.length, 2);
  assert.equal(calculateAverageRating(getProductReviews(merged, 'Two Avocados')), 3);
  assert.equal(calculateAverageRating(getProductReviews(merged, 'Celery Bundle')), 0);
});

test('ignores ratings outside the five-star scale', () => {
  const reviews = normalizeReviewEntries([
    { name: 'Ava', rating: 5, review: 'Great' },
    { name: 'Sam', rating: 8, review: 'Invalid' },
    { name: 'Lee', rating: 0, review: 'Invalid' },
  ]);
  assert.equal(reviews.length, 1);
  assert.equal(calculateAverageRating(reviews), 5);
});
