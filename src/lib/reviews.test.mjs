import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';

import { calculateAverageRating, normalizeReviewEntries, normalizeProductReviews, mergeProductReviews, getProductReviews, saveProductReview, deleteProductReview } from './reviews.ts';

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

test('saves reviews individually and rejects an unsuccessful database response', async context => {
  const requests = [];
  let responseStatus = 200;
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    requests.push({ method: request.method, url: request.url, body: JSON.parse(body) });
    response.writeHead(responseStatus, { 'Content-Type': 'application/json' });
    response.end(body);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => new Promise(resolve => server.close(resolve)));
  const review = normalizeProductReviews([{ id: 'test-id', productName: 'Two Avocados', name: 'Ava', review: 'Great', rating: 5 }])[0];
  const url = `http://127.0.0.1:${server.address().port}`;
  await saveProductReview(url, review);
  assert.equal(requests[0].method, 'PUT');
  assert.equal(requests[0].url, '/reviews/two-avocados/test-id.json');
  assert.equal(requests[0].body.rating, 5);
  responseStatus = 403;
  await assert.rejects(saveProductReview(url, review), /rejected the save \(403\)/);
  await assert.rejects(saveProductReview(undefined, review), /not configured/);
});

test('deletes a review by product path and rejects unsuccessful database deletes', async context => {
  const requests = [];
  let responseStatus = 200;
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    requests.push({ method: request.method, url: request.url, body });
    response.writeHead(responseStatus, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ ok: true }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => new Promise(resolve => server.close(resolve)));
  const review = normalizeProductReviews([{ id: 'delete-me', productName: 'Two Avocados', name: 'Ava', review: 'Great', rating: 5 }])[0];
  const url = `http://127.0.0.1:${server.address().port}`;
  await deleteProductReview(url, review);
  assert.equal(requests[0].method, 'DELETE');
  assert.equal(requests[0].url, '/reviews/two-avocados/delete-me.json');
  responseStatus = 403;
  await assert.rejects(deleteProductReview(url, review), /rejected the delete \(403\)/);
  await assert.rejects(deleteProductReview(undefined, review), /not configured/);
});
