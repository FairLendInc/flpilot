import { FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";

export default function AutoFormInput({
  label,
  isRequired,
  fieldConfigItem,
  fieldProps,
}: AutoFormInputComponentProps) {
  const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
  const showLabel = _showLabel === undefined ? true : _showLabel;
  const type = fieldProps.type || "text";

  return (
    <div className="flex flex-row items-center space-x-2">
      <FormItem className="flex w-full flex-col justify-start">
        {showLabel && (
          <AutoFormLabel
            label={fieldConfigItem?.label || label}
            isRequired={isRequired}
            icon={fieldConfigItem?.icon}
          />
        )}
        <FormControl>
          <Input
            type={type}
            {...fieldPropsWithoutShowLabel}
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
    </div>
  );
}
