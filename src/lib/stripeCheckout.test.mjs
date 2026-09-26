import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import Stripe from 'stripe';
import { parseCheckoutItems, getCheckoutQuote, checkoutSessionParameters } from './stripeCheckout.ts';

test('validates quantities, combines duplicates, and ignores browser prices', () => {
  assert.deepEqual(parseCheckoutItems([
    { name: 'Two Avocados', quantity: 2, price: '$0.01' },
    { name: 'Two Avocados', quantity: 1 },
  ]), [{ lookupKey: 'healthfood4u_two-avocados', name: 'Two Avocados', quantity: 3 }]);
  for (const items of [null, [], [{ name: 'Scoprio', quantity: 1 }],
    [{ name: 'Two Avocados', quantity: 0 }], [{ name: 'Two Avocados', quantity: -1 }],
    [{ name: 'Two Avocados', quantity: 1.5 }], [{ name: 'Two Avocados', quantity: '2' }],
    [{ name: 'Two Avocados', quantity: 100 }], [null],
    [{ name: 'Two Avocados', quantity: 99 }, { name: 'Two Avocados', quantity: 1 }]]) {
    assert.throws(() => parseCheckoutItems(items));
  }
});

test('uses Stripe prices and quantities, requires addresses, and rejects unavailable products', async context => {
  const requests = [];
  const price = {
    id: 'price_avocados', object: 'price', active: true, type: 'one_time', currency: 'usd',
    billing_scheme: 'per_unit', unit_amount: 725, lookup_key: 'healthfood4u_two-avocados',
    product: { id: 'prod_avocados', object: 'product', name: 'Two Avocados', active: true },
  };
  let prices = [price];
  const server = createServer((request, response) => {
    requests.push(new URL(request.url, 'http://localhost'));
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ object: 'list', data: prices, has_more: false, url: '/v1/prices' }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => new Promise(resolve => server.close(resolve)));
  const stripe = new Stripe('sk_test_local_fixture', { host: '127.0.0.1', port: server.address().port, protocol: 'http', maxNetworkRetries: 0 });
  const cart = parseCheckoutItems([{ name: 'Two Avocados', quantity: 3, price: '$0.01' }]);
  const quote = await getCheckoutQuote(stripe, cart);
  assert.equal(requests[0].pathname, '/v1/prices');
  assert.equal(requests[0].searchParams.get('lookup_keys[0]'), 'healthfood4u_two-avocados');
  assert.equal(quote.subtotal, 2175);
  assert.equal(quote.total, 2774);
  const session = checkoutSessionParameters(quote, 'https://healthfood4u.com');
  assert.deepEqual(session.line_items, [{ price: 'price_avocados', quantity: 3 }]);
  assert.equal(session.billing_address_collection, 'required');
  assert.deepEqual(session.shipping_address_collection.allowed_countries, ['US', 'CA']);
  assert.equal(session.shipping_options[0].shipping_rate_data.fixed_amount.amount, 599);
  assert.equal(session.success_url, 'https://healthfood4u.com/checkout/success?session_id={CHECKOUT_SESSION_ID}');
  assert.equal(session.cancel_url, 'https://healthfood4u.com/checkout');
  const embeddedSession = checkoutSessionParameters(quote, 'https://healthfood4u.com', 'embedded');
  assert.equal(embeddedSession.ui_mode, 'embedded_page');
  assert.equal(embeddedSession.return_url, 'https://healthfood4u.com/checkout/success?session_id={CHECKOUT_SESSION_ID}');
  for (const invalid of [null, { ...price, active: false }, { ...price, type: 'recurring' },
    { ...price, currency: 'eur' }, { ...price, unit_amount: null },
    { ...price, product: { ...price.product, active: false } },
    { ...price, product: { id: 'prod_avocados', deleted: true } }]) {
    prices = invalid ? [invalid] : [];
    await assert.rejects(getCheckoutQuote(stripe, cart), /purchasable USD Stripe price is missing/);
  }
});