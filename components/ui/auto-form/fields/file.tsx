import { FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";
export default function AutoFormFile({
  label,
  isRequired,
  fieldConfigItem,
  fieldProps,
  field,
}: AutoFormInputComponentProps) {
  const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
  const showLabel = _showLabel === undefined ? true : _showLabel;
  const [file, setFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFile(reader.result as string);
        setFileName(file.name);
        field.onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveClick = () => {
    setFile(null);
    setFileName(null);
    field.onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
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
      {!file && (
        <FormControl>
          <Input
            type="file"
            ref={inputRef}
            {...fieldPropsWithoutShowLabel}
            onChange={handleFileChange}
            value={""}
            className={cn(
              fieldConfigItem?.variant === "ghost" &&
                "border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring focus-visible:ring-ring/50 placeholder:text-muted-foreground/50 text-foreground",
              fieldPropsWithoutShowLabel.className,
            )}
          />
        </FormControl>
      )}
      {file && (
        <div
          className={cn(
            "flex h-[40px] w-full flex-row items-center justify-between space-x-2 rounded-sm border p-2 text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 bg-background",
            fieldConfigItem?.variant === "ghost" && "border-transparent bg-transparent shadow-none hover:border-input",
          )}
        >
          <p>{fileName}</p>
          <button
            onClick={handleRemoveClick}
            aria-label="Remove image"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
      <AutoFormTooltip fieldConfigItem={fieldConfigItem} />
      <FormMessage />
    </FormItem>
  );
}
