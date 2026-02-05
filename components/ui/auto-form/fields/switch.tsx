import { FormControl, FormItem } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";

export default function AutoFormSwitch({
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
        <div className={cn("flex items-center gap-3")}>
          <FormControl>
            <Switch
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
