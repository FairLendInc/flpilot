import AutoFormCheckbox from "./fields/checkbox";
import AutoFormDate from "./fields/date";
import AutoFormEnum from "./fields/enum";
import AutoFormFile from "./fields/file";
import AutoFormInput from "./fields/input";
import AutoFormNumber from "./fields/number";
import AutoFormRadioGroup from "./fields/radio-group";
import AutoFormRichText from "./fields/richtext";
import AutoFormSwitch from "./fields/switch";
import AutoFormTextarea from "./fields/textarea";
import AutoFormTags from "./fields/tags";
import AutoFormMultiSelect from "./fields/multiselect";

export const INPUT_COMPONENTS = {
  checkbox: AutoFormCheckbox,
  date: AutoFormDate,
  select: AutoFormEnum,
  radio: AutoFormRadioGroup,
  richtext: AutoFormRichText,
  switch: AutoFormSwitch,
  textarea: AutoFormTextarea,
  number: AutoFormNumber,
  file: AutoFormFile,
  tags: AutoFormTags,
  multiselect: AutoFormMultiSelect,
  fallback: AutoFormInput,
};

/**
 * Define handlers for specific Zod types.
 * You can expand this object to support more types.
 */
export const DEFAULT_ZOD_HANDLERS: {
  [key: string]: keyof typeof INPUT_COMPONENTS;
} = {
  ZodBoolean: "checkbox",
  ZodDate: "date",
  ZodEnum: "select",
  ZodNativeEnum: "select",
  ZodNumber: "number",
};
