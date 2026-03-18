import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import { $isListNode, ListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { $isHeadingNode, $createHeadingNode, type HeadingTagType } from '@lexical/rich-text';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3 } from 'lucide-react';
import clsx from 'clsx';

export function FloatingToolbar() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [blockType, setBlockType] = useState<string>('paragraph');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      // Update text format states
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          setBlockType(type);
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor, updateToolbar]);

  const formatHeading = (headingTag: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Get the selected nodes and convert them to headings
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          const parent = node.getParent();
          if (parent) {
            const heading = $createHeadingNode(headingTag);
            parent.replace(heading);
            heading.append(node);
          }
        });
      }
    });
  };

  return (
    <div
      ref={toolbarRef}
      className="flex flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white/95 p-1 shadow-lg backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/95"
    >
      {/* Text formatting */}
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        className={clsx(
          'rounded p-1.5 transition-colors',
          isBold
            ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
        )}
        aria-label="Format Bold"
        title="Bold (Cmd+B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        className={clsx(
          'rounded p-1.5 transition-colors',
          isItalic
            ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
        )}
        aria-label="Format Italic"
        title="Italic (Cmd+I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        className={clsx(
          'rounded p-1.5 transition-colors',
          isUnderline
            ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
        )}
        aria-label="Format Underline"
        title="Underline (Cmd+U)"
      >
        <Underline className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }}
        className={clsx(
          'rounded p-1.5 transition-colors',
          isStrikethrough
            ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
        )}
        aria-label="Format Strikethrough"
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      {/* Divider */}
      <div className="my-0.5 h-px w-5 bg-neutral-200 dark:bg-neutral-700" />

      {/* Headings */}
      <button
        onClick={() => formatHeading('h1')}
        className={clsx(
          'rounded p-1.5 transition-colors',
          blockType === 'h1'
            ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
        )}
        aria-label="Heading 1"
        title="Heading 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => formatHeading('h2')}
        className={clsx(
          'rounded p-1.5 transition-colors',
          blockType === 'h2'
            ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
        )}
        aria-label="Heading 2"
        title="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => formatHeading('h3')}
        className={clsx(
          'rounded p-1.5 transition-colors',
          blockType === 'h3'
            ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
        )}
        aria-label="Heading 3"
        title="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </button>

      {/* Divider */}
      <div className="my-0.5 h-px w-5 bg-neutral-200 dark:bg-neutral-700" />

      {/* Lists */}
      <button
        onClick={() => {
          if (blockType === 'bullet') {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          }
        }}
        className={clsx(
          'rounded p-1.5 transition-colors',
          blockType === 'bullet'
            ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
        )}
        aria-label="Bullet List"
        title="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => {
          if (blockType === 'number') {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          }
        }}
        className={clsx(
          'rounded p-1.5 transition-colors',
          blockType === 'number'
            ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
        )}
        aria-label="Numbered List"
        title="Numbered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
