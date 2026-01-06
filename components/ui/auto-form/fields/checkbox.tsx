import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormItem } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";
import AutoFormLabel from "../common/label";

export default function AutoFormCheckbox({
  label,
  isRequired,
  field,
  fieldConfigItem,
  fieldProps,
}: AutoFormInputComponentProps) {
  const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
  const showLabel = _showLabel === undefined ? true : _showLabel;

  return (
    <div>
      <FormItem>
        <div className={cn("mb-3 flex items-center gap-3")}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              {...fieldPropsWithoutShowLabel}
            />
          </FormControl>
          {showLabel && (
            <AutoFormLabel
              label={fieldConfigItem?.label || label}
              isRequired={isRequired}
              icon={fieldConfigItem?.icon}
            />
          )}
        </div>
      </FormItem>
      <AutoFormTooltip fieldConfigItem={fieldConfigItem} />
    </div>
  );
}
