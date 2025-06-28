import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down';
    period: string;
  };
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor = "text-primary",
  className 
}: StatsCardProps) {
  return (
    <div className={cn("bg-card rounded-lg shadow-sm p-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          iconColor === "text-primary" && "bg-primary/10",
          iconColor === "text-secondary" && "bg-secondary/10", 
          iconColor === "text-accent" && "bg-accent/10",
          iconColor === "text-destructive" && "bg-destructive/10"
        )}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
      </div>
      
      {change && (
        <div className="mt-4 flex items-center text-sm">
          <svg 
            className={cn(
              "w-4 h-4 mr-1",
              change.trend === 'up' ? "text-secondary" : "text-destructive"
            )}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={change.trend === 'up' ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} 
            />
          </svg>
          <span className={cn(
            "font-medium",
            change.trend === 'up' ? "text-secondary" : "text-destructive"
          )}>
            {change.value}
          </span>
          <span className="text-muted-foreground ml-1">{change.period}</span>
        </div>
      )}
    </div>
  );
}
