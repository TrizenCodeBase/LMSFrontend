import { Loader2 } from "lucide-react";

interface ContentLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const ContentLoader = ({ 
  message = "Loading...",
  size = "md" 
}: ContentLoaderProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary mr-2`} />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}; 