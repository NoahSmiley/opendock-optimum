import type { EditorThemeClasses } from "lexical";

export const editorTheme: EditorThemeClasses = {
  paragraph: "mb-0",
  heading: {
    h1: "text-3xl font-bold mb-2",
    h2: "text-2xl font-bold mb-1",
    h3: "text-xl font-bold mb-1",
  },
  list: {
    ul: "list-disc mb-0",
    ol: "list-decimal mb-0",
    listitem: "ml-8",
    nested: { listitem: "list-none" },
  },
  quote: "border-l-4 border-neutral-600 pl-4 italic my-0 text-neutral-400",
  link: "text-blue-400 hover:underline cursor-pointer",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "bg-neutral-800 px-1 py-0.5 rounded font-mono text-sm",
  },
  table: "border-collapse table-auto w-full my-4",
  tableCell: "border border-neutral-700 px-4 py-2",
  tableCellHeader: "border border-neutral-700 px-4 py-2 bg-neutral-800 font-semibold",
  code: "block bg-neutral-900 text-neutral-100 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm",
};
