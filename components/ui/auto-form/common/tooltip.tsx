import { cn } from "@/lib/utils";
import type { FieldConfigItem } from "../types";

function AutoFormTooltip({
  fieldConfigItem,
}: {
  fieldConfigItem: FieldConfigItem;
}) {
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
