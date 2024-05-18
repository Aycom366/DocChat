"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { useTransition } from "react";
import { createStripeSession } from "@/actions/stripe";
import { toast } from "sonner";

export const UpgradeButton = () => {
  const [isPending, startTransition] = useTransition();

  const createStripe = async () => {
    startTransition(async () => {
      const res = await createStripeSession();
      if (res.error) {
        toast.error(res.error);
      } else {
        window.location.href = res.url ?? "/dashboard/billing";
      }
    });
  };

  return (
    <Button onClick={createStripe} disabled={isPending} className='w-full'>
      Upgrade now <ArrowRight className='h-5 w-5 ml-1.5' />
    </Button>
  );
};
