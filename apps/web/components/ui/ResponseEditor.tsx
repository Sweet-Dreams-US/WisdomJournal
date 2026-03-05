"use client";

import { useRef, useCallback, type ChangeEvent } from "react";

interface ResponseEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}

export default function ResponseEditor({
  value,
  onChange,
  placeholder = "Share your thoughts...",
  minRows = 6,
}: ResponseEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    autoResize();
  }

  return (
    <div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={minRows}
        className="
          w-full px-4 py-3 rounded-card
          bg-white border border-soft-gray
          text-charcoal placeholder-charcoal/30
          font-body text-base leading-relaxed
          focus:outline-none focus:ring-2 focus:ring-deep-sky/30 focus:border-deep-sky/40
          transition-all duration-200 resize-none
        "
      />
      <div className="flex justify-end mt-1.5">
        <span className="text-xs text-charcoal/40 font-body">
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
      </div>
    </div>
  );
}
