import { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { type EditorState, $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { editorTheme } from "./editorTheme";

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

const NODES = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, CodeNode, CodeHighlightNode, TableNode, TableCellNode, TableRowNode];

export function RichTextEditor({ initialContent, onChange, placeholder = "Start writing..." }: RichTextEditorProps) {
  const handleChange = (state: EditorState) => {
    if (!onChange) return;
    state.read(() => onChange(JSON.stringify(state.toJSON())));
  };

  const initialConfig = {
    namespace: "NotesEditor",
    theme: editorTheme,
    nodes: NODES,
    editorState: initialContent && isJsonString(initialContent) ? initialContent : undefined,
    onError: (error: Error) => console.error("Lexical error:", error),
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative flex h-full flex-col">
        <div className="relative flex-1 overflow-y-auto">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-full px-10 py-6 text-[14px] leading-[1.8] text-neutral-300 outline-none" />
            }
            placeholder={
              <div className="pointer-events-none absolute left-10 top-6 text-[14px] text-neutral-600">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <TabIndentationPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        {initialContent && !isJsonString(initialContent) && <SetPlainTextPlugin text={initialContent} />}
      </div>
    </LexicalComposer>
  );
}

function SetPlainTextPlugin({ text }: { text: string }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      p.append($createTextNode(text));
      root.append(p);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function isJsonString(str: string): boolean {
  try { JSON.parse(str); return true; } catch { return false; }
}
