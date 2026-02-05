import { FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { InputWithTags } from "@/components/ui/input-with-tags";
import { cn } from "@/lib/utils";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";

export default function AutoFormTags({
  label,
  isRequired,
  field,
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
        <InputWithTags
          value={field.value || []}
          onChange={field.onChange}
          {...fieldPropsWithoutShowLabel}
          className={cn(
            fieldConfigItem?.variant === "ghost" &&
              "border-transparent bg-transparent shadow-none hover:border-input focus-within:border-ring focus-within:ring-ring/50",
            fieldPropsWithoutShowLabel.className,
          )}
        />
      </FormControl>
      <AutoFormTooltip fieldConfigItem={fieldConfigItem} />
      <FormMessage />
    </FormItem>
  );
}

