import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import * as z from "zod";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";
import { getBaseSchema } from "../utils";

export default function AutoFormRadioGroup({
  label,
  isRequired,
  field,
  zodItem,
  fieldProps,
  fieldConfigItem,
}: AutoFormInputComponentProps) {
  const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
  const showLabel = _showLabel === undefined ? true : _showLabel;

  const baseSchema = getBaseSchema(zodItem) as unknown as z.ZodEnum<any>;
  const baseValues = baseSchema?.options ?? baseSchema?.enum;

  let values: string[] = [];
  if (!Array.isArray(baseValues)) {
    values = Object.entries(baseValues || {}).map((item) => item[0]);
  } else {
    values = baseValues;
  }

  return (
    <div>
      <FormItem>
        {showLabel && (
          <AutoFormLabel
            label={fieldConfigItem?.label || label}
            isRequired={isRequired}
            icon={fieldConfigItem?.icon}
          />
        )}
        <FormControl>
          <RadioGroup
            onValueChange={field.onChange}
            value={field.value}
            {...fieldPropsWithoutShowLabel}
          >
            {values?.map((value: any) => (
              <FormItem
                key={value}
                className={cn("mb-2 flex items-center gap-3 space-y-0")}
              >
                <FormControl>
                  <RadioGroupItem value={value} />
                </FormControl>
                <FormLabel className="font-normal">{value}</FormLabel>
              </FormItem>
            ))}
          </RadioGroup>
        </FormControl>
        <FormMessage />
      </FormItem>
      <AutoFormTooltip fieldConfigItem={fieldConfigItem} />
    </div>
  );
}
