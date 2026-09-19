import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateAverageRating, normalizeReviewEntries } from './reviews.js';

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
