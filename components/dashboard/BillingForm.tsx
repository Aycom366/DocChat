"use client";

import { createStripeSession, getUserSubscriptionPlan } from "@/actions/stripe";
import { MaxWidthWrapper } from "../shared";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useTransition } from "react";
import { toast } from "sonner";

interface BillingFormProps {
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
}

export const BillingForm = ({ subscriptionPlan }: BillingFormProps) => {
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    startTransition(async () => {
      const { url } = await createStripeSession();
      if (url) window.location.href = url;
      if (!url) {
        toast.error("There was a problem...", {
          description: "Please try again in a moment",
        });
      }
    });
  };

  return (
    <MaxWidthWrapper className='max-w-5xl'>
      <form
        className='mt-12'
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
            <CardDescription>
              You are currently on the <strong>{subscriptionPlan.name}</strong>{" "}
              plan.
            </CardDescription>
          </CardHeader>

          <CardFooter className='flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0'>
            <Button disabled={isPending} type='submit'>
              {isPending ? (
                <Loader2 className='mr-4 h-4 w-4 animate-spin' />
              ) : null}
              {subscriptionPlan.isSubscribed
                ? "Manage Subscription"
                : "Upgrade to PRO"}
            </Button>

            {subscriptionPlan.isSubscribed ? (
              <p className='rounded-full text-xs font-medium'>
                {subscriptionPlan.isCanceled
                  ? "Your plan will be canceled on "
                  : "Your plan renews on "}
                {format(subscriptionPlan.stripeCurrentPeriodEnd!, "dd.MM.yyyy")}
                .
              </p>
            ) : null}
          </CardFooter>
        </Card>
      </form>
    </MaxWidthWrapper>
  );
};
