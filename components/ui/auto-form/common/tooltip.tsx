import { cn } from "@/lib/utils";

function AutoFormTooltip({ fieldConfigItem }: { fieldConfigItem: any }) {
  return (
    <>
      {fieldConfigItem?.description && (
        <p className={cn("text-sm text-muted-foreground")}>
          {fieldConfigItem.description}
        </p>
      )}
    </>
  );
}

export default AutoFormTooltip;
