import Link from "next/link";
import { Container } from "../shared";
import { buttonVariants } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import UserAccountNav from "./userAccountNav";

export const Navbar = async () => {
  const session = await auth();

  return (
    <nav className='sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all'>
      <Container>
        <div className='flex h-14 items-center justify-between border-b border-zinc-200'>
          <Link href='/' className='flex z-40 font-semibold'>
            <span>DocChat.</span>
          </Link>
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
              <>
                <Link
                  href='/dashboard'
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  })}
                >
                  Dashboard
                </Link>
                <UserAccountNav
                  name={
                    // !user.given_name || !user.family_name
                    //   ? "Your Account"
                    //   : `${user.given_name} ${user.family_name}`
                    session?.user?.name ?? ""
                  }
                  email={session?.user?.email ?? ""}
                  imageUrl={session?.user?.image ?? ""}
                />
              </>
            )}
          </div>
        </div>
      </Container>
    </nav>
  );
};
