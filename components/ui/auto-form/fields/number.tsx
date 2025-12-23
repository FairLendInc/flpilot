import { FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";

export default function AutoFormNumber({
  label,
  isRequired,
  fieldConfigItem,
  fieldProps,
}: AutoFormInputComponentProps) {
  const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
  const showLabel = _showLabel === undefined ? true : _showLabel;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point, minus
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      ".",
      "-",
    ];
    const isNumber = /^[0-9]$/.test(e.key);
    const isAllowed =
      allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey;

    if (!isNumber && !isAllowed) {
      e.preventDefault();
    }
  };

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
        <Input
          type="number"
          {...fieldPropsWithoutShowLabel}
          onKeyDown={handleKeyDown}
          className={cn(
            fieldConfigItem.variant === "ghost" &&
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
