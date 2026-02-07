import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FormField } from "@/components/ui/form";
import { useForm, useFormContext } from "react-hook-form";
import * as z from "zod";
import { DEFAULT_ZOD_HANDLERS, INPUT_COMPONENTS } from "../config";
import { Dependency, FieldConfig, FieldConfigItem, FormLayout } from "../types";
import {
  beautifyObjectName,
  getBaseSchema,
  getBaseType,
  sortFieldsByOrder,
  zodToHtmlInputProps,
} from "../utils";
import AutoFormArray from "./array";
import resolveDependencies from "../dependencies";
import { FieldWrapper } from "../common/field-wrapper";
import AutoFormLabel from "../common/label";

function DefaultParent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function AutoFormObject<
  SchemaType extends z.ZodObject<any, any>,
>({
  schema,
  form,
  fieldConfig,
  path = [],
  dependencies = [],
  layout = FormLayout.VERTICAL,
}: {
  schema: SchemaType | z.ZodPipe<SchemaType, any>;
  form: ReturnType<typeof useForm>;
  fieldConfig?: FieldConfig<z.infer<SchemaType>>;
  path?: string[];
  dependencies?: Dependency<z.infer<SchemaType>>[];
  layout?: FormLayout;
}) {
  const { watch } = useFormContext(); // Use useFormContext to access the watch function

  if (!schema) {
    return null;
  }
  const { shape } = getBaseSchema<SchemaType>(schema) || {};

  if (!shape) {
    return null;
  }

  const handleIfZodNumber = (item: z.ZodAny) => {
    const zodDef = (item as any)._zod?.def;
    const isZodNumber = zodDef?.type === "ZodNumber";
    const isInnerZodNumber = zodDef?.innerType?._zod?.def?.type === "ZodNumber";

    if (isZodNumber) {
      zodDef.coerce = true;
    } else if (isInnerZodNumber) {
      zodDef.innerType._zod.def.coerce = true;
    }

    return item;
  };

  const sortedFieldKeys = sortFieldsByOrder(fieldConfig, Object.keys(shape));
  const accordionClassName = layout === FormLayout.SIDEBYSIDE ? "space-y-4 border-none" : "space-y-5 border-none";

  return (
    <Accordion type="multiple" className={accordionClassName}>
      {sortedFieldKeys.map((name) => {
        let item = shape[name] as z.ZodAny;
        item = handleIfZodNumber(item) as z.ZodAny;
        const zodBaseType = getBaseType(item);
        const itemName = (item as any).description ?? beautifyObjectName(name);
        const key = [...path, name].join(".");

        const {
          isHidden,
          isDisabled,
          isRequired: isRequiredByDependency,
          overrideOptions,
        } = resolveDependencies(dependencies, name, watch);
        if (isHidden) {
          return null;
        }

        if (zodBaseType === "ZodObject") {
          return (
            <AccordionItem value={name} key={key} className="border-none">
              <AccordionTrigger>{itemName}</AccordionTrigger>
              <AccordionContent className="p-2">
                <AutoFormObject
                  schema={item as unknown as z.ZodObject<any, any>}
                  form={form}
                  fieldConfig={
                    (fieldConfig?.[name] ?? {}) as FieldConfig<
                      z.infer<typeof item>
                    >
                  }
                  path={[...path, name]}
                  layout={layout}
                />
              </AccordionContent>
            </AccordionItem>
          );
        }
        if (zodBaseType === "ZodArray") {
          return (
            <AutoFormArray
              key={key}
              name={name}
              item={item as unknown as z.ZodArray<any>}
              form={form}
              fieldConfig={fieldConfig?.[name] ?? {}}
              path={[...path, name]}
              layout={layout}
            />
          );
        }

        const fieldConfigItem: FieldConfigItem = fieldConfig?.[name] ?? {};
        const zodInputProps = zodToHtmlInputProps(item);
        const isRequired =
          isRequiredByDependency ||
          zodInputProps.required ||
          fieldConfigItem.inputProps?.required ||
          false;

        if (overrideOptions) {
          item = z.enum(overrideOptions) as unknown as z.ZodAny;
        }

        return (
          <FormField
            control={form.control as any}
            name={key}
            key={key}
            render={({ field }) => {
              const inputType =
                fieldConfigItem.fieldType ??
                DEFAULT_ZOD_HANDLERS[zodBaseType] ??
                "fallback";

              const InputComponent =
                typeof inputType === "function"
                  ? inputType
                  : INPUT_COMPONENTS[inputType];

              const ParentElement =
                fieldConfigItem.renderParent ?? DefaultParent;

              const defaultValue = fieldConfigItem.inputProps?.defaultValue;
              const value = field.value ?? defaultValue ?? "";

              const fieldProps = {
                ...zodToHtmlInputProps(item),
                ...field,
                ...fieldConfigItem.inputProps,
                disabled: fieldConfigItem.inputProps?.disabled || isDisabled,
                ref: undefined,
                value: value,
                showLabel: false,
              };

              if (InputComponent === undefined) {
                return <></>;
              }

              return (
                <ParentElement key={`${key}.parent`}>
                  <FieldWrapper
                    label={
                      fieldConfigItem.inputProps?.showLabel !== false ? (
                        <AutoFormLabel
                          label={fieldConfigItem?.label || itemName}
                          isRequired={isRequired}
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
                      label={itemName}
                      isRequired={isRequired}
                      zodItem={item}
                      fieldProps={fieldProps}
                      className={fieldProps.className}
                    />
                  </FieldWrapper>
                </ParentElement>
              );
            }}
          />
        );
      })}
    </Accordion>
  );
}
