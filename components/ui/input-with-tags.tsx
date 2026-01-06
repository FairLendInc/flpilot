"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Tag {
text: string;
onRemove: () => void;
}

const Tag = ({ text, onRemove }: Tag) => {
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
  const [internalTags, setInternalTags] = useState<string[]>([]);
  const tags = value !== undefined ? value : internalTags;

  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!limit || tags.length < limit) {
        const newTags = [...tags, inputValue.trim()];
        if (onChange) {
          onChange(newTags);
        } else {
          setInternalTags(newTags);
        }
        setInputValue("");
      }
    }
  };

  const removeTag = (indexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    if (onChange) {
      onChange(newTags);
    } else {
      setInternalTags(newTags);
    }
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
          disabled={disabled || (limit ? tags.length >= limit : false)}
        />
      </motion.div>
    <div className="flex flex-wrap gap-2">
      <AnimatePresence>
        {tags.map((tag, index) => (
          <Tag key={index} text={tag} onRemove={() => removeTag(index)} />
        ))}
      </AnimatePresence>
    </div>
  </div>
);
};

export { InputWithTags };


