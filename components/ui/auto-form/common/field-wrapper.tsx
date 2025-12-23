import { FormLayout } from "../types";
import { cn } from "@/lib/utils";

interface FieldWrapperProps {
  children: React.ReactNode;
  label?: React.ReactNode;
  description?: React.ReactNode;
  layout?: FormLayout;
  className?: string;
}

export function FieldWrapper({
  children,
  label,
  description,
  layout = FormLayout.VERTICAL,
  className,
}: FieldWrapperProps) {
  if (layout === FormLayout.SIDEBYSIDE) {
    return (
      <div
        className={cn(
          "grid grid-cols-[100px_minmax(0,1fr)] gap-4 items-start",
          className,
        )}
      >
        {label && (
          <div className="min-w-0 pt-1">{label}</div>
        )}
        <div className="min-w-0">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2 ", className)}>
      {label && (
        <div className="flex flex-col gap-1">
          {label}
          {description && (
            <p className="text-[13px] text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
