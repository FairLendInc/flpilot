import { FormControl, FormItem, FormMessage } from "@/components/ui/form";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { cn } from "@/lib/utils";
import * as z from "zod";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";
import { getBaseSchema } from "../utils";

export default function AutoFormMultiSelect({
  label,
  isRequired,
  field,
  fieldConfigItem,
  zodItem,
  fieldProps,
}: AutoFormInputComponentProps) {
  const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
  const showLabel = _showLabel === undefined ? true : _showLabel;

  // Extract enum values from the array item schema
  const itemSchema = getBaseSchema(
    (zodItem as any)._zod?.def?.element || (zodItem as any)._zod?.def?.type,
  ) as unknown as z.ZodEnum<any>;

  const baseValues = itemSchema?.options ?? itemSchema?.enum ?? [];
  const options: Option[] = Array.isArray(baseValues) 
    ? baseValues.map((value) => ({ label: value, value }))
    : Object.entries(baseValues).map(([value, label]) => ({ label: label as string, value }));

  const selectedOptions = (field.value || []).map((v: string) => ({
    label: v,
    value: v,
  }));

  const handleValueChange = (newOptions: Option[]) => {
    field.onChange(newOptions.map((o) => o.value));
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
        <MultipleSelector
          value={selectedOptions}
          onChange={handleValueChange}
          defaultOptions={options}
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

