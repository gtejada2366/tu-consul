import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./card";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "positive",
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
}: StatCardProps) {
  const changeColorClass = {
    positive: "text-success",
    negative: "text-danger",
    neutral: "text-foreground-secondary",
  }[changeType];

  return (
    <Card className="hover:shadow-md transition-shadow duration-150">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">
              {title}
            </p>
            <p className="text-[1.75rem] font-semibold text-foreground">
              {value}
            </p>
            {change && (
              <p className={`text-[0.75rem] mt-1 ${changeColorClass}`}>
                {change}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-[10px] ${iconBgColor} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
