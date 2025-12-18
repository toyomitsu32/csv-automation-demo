import Stripe from "stripe";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { PRODUCTS, ProductKey } from "./products";
import { updateUserStripeInfo, updateUserSubscription, createPurchase, getUserByStripeCustomerId } from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const stripeRouter = router({
  // Create checkout session for one-time payment
  createCheckoutSession: protectedProcedure
    .input(z.object({
      productKey: z.enum(["CSV_EXPORT_PREMIUM", "CSV_SUBSCRIPTION"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const product = PRODUCTS[input.productKey as ProductKey];
      const origin = ctx.req.headers.origin || "http://localhost:3000";

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: product.currency,
              product_data: {
                name: product.name,
                description: product.description,
              },
              unit_amount: product.priceAmount,
              ...(product.mode === "subscription" && {
                recurring: {
                  interval: product.interval,
                },
              }),
            },
            quantity: 1,
          },
        ],
        mode: product.mode,
        success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/payment/cancel`,
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        allow_promotion_codes: true,
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          product_key: input.productKey,
        },
      };

      const session = await stripe.checkout.sessions.create(sessionConfig);

      return { url: session.url };
    }),

  // Get user's subscription status
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.stripeCustomerId) {
      return { status: "none", subscription: null };
    }

    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: ctx.user.stripeCustomerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        return {
          status: "active",
          subscription: {
            id: sub.id,
            currentPeriodEnd: sub.items?.data?.[0]?.current_period_end ? new Date(sub.items.data[0].current_period_end * 1000) : null,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        };
      }

      return { status: "none", subscription: null };
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return { status: "none", subscription: null };
    }
  }),

  // Get payment history from Stripe
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.stripeCustomerId) {
      return [];
    }

    try {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: ctx.user.stripeCustomerId,
        limit: 10,
      });

      return paymentIntents.data.map((pi: Stripe.PaymentIntent) => ({
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        createdAt: new Date(pi.created * 1000),
        description: pi.description,
      }));
    } catch (error) {
      console.error("Error fetching payment history:", error);
      return [];
    }
  }),

  // Cancel subscription
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user.subscriptionId) {
      throw new Error("No active subscription found");
    }

    try {
      await stripe.subscriptions.update(ctx.user.subscriptionId, {
        cancel_at_period_end: true,
      });

      return { success: true };
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw new Error("Failed to cancel subscription");
    }
  }),
});

// Webhook handler - to be registered in Express
export async function handleStripeWebhook(
  body: Buffer,
  signature: string
): Promise<{ success: boolean; eventType?: string }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    throw new Error("Webhook signature verification failed");
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return { success: true, eventType: "test" };
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.user_id || "0", 10);
      const productKey = session.metadata?.product_key;

      if (userId && session.customer) {
        await updateUserStripeInfo(userId, session.customer as string);
      }

      if (session.mode === "subscription" && session.subscription) {
        await updateUserSubscription(
          userId,
          session.subscription as string,
          "active"
        );
      }

      if (session.mode === "payment" && session.payment_intent) {
        await createPurchase({
          userId,
          stripePaymentIntentId: session.payment_intent as string,
          amount: ((session.amount_total || 0) / 1).toFixed(2),
          currency: session.currency || "jpy",
          status: "succeeded",
          productName: productKey ? PRODUCTS[productKey as ProductKey]?.name : null,
        });
      }

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const user = await getUserByStripeCustomerId(customerId);

      if (user) {
        let status: "none" | "active" | "canceled" | "past_due" = "none";
        if (subscription.status === "active") status = "active";
        else if (subscription.status === "canceled") status = "canceled";
        else if (subscription.status === "past_due") status = "past_due";

        await updateUserSubscription(user.id, subscription.id, status);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const user = await getUserByStripeCustomerId(customerId);

      if (user) {
        await updateUserSubscription(user.id, "", "canceled");
      }
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`);
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }

  return { success: true, eventType: event.type };
}
