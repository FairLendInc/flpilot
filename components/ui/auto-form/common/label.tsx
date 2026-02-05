import { FormLabel } from "@/components/ui/form";
import { cn } from "@/lib/utils";

function AutoFormLabel({
  label,
  isRequired,
  icon,
  className,
}: {
  label: string;
  isRequired: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <FormLabel
        className={cn(
          "flex min-w-0 items-center gap-2 text-[12px] font-normal text-muted-foreground",
          className,
        )}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate">{label}</span>
        {isRequired && <span className="text-destructive"> *</span>}
      </FormLabel>
    </>
  );
}

export default AutoFormLabel;
