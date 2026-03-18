import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { $getRoot } from 'lexical';
import type { EditorState } from 'lexical';
import { TabIndentPlugin } from './TabIndentPlugin';
import { EnhancedToolbar } from './EnhancedToolbar';
import { ImageNode } from './ImageNode';
import { ImagePlugin } from './ImagePlugin';
import { DragDropPlugin } from './DragDropPlugin';
import { CodeHighlightPlugin } from './CodeHighlightPlugin';

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  showToolbar?: boolean;
  externalToolbar?: boolean; // If true, renders StandaloneToolbar for external placement
}

// Plugin to update editor when content changes externally
function UpdatePlugin({ content }: { content?: string }) {
  const [editor] = useLexicalComposerContext();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only load content once on mount, not on every change
    if (content && !isInitialized) {
      editor.update(() => {
        try {
          // Try to parse as Lexical editor state JSON
          const editorState = editor.parseEditorState(content);
          editor.setEditorState(editorState);
        } catch {
          // If parsing fails, it might be plain text from old notes
          // Leave the content as-is or clear it
          const root = $getRoot();
          if (root.getTextContent() === '') {
            // Only set if editor is empty to avoid overwriting during typing
            // For plain text, we'll just skip it and let user re-enter
            console.log('Could not parse editor state, might be plain text');
          }
        }
      });
      setIsInitialized(true);
    }
  }, [content, editor, isInitialized]);

  return null;
}

export function RichTextEditor({ initialContent, onChange, placeholder = 'Start writing...', showToolbar = true, externalToolbar = false }: RichTextEditorProps) {
  const [toolbarContainer, setToolbarContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (externalToolbar) {
      const container = document.getElementById('external-toolbar-mount');
      setToolbarContainer(container);
    }
  }, [externalToolbar]);

  const initialConfig = {
    namespace: 'RichTextEditor',
    theme: {
      paragraph: 'mb-0',
      heading: {
        h1: 'text-3xl font-bold mb-2',
        h2: 'text-2xl font-bold mb-1',
        h3: 'text-xl font-bold mb-1',
      },
      list: {
        ul: 'list-disc mb-0',
        ol: 'list-decimal mb-0',
        listitem: 'ml-8',
        nested: {
          listitem: 'list-none',
        },
      },
      quote: 'border-l-4 border-neutral-300 pl-4 italic my-0',
      link: 'text-blue-600 hover:underline',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        code: 'bg-neutral-100 px-1 py-0.5 rounded font-mono text-sm dark:bg-neutral-800',
      },
      table: 'border-collapse table-auto w-full my-4',
      tableCell: 'border border-neutral-300 px-4 py-2 dark:border-neutral-700',
      tableCellHeader: 'border border-neutral-300 px-4 py-2 bg-neutral-100 font-semibold dark:border-neutral-700 dark:bg-neutral-800',
      code: 'block bg-neutral-900 text-neutral-100 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm',
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      CodeNode,
      CodeHighlightNode,
      ImageNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

  const handleChange = (editorState: EditorState) => {
    // Serialize the entire editor state as JSON to preserve formatting
    const jsonString = JSON.stringify(editorState.toJSON());
    onChange?.(jsonString);
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative flex h-full flex-col">
        {showToolbar && !externalToolbar && <EnhancedToolbar />}
        {externalToolbar && toolbarContainer && createPortal(
          <EnhancedToolbar />,
          toolbarContainer
        )}
        <div className="relative flex-1 overflow-y-auto">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-full px-8 py-6 text-[15px] leading-relaxed text-neutral-900 outline-none dark:text-white" />
            }
            placeholder={
              <div className="pointer-events-none absolute left-8 top-6 text-[15px] text-neutral-400 dark:text-neutral-500">
                {placeholder}
              </div>
            }
            ErrorBoundary={() => <div>Error loading editor</div>}
          />
          <ListPlugin />
          <TablePlugin />
          <TabIndentPlugin />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleChange} />
          <UpdatePlugin content={initialContent} />
          <ImagePlugin />
          <DragDropPlugin />
          <CodeHighlightPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}
