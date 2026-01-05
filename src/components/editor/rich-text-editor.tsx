"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorToolbar } from "./editor-toolbar";
import { cn } from "@/lib/utils";
import { Code2, Eye } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  disabled = false,
  className,
}: RichTextEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline hover:text-primary/80",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Underline,
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlContent(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none min-h-[200px] p-4 focus:outline-none",
          "prose-headings:font-semibold prose-h2:text-xl prose-h3:text-lg prose-h4:text-base",
          "prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0",
          "prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
        ),
      },
    },
  });

  // Sync htmlContent when content prop changes externally
  useEffect(() => {
    setHtmlContent(content);
  }, [content]);

  const handleHtmlModeToggle = useCallback(() => {
    if (isHtmlMode && editor) {
      // Switching from HTML mode to visual mode - update editor content
      editor.commands.setContent(htmlContent);
    }
    setIsHtmlMode(!isHtmlMode);
  }, [isHtmlMode, editor, htmlContent]);

  const handleHtmlChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newHtml = e.target.value;
      setHtmlContent(newHtml);
      onChange(newHtml);
    },
    [onChange]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "rounded-md border border-input bg-transparent overflow-hidden",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center border-b">
          {!isHtmlMode && <EditorToolbar editor={editor} disabled={disabled} />}
          {isHtmlMode && (
            <div className="flex-1 p-2 bg-muted/30">
              <span className="text-sm text-muted-foreground font-medium">
                HTML Source
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 p-2 bg-muted/30 border-l">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={isHtmlMode}
                  onPressedChange={handleHtmlModeToggle}
                  disabled={disabled}
                  className="h-8 w-8 p-0 data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
                  aria-label="Toggle HTML mode"
                >
                  {isHtmlMode ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <Code2 className="h-4 w-4" />
                  )}
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                {isHtmlMode ? "Visual Editor" : "Edit HTML"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {isHtmlMode ? (
          <textarea
            value={htmlContent}
            onChange={handleHtmlChange}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              "w-full min-h-[200px] p-4 font-mono text-sm bg-transparent resize-y focus:outline-none",
              "placeholder:text-muted-foreground"
            )}
            spellCheck={false}
          />
        ) : (
          <EditorContent editor={editor} />
        )}

        <style jsx global>{`
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: hsl(var(--muted-foreground));
            pointer-events: none;
            height: 0;
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
}
