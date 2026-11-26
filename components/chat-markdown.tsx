import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Jawaban agent ditampilkan sebagai Markdown. HTML mentah dari model tidak dirender (bawaan react-markdown),
// jadi jawaban tidak bisa menyisipkan script atau tag lain.
export function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="chat-md mt-1 text-sm break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
