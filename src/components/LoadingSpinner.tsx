
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideProps } from "lucide-react";

export const LoadingSpinner = ({ className, ...props }: LucideProps) => (
  <Loader2 className={cn("h-4 w-4 animate-spin", className)} {...props} />
);
