import { prisma } from "@/db/prisma";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import type Stripe from "stripe";

const updateAllFilesToSuccess = async (userId: string) => {
  await prisma.file.updateMany({
    where: {
      userId,
      uploadStatus: "FAILED",
    },
    data: {
      uploadStatus: "SUCCESS",
    },
  });
};

export async function POST(request: Request) {
  //The text() method reads the entire request body and returns it as a string.
  const body = await request.text();
  const signature = headers().get("Stripe-Signature") ?? "";

  let event: Stripe.Event;

  try {
    /**
     * validate that this event actually came from Stripe
     * to prevent anyone from calling this endpoint to give themselves a pro plan
     */
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`,
      { status: 400 }
    );
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (!session?.metadata?.userId) {
    return new Response(null, {
      status: 200,
    });
  }

  /**
   * if the user buys for the first time and the user completed the checkout
   */
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await prisma.user.update({
      where: {
        // meta data comes from the Plan Object in createSession
        id: session.metadata.userId,
      },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0]?.price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });

    await updateAllFilesToSuccess(session.metadata.userId);
  }

  /**
   * if the user is already subscribed and the payment is successful
   */
  if (event.type === "invoice.payment_succeeded") {
    // Retrieve the subscription details from Stripe.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await prisma.user.update({
      where: {
        /**
         * we've already created the user in the checkout session
         * so we can use the subscription id to find the user
         */
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0]?.price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });

    await updateAllFilesToSuccess(session.metadata.userId);
  }

  return new Response(null, { status: 200 });
}
