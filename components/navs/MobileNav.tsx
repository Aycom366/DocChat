"use client";

import { logout } from "@/actions/auth";
import { ArrowRight, Gem, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const MobileNav = ({
  isAuth,
  isSubscribed,
}: {
  isAuth: boolean;
  isSubscribed: boolean;
}) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const toggleOpen = () => setOpen((prev) => !prev);
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) toggleOpen();
  }, [pathname]);

  const closeOnCurrent = (href: string) => {
    if (pathname === href) {
      toggleOpen();
    }
  };

  return (
    <div className='sm:hidden'>
      <Menu
        onClick={toggleOpen}
        className='relative z-50 h-5 w-5 text-zinc-700'
      />

      {isOpen ? (
        <div className='fixed animate-in slide-in-from-top-5 fade-in-20 inset-0 z-0 w-full'>
          <ul className='absolute bg-white border-b border-zinc-200 shadow-xl grid w-full gap-3 px-10 pt-20 pb-8'>
            {!isAuth ? (
              <>
                <li>
                  <Link
                    onClick={() => closeOnCurrent("/auth/register")}
                    className='flex items-center w-full font-semibold text-green-600'
                    href='/auth/register'
                  >
                    Get started
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </li>
                <li className='my-3 h-px w-full bg-gray-300' />
                <li>
                  <Link
                    onClick={() => closeOnCurrent("/auth/login")}
                    className='flex items-center w-full font-semibold'
                    href='/auth/login'
                  >
                    Sign in
                  </Link>
                </li>
                <li className='my-3 h-px w-full bg-gray-300' />
                <li>
                  <Link
                    onClick={() => closeOnCurrent("/pricing")}
                    className='flex items-center w-full font-semibold'
                    href='/pricing'
                  >
                    Pricing
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    onClick={() => closeOnCurrent("/dashboard")}
                    className='flex items-center w-full font-semibold'
                    href='/dashboard'
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  {isSubscribed ? (
                    <Link href='/dashboard/billing'>Manage Subscription</Link>
                  ) : (
                    <Link href='/pricing'>
                      Upgrade <Gem className='text-blue-600 h-4 w-4 ml-1.5' />
                    </Link>
                  )}
                </li>
                <li className='my-3 h-px w-full bg-gray-300' />
                <li>
                  <form
                    className='w-full'
                    action={() => {
                      startTransition(async () => {
                        await logout();
                      });
                    }}
                  >
                    <button
                      disabled={isPending}
                      type='submit'
                      className='flex items-center w-full font-semibold'
                    >
                      Sign out
                    </button>
                  </form>
                </li>
              </>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default MobileNav;
