import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@/components/ui/form";
import { Plus, Trash } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  beautifyObjectName,
  getBaseType,
  zodToHtmlInputProps,
} from "../utils";
import { FieldConfigItem, FormLayout } from "../types";
import { INPUT_COMPONENTS } from "../config";
import AutoFormObject from "./object";
import { FieldWrapper } from "../common/field-wrapper";
import AutoFormLabel from "../common/label";

function isZodArray(
  item: z.ZodArray<any> | z.ZodDefault<any>,
): item is z.ZodArray<any> {
  return item instanceof z.ZodArray;
}

function isZodDefault(
  item: z.ZodArray<any> | z.ZodDefault<any>,
): item is z.ZodDefault<any> {
  return item instanceof z.ZodDefault;
}

export default function AutoFormArray({
  name,
  item,
  form,
  path = [],
  fieldConfig,
  layout = FormLayout.VERTICAL,
}: {
  name: string;
  item: z.ZodArray<any> | z.ZodDefault<any>;
  form: ReturnType<typeof useForm>;
  path?: string[];
  fieldConfig?: any;
  layout?: FormLayout;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name,
  });
  const title = (item as any).description ?? beautifyObjectName(name);

  const itemDefType = isZodArray(item)
    ? (item as any)._zod?.def?.element
    : isZodDefault(item)
    ? (item as any)._zod?.def?.innerType?._zod?.def?.element
    : null;

  const elementType = getBaseType(itemDefType);
  const fieldConfigItem: FieldConfigItem = fieldConfig?.[name] ?? {};

  if (elementType === "ZodString" || elementType === "ZodEnum") {
    const InputComponent =
      elementType === "ZodEnum"
        ? INPUT_COMPONENTS.multiselect
        : INPUT_COMPONENTS.tags;

    return (
      <FormField
        control={form.control as any}
        name={name}
        key={name}
        render={({ field }) => {
          const zodInputProps = zodToHtmlInputProps(item);
          const isRequired =
            zodInputProps.required ||
            fieldConfigItem.inputProps?.required ||
            false;

          return (
            <FieldWrapper
              label={
                fieldConfigItem.inputProps?.showLabel !== false ? (
                  <AutoFormLabel
                    label={fieldConfigItem?.label || title}
                    isRequired={isRequired}
                    icon={fieldConfigItem?.icon}
                  />
                ) : undefined
              }
              description={fieldConfigItem.description}
              layout={layout}
            >
              <InputComponent
                zodInputProps={zodInputProps}
                field={field}
                fieldConfigItem={fieldConfigItem}
                label={title}
                isRequired={isRequired}
                zodItem={item as any}
                fieldProps={{
                  ...zodInputProps,
                  ...field,
                  ...fieldConfigItem.inputProps,
                  ref: undefined,
                  showLabel: false,
                }}
              />
            </FieldWrapper>
          );
        }}
      />
    );
  }

  return (
    <AccordionItem value={name} className="border-none">
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>
        {fields.map((_field, index) => {
          const key = _field.id;
          return (
            <div className="mt-4 flex flex-col" key={`${key}`}>
              <AutoFormObject
                schema={itemDefType as z.ZodObject<any, any>}
                form={form}
                fieldConfig={fieldConfig}
                path={[...path, index.toString()]}
                layout={layout}
              />
              <div className="my-4 flex justify-end">
                <Button
                  variant="secondary"
                  size="icon"
                  type="button"
                  className={cn(
                    "hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                  )}
                  onClick={() => remove(index)}
                >
                  <Trash className="size-4 " />
                </Button>
              </div>

              <Separator />
            </div>
          );
        })}
        <Button
          type="button"
          variant="secondary"
          onClick={() => append({})}
          className="mt-4 flex items-center"
        >
          <Plus className="mr-2" size={16} />
          Add
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}
