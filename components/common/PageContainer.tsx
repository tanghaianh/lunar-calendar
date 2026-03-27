import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn("mx-auto w-full max-w-5xl px-4 py-8", className)}>
      {children}
    </main>
  );
}
