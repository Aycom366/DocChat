"use server";

import { validateRequest } from "@/auth";
import { prisma } from "@/db/prisma";
import { PLANS, stripe } from "@/lib/stripe";
import { getAbsoluteUrl } from "@/lib/utils";

export const createStripeSession = async () => {
  const { session } = await validateRequest();

  if (!session) return { error: "Not authenticated" };

  const billingUrl = getAbsoluteUrl("/dashboard/billing");

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!user) return { error: "User not found" };

  const subscriptionPlan = await getUserSubscriptionPlan();

  //if user is subscribed, take them to a page to manage their subscription, maybe cancel
  if (subscriptionPlan.isSubscribed && user.stripeCustomerId) {
    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: billingUrl,
    });
    return { url: stripeSession.url };
  }

  //if user is not subscribed, take them to a page to subscribe
  const stripeSession = await stripe.checkout.sessions.create({
    success_url: billingUrl,
    cancel_url: billingUrl,
    payment_method_types: ["card", "paypal"],
    mode: "subscription",
    billing_address_collection: "auto",
    line_items: [
      {
        price: PLANS.find((plan) => plan.name === "Pro")?.price.priceIds.test,
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
    },
  });

  return { url: stripeSession.url };
};

export async function getUserSubscriptionPlan() {
  const session = await validateRequest();
  const user = session?.user!;

  if (!user?.id) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: null,
    };
  }

  const dbUser = await prisma.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: null,
    };
  }

  const isSubscribed = Boolean(
    dbUser.stripePriceId &&
      dbUser.stripeCurrentPeriodEnd && // 86400000 = 1 day
      dbUser.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now()
  );

  const plan = isSubscribed
    ? PLANS.find((plan) => plan.price.priceIds.test === dbUser.stripePriceId)
    : null;

  let isCanceled = false;
  if (isSubscribed && dbUser.stripeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      dbUser.stripeSubscriptionId
    );
    isCanceled = stripePlan.cancel_at_period_end;
  }

  return {
    ...plan,
    stripeSubscriptionId: dbUser.stripeSubscriptionId,
    stripeCurrentPeriodEnd: dbUser.stripeCurrentPeriodEnd,
    stripeCustomerId: dbUser.stripeCustomerId,
    isSubscribed,
    isCanceled,
  };
}
