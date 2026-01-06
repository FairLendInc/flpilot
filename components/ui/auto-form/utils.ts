import React from "react";
import { DefaultValues } from "react-hook-form";
import { z } from "zod";
import { FieldConfig } from "./types";

// TODO: This should support recursive ZodPipe but TypeScript doesn't allow circular type definitions.
export type ZodObjectOrWrapped =
  | z.ZodObject<any, any>
  | z.ZodPipe<z.ZodObject<any, any>, z.ZodObject<any, any>>;

/**
 * Beautify a camelCase string.
 * e.g. "myString" -> "My String"
 */
export function beautifyObjectName(string: string) {
  // if numbers only return the string
  let output = string.replace(/([A-Z])/g, " $1");
  output = output.charAt(0).toUpperCase() + output.slice(1);
  return output;
}

/**
 * Get the lowest level Zod type.
 * This will unpack optionals, refinements, etc.
 */
export function getBaseSchema<
  ChildType extends z.ZodAny | z.ZodObject<any, any> = z.ZodAny,
>(schema: ChildType | z.ZodPipe<ChildType, any>): ChildType | null {
  if (!schema) return null;
  const zodDef = (schema as any)._zod?.def;
  if (!zodDef) return schema as ChildType;
  
  if ("innerType" in zodDef) {
    return getBaseSchema(zodDef.innerType as ChildType);
  }
  if ("in" in zodDef) {
    // ZodPipe - unwrap the input schema
    return getBaseSchema(zodDef.in as ChildType);
  }
  if ("out" in zodDef && !("in" in zodDef)) {
    // Handle other pipe-like structures
    return getBaseSchema(zodDef.out as ChildType);
  }

  return schema as ChildType;
}

/**
 * Get the type name of the lowest level Zod type.
 * This will unpack optionals, refinements, etc.
 */
export function getBaseType(schema: z.ZodAny): string {
  const baseSchema = getBaseSchema(schema);
  if (!baseSchema) return "";
  const zodDef = (baseSchema as any)._zod?.def;
  return zodDef?.type ?? "";
}

/**
 * Search for a "ZodDefault" in the Zod stack and return its value.
 */
export function getDefaultValueInZodStack(schema: z.ZodAny): any {
  const zodDef = (schema as any)._zod?.def;
  if (!zodDef) return undefined;

  if (zodDef.type === "ZodDefault") {
    const defaultValue = zodDef.defaultValue;
    return typeof defaultValue === "function" ? defaultValue() : defaultValue;
  }

  if ("innerType" in zodDef) {
    return getDefaultValueInZodStack(zodDef.innerType as z.ZodAny);
  }
  if ("in" in zodDef) {
    // ZodPipe - check the input schema
    return getDefaultValueInZodStack(zodDef.in as z.ZodAny);
  }

  return undefined;
}

/**
 * Get all default values from a Zod schema.
 */
export function getDefaultValues<Schema extends z.ZodObject<any, any>>(
  schema: Schema,
  fieldConfig?: FieldConfig<z.infer<Schema>>,
) {
  if (!schema) return null;
  const { shape } = schema;
  type DefaultValuesType = DefaultValues<Partial<z.infer<Schema>>>;
  const defaultValues = {} as DefaultValuesType;
  if (!shape) return defaultValues;

  for (const key of Object.keys(shape)) {
    const item = shape[key] as z.ZodAny;

    if (getBaseType(item) === "ZodObject") {
      const defaultItems = getDefaultValues(
        getBaseSchema(item) as unknown as z.ZodObject<any, any>,
        fieldConfig?.[key] as FieldConfig<z.infer<Schema>>,
      );

      if (defaultItems !== null) {
        for (const defaultItemKey of Object.keys(defaultItems)) {
          const pathKey = `${key}.${defaultItemKey}` as keyof DefaultValuesType;
          defaultValues[pathKey] = defaultItems[defaultItemKey] as any;
        }
      }
    } else {
      let defaultValue = getDefaultValueInZodStack(item);
      if (
        (defaultValue === null || defaultValue === "") &&
        fieldConfig?.[key]?.inputProps
      ) {
        defaultValue = (fieldConfig?.[key]?.inputProps as unknown as any)
          .defaultValue;
      }
      if (defaultValue !== undefined) {
        defaultValues[key as keyof DefaultValuesType] = defaultValue;
      }
    }
  }

  return defaultValues;
}

export function getObjectFormSchema(
  schema: ZodObjectOrWrapped,
): z.ZodObject<any, any> {
  const zodDef = (schema as any)._zod?.def;
  if (zodDef?.type === "ZodPipe" && "in" in zodDef) {
    // ZodPipe - unwrap the input schema
    return getObjectFormSchema(zodDef.in as z.ZodObject<any, any>);
  }
  return schema as z.ZodObject<any, any>;
}

/**
 * Convert a Zod schema to HTML input props to give direct feedback to the user.
 * Once submitted, the schema will be validated completely.
 */
export function zodToHtmlInputProps(
  schema:
    | z.ZodNumber
    | z.ZodString
    | z.ZodOptional<z.ZodNumber | z.ZodString>
    | any,
): React.InputHTMLAttributes<HTMLInputElement> {
  const zodDef = (schema as any)._zod?.def;
  if (!zodDef) {
    return { required: true };
  }

  if (zodDef.type === "ZodOptional" || zodDef.type === "ZodNullable") {
    const typedSchema = schema as z.ZodOptional<z.ZodNumber | z.ZodString>;
    return {
      ...zodToHtmlInputProps(zodDef.innerType as z.ZodNumber | z.ZodString),
      required: false,
    };
  }
  const typedSchema = schema as z.ZodNumber | z.ZodString;

  const checks = zodDef.checks;
  if (!checks || !Array.isArray(checks)) {
    return {
      required: true,
    };
  }

  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    required: true,
  };
  const type = getBaseType(schema);

  for (const check of checks) {
    const checkDef = (check as any)._zod?.def;
    if (!checkDef) continue;
    
    const checkType = checkDef.check;
    if (checkType === "min_length" || checkType === "greater_than") {
      const value = checkDef.minimum ?? checkDef.value;
      if (type === "ZodString") {
        inputProps.minLength = value;
      } else {
        inputProps.min = value;
      }
    }
    if (checkType === "max_length" || checkType === "less_than") {
      const value = checkDef.maximum ?? checkDef.value;
      if (type === "ZodString") {
        inputProps.maxLength = value;
      } else {
        inputProps.max = value;
      }
    }
  }

  return inputProps;
}

/**
 * Sort the fields by order.
 * If no order is set, the field will be sorted based on the order in the schema.
 */

export function sortFieldsByOrder<SchemaType extends z.ZodObject<any, any>>(
  fieldConfig: FieldConfig<z.infer<SchemaType>> | undefined,
  keys: string[]
) {
  const sortedFields = keys.sort((a, b) => {
    const fieldA: number = (fieldConfig?.[a]?.order as number) ?? 0;
    const fieldB = (fieldConfig?.[b]?.order as number) ?? 0;
    return fieldA - fieldB;
  });

  return sortedFields;
}