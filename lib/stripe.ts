import Stripe from "stripe";

export const PLANS = [
  {
    name: "Free",
    slug: "free",
    quota: 10,
    pagesPerPdf: 5,
    price: {
      amount: 0,
      priceIds: {
        test: "",
        production: "",
      },
    },
  },
  {
    name: "Pro",
    slug: "pro",
    quota: 50,
    pagesPerPdf: 25,
    price: {
      amount: 14,
      priceIds: {
        test: "price_1PGkaNJ2DQc3veP2ve14gF8d",
        production: "",
      },
    },
  },
];

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
