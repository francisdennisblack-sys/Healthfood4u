import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe secret key is not configured." }, { status: 500 });
  }

  const stripe = new Stripe(secretKey, { timeout: 15000, maxNetworkRetries: 1 });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  const bodyText = await request.text();

  if (webhookSecret) {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
    }
    try {
      event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(bodyText) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      try {
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items", "line_items.data.price.product"],
        });

        const customerEmail = fullSession.customer_details?.email;
        const customerName = fullSession.customer_details?.name || "Valued Customer";
        const customerPhone = fullSession.customer_details?.phone || "Not provided";

        const rawSession = fullSession as unknown as { shipping_details?: { address?: Stripe.Address } };
        const shipping = rawSession.shipping_details?.address || fullSession.customer_details?.address;
        const shippingAddressText = shipping
          ? [
              shipping.line1,
              shipping.line2,
              `${shipping.city || ""}, ${shipping.state || ""} ${shipping.postal_code || ""}`.trim(),
              shipping.country,
            ]
              .filter(Boolean)
              .join("\n")
          : "No shipping address provided";

        const lineItems = fullSession.line_items?.data || [];
        const itemsList = lineItems
          .map((item) => {
            const prodName =
              typeof item.price?.product === "object" &&
              item.price?.product &&
              "name" in item.price.product
                ? item.price.product.name
                : item.description || "Product";
            const qty = item.quantity || 1;
            const amount =
              item.amount_total !== null
                ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: fullSession.currency || "usd",
                  }).format(item.amount_total / 100)
                : "";
            return `- ${prodName} x ${qty} (${amount})`;
          })
          .join("\n");

        const totalPaid =
          fullSession.amount_total !== null
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: fullSession.currency || "usd",
              }).format(fullSession.amount_total / 100)
            : "$0.00";

        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          const recipient = (
            process.env.CONTACT_EMAIL || "francisdennisblack@gmail.com"
          )
            .trim()
            .toLowerCase();
          const fromEmail =
            process.env.CONTACT_FROM_EMAIL ||
            "HealthFood4U <onboarding@resend.dev>";

          const storeOwnerBody = `NEW ORDER RECEIVED on HealthFood4U!

Order ID: ${fullSession.id}
Total Paid: ${totalPaid}

CUSTOMER DETAILS:
Name: ${customerName}
Email: ${customerEmail || "Not provided"}
Phone: ${customerPhone}

SHIPPING ADDRESS:
${shippingAddressText}

ITEMS ORDERED:
${itemsList || "None"}
`;

          // 1. Send notification to Francis
          await resend.emails.send({
            from: fromEmail,
            to: [recipient],
            subject: `🛒 New Order #${fullSession.id.slice(-8).toUpperCase()} - ${totalPaid}`,
            text: storeOwnerBody,
          });

          // 2. Send order receipt to Customer
          if (customerEmail) {
            const customerBody = `Thank you for your order with HealthFood4U!

Hi ${customerName},

We've received your order and are preparing it for shipment.

ORDER DETAILS:
${itemsList}

Total Paid: ${totalPaid}

SHIPPING ADDRESS:
${shippingAddressText}

Thank you for shopping with HealthFood4U!
`;

            await resend.emails.send({
              from: fromEmail,
              to: [customerEmail],
              subject: `Order Confirmation - HealthFood4U #${fullSession.id.slice(-8).toUpperCase()}`,
              text: customerBody,
            });
          }
        }
      } catch (err) {
        console.error("Error sending order confirmation emails:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
