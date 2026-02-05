import { FormControl, FormItem, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import * as z from "zod";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";
import { getBaseSchema } from "../utils";

export default function AutoFormEnum({
  label,
  isRequired,
  field,
  fieldConfigItem,
  zodItem,
  fieldProps,
}: AutoFormInputComponentProps) {
  const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
  const showLabel = _showLabel === undefined ? true : _showLabel;

  const baseSchema = getBaseSchema(zodItem) as unknown as z.ZodEnum<any>;
  const baseValues = baseSchema?.options ?? baseSchema?.enum;

  let values: [string, string][] = [];
  if (!Array.isArray(baseValues)) {
    values = Object.entries(baseValues || {});
  } else {
    values = baseValues.map((value) => [value, value]);
  }

  function findItem(value: any) {
    return values.find((item) => item[0] === value);
  }

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
        <Select
          onValueChange={field.onChange}
          defaultValue={field.value}
          {...fieldPropsWithoutShowLabel}
        >
          <SelectTrigger
            className={cn(
              fieldConfigItem?.variant === "ghost" &&
                "border-transparent bg-transparent shadow-none hover:border-input focus:border-ring focus:ring-ring/50 data-[placeholder]:text-muted-foreground/50 text-foreground",
              fieldPropsWithoutShowLabel.className,
            )}
          >
            <SelectValue placeholder={fieldConfigItem.inputProps?.placeholder}>
              {field.value ? findItem(field.value)?.[1] : "Select an option"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {values.map(([value, label]) => (
              <SelectItem value={value} key={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      <AutoFormTooltip fieldConfigItem={fieldConfigItem} />
      <FormMessage />
    </FormItem>
  );
}
