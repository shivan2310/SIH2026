import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  className?: string;
}

function normalizeAIResponse(text: string): string {
  // Split the text into code blocks and normal text.
  // Fenced code blocks: ```...``` and inline code: `...`
  const parts = text.split(/(```[\s\S]*?```|`[^`]*`)/g);
  
  return parts.map((part, index) => {
    // Even indices are normal text, odd indices are code blocks
    if (index % 2 === 0) {
      return part
        // Replace \[ ... \] with $$ ... $$
        .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
        // Replace \( ... \) with $ ... $
        .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
    }
    // Leave code blocks untouched
    return part;
  }).join('');
}

export function MarkdownRenderer({ content, className }: Props) {
  return (
    <div className={cn("prose prose-sm max-w-none break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ node, ...props }) => <h1 className="mt-4 mb-2 text-xl font-bold" {...props} />,
        h2: ({ node, ...props }) => <h2 className="mt-4 mb-2 text-lg font-bold" {...props} />,
        h3: ({ node, ...props }) => <h3 className="mt-3 mb-1 text-base font-bold" {...props} />,
        p: ({ node, ...props }) => <p className="mb-3 leading-relaxed last:mb-0" {...props} />,
        ul: ({ node, ...props }) => <ul className="mb-3 list-disc pl-5 space-y-1" {...props} />,
        ol: ({ node, ...props }) => <ol className="mb-3 list-decimal pl-5 space-y-1" {...props} />,
        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="mt-3 mb-3 border-l-2 border-gray-300 pl-4 italic text-gray-700" {...props} />
        ),
        a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
        table: ({ node, ...props }) => (
          <div className="my-4 w-full overflow-x-auto rounded-md border border-gray-200">
            <table className="w-full text-left text-sm" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => <thead className="bg-gray-50 text-gray-700" {...props} />,
        th: ({ node, ...props }) => <th className="px-4 py-2 font-semibold border-b border-gray-200" {...props} />,
        td: ({ node, ...props }) => <td className="px-4 py-2 border-b border-gray-200 last:border-b-0" {...props} />,
        code: ({ node, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !String(children).includes("\n");
          
          if (isInline) {
            return (
              <code className={cn("rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-gray-900", className)} {...props}>
                {children}
              </code>
            );
          }

          return (
            <div className="my-3 overflow-x-auto rounded-lg bg-gray-900 p-4 custom-scrollbar">
              <code className={cn("block font-mono text-[0.85em] leading-normal text-gray-50 whitespace-pre", className)} {...props}>
                {children}
              </code>
            </div>
          );
        },
      }}
    >
      {normalizeAIResponse(content)}
    </ReactMarkdown>
  </div>
  );
}
