import { cn } from "@/lib/utils";
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
        "mx-auto w-full max-w-screen-xl px-2.5 md:px-20",
        className
      )}
    >
      {children}
    </Component>
  );
};
