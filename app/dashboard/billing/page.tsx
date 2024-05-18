import { getUserSubscriptionPlan } from "@/actions/stripe";
import { BillingForm } from "@/components/dashboard/BillingForm";

const Page = async () => {
  const subscriptionPlan = await getUserSubscriptionPlan();
  return <BillingForm subscriptionPlan={subscriptionPlan} />;
};

export default Page;
