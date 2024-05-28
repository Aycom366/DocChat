"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ElementType, ReactNode } from "react";

export const Container = ({
  className,
  children,
  as: Component = "section",
}: {
  children: ReactNode;
  as?: ElementType;
  className?: HTMLDivElement["className"];
}) => {
  const pathname = usePathname();

  return (
    <Component
      className={cn(
        "mx-auto flex flex-col gap-4 w-full max-w-screen-xl px-2.5 md:px-20",
        className
      )}
    >
      {children}
      {pathname === "/auth/login" ? (
        <div className='flex flex-row text-sm items-center gap-1'>
          <p>Don&apos;t have an account?</p>
          <Link className='underline font-medium' href='/auth/register'>
            Register
          </Link>
        </div>
      ) : (
        <div className='flex text-sm flex-row items-center gap-1'>
          <p>Have an account?</p>
          <Link className='underline font-medium' href='/auth/login'>
            Log In
          </Link>
        </div>
      )}
    </Component>
  );
};
