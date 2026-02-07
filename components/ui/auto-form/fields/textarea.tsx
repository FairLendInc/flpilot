import { FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";

export default function AutoFormTextarea({
  label,
  isRequired,
  fieldConfigItem,
  fieldProps,
}: AutoFormInputComponentProps) {
  const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
  const showLabel = _showLabel === undefined ? true : _showLabel;
  return (
    <FormItem>
      {showLabel && (
        <AutoFormLabel
          label={fieldConfigItem?.label || label}
          isRequired={isRequired}
          icon={fieldConfigItem?.icon}
        />
      )}
      <FormControl>
        <Textarea
          {...fieldPropsWithoutShowLabel}
          className={cn(
            fieldConfigItem?.variant === "ghost" &&
              "border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring focus-visible:ring-ring/50 placeholder:text-muted-foreground/50 text-foreground",
            fieldPropsWithoutShowLabel.className,
          )}
        />
      </FormControl>
      <AutoFormTooltip fieldConfigItem={fieldConfigItem} />
      <FormMessage />
    </FormItem>
  );
}
