import { cn } from "@/lib/utils";
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
  return (
    <Component
      className={cn(
        "mx-auto flex flex-col gap-4 w-full max-w-screen-xl px-2.5 md:px-20",
        className
      )}
    >
      {children}
    </Component>
  );
};
