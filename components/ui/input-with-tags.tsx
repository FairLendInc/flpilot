"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TagProps {
  text: string;
  onRemove: () => void;
}

type TagItem = {
  id: string;
  text: string;
};

const Tag = ({ text, onRemove }: TagProps) => {
return (
  <motion.span
    initial={{ opacity: 0, scale: 0.8, y: -10, filter: "blur(10px)" }}
    animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, scale: 0.8, y: -10, filter: "blur(10px)" }}
    transition={{
      duration: 0.4,
      ease: "circInOut",
      type: "spring",
    }}
    className="bg-accent/50 px-2 py-1 rounded-xl text-sm flex items-center gap-1 shadow-sm backdrop-blur-sm text-accent-foreground"
  >
    {text}
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <Button
        onClick={onRemove}
        type="button"
        aria-label="Remove tag"
        className="bg-transparent text-xs h-fit flex items-center rounded-full justify-center text-accent-foreground p-1 hover:bg-accent"
      >
        <X className="w-4 h-4" />
      </Button>
    </motion.div>
  </motion.span>
);
};

interface InputWithTagsProps {
  placeholder?: string;
  className?: string;
  limit?: number;
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
}

const InputWithTags = ({
  placeholder,
  className,
  limit = 10,
  value,
  onChange,
  disabled,
}: InputWithTagsProps) => {
  const [internalTags, setInternalTags] = useState<TagItem[]>([]);
  const currentValues = value ?? internalTags.map((tag) => tag.text);

  const [inputValue, setInputValue] = useState("");

  const buildTagItems = (values: string[], previous: TagItem[]) => {
    const remaining = [...previous];
    return values.map((text) => {
      const matchIndex = remaining.findIndex((item) => item.text === text);
      if (matchIndex >= 0) {
        const [match] = remaining.splice(matchIndex, 1);
        return match;
      }
      return { id: crypto.randomUUID(), text };
    });
  };

  useEffect(() => {
    if (value !== undefined) {
      setInternalTags((prev) => buildTagItems(value, prev));
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!limit || currentValues.length < limit) {
        const newValues = [...currentValues, inputValue.trim()];
        if (onChange) {
          onChange(newValues);
        }
        setInternalTags((prev) => buildTagItems(newValues, prev));
        setInputValue("");
      }
    }
  };

  const removeTag = (idToRemove: string) => {
    const newTags = internalTags.filter((tag) => tag.id !== idToRemove);
    const newValues = newTags.map((tag) => tag.text);
    if (onChange) {
      onChange(newValues);
    }
    setInternalTags(newTags);
  };

  return (
    <div className={cn("flex flex-col gap-2 max-w-xl w-full", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      >
        <motion.input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type something and press Enter..."}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full px-4 py-2 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          disabled={disabled || (limit ? currentValues.length >= limit : false)}
        />
      </motion.div>
    <div className="flex flex-wrap gap-2">
      <AnimatePresence>
        {internalTags.map((tag) => (
          <Tag key={tag.id} text={tag.text} onRemove={() => removeTag(tag.id)} />
        ))}
      </AnimatePresence>
    </div>
  </div>
);
};

export { InputWithTags };


