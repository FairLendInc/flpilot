import { FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/tiptap/rich-text-editor-controlled";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";

export default function AutoFormRichText({
  label,
  isRequired,
  fieldConfigItem,
  fieldProps,
  field,
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
        <RichTextEditor
          value={field.value}
          onChange={field.onChange}
          disabled={fieldPropsWithoutShowLabel.disabled}
          className={cn(
            fieldConfigItem.variant === "ghost" &&
              "border-transparent bg-transparent shadow-none",
            fieldPropsWithoutShowLabel.className
          )}
        />
      </FormControl>
      <AutoFormTooltip fieldConfigItem={fieldConfigItem} />
      <FormMessage />
    </FormItem>
  );
}
