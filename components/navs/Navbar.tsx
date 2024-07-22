import Link from "next/link";
import { MaxWidthWrapper } from "../shared";
import { buttonVariants } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { validateRequest } from "@/auth";
import UserAccountNav from "./userAccountNav";
import MobileNav from "./MobileNav";
import { getUserSubscriptionPlan } from "@/actions/stripe";

export const Navbar = async () => {
  const session = await validateRequest();
  const subscriptionPlan = await getUserSubscriptionPlan();

  return (
    <nav className='sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all'>
      <MaxWidthWrapper>
        <div className='flex h-14 items-center justify-between border-b border-zinc-200'>
          <Link href='/' className='flex z-40 font-semibold'>
            <span>DocChat.</span>
          </Link>

          <MobileNav
            isSubscribed={subscriptionPlan.isSubscribed}
            isAuth={!!session?.user}
          />

          <div className='hidden items-center space-x-4 sm:flex'>
            {!session?.user ? (
              <>
                <Link
                  href='/pricing'
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  })}
                >
                  Pricing
                </Link>
                <Link
                  href={"/auth/login"}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  })}
                >
                  Sign In
                </Link>
                <Link
                  href={"/auth/register"}
                  className={buttonVariants({
                    size: "sm",
                  })}
                >
                  Get Started <ArrowRight className='ml-1.5 h-5 w-5' />
                </Link>
              </>
            ) : (
              <UserAccountNav
                isSubscribed={subscriptionPlan.isSubscribed}
                name={session?.user?.name ?? ""}
                email={session?.user?.email ?? ""}
                imageUrl={session?.user?.image ?? ""}
              />
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};
