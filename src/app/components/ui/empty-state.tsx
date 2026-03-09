import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-[12px] bg-surface-alt flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-foreground-secondary opacity-50" />
      </div>
      <h3 className="text-[0.875rem] font-semibold text-foreground mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-[0.875rem] text-foreground-secondary max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
