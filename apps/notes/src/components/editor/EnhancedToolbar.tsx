import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useState, useCallback, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  Code2,
} from 'lucide-react';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { $createCodeNode } from '@lexical/code';
import clsx from 'clsx';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  icon: typeof Bold;
  label: string;
  disabled?: boolean;
}

function ToolbarButton({ onClick, isActive, icon: Icon, label, disabled }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center justify-center rounded-md p-2 transition-colors',
        isActive
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
        disabled && 'cursor-not-allowed opacity-50'
      )}
      title={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function EnhancedToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsCode(selection.hasFormat('code'));
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      1
    );
  }, [editor, updateToolbar]);

  const formatHeading = (level: 1 | 2) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(`h${level}`));
      }
    });
  };

  const insertTable = () => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: '3',
      rows: '3',
      includeHeaders: true,
    });
  };

  const insertCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createCodeNode());
      }
    });
  };

  const insertImage = () => {
    // Trigger the hidden file input from ImagePlugin
    (window as any).__triggerImageUpload?.();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      // Will implement link insertion
      console.log('Insert link:', url);
    }
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r border-neutral-200 pr-2 dark:border-neutral-800">
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          isActive={isBold}
          icon={Bold}
          label="Bold (Cmd+B)"
        />
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          isActive={isItalic}
          icon={Italic}
          label="Italic (Cmd+I)"
        />
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          isActive={isUnderline}
          icon={Underline}
          label="Underline (Cmd+U)"
        />
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
          isActive={isCode}
          icon={Code}
          label="Inline Code"
        />
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 border-r border-neutral-200 pr-2 dark:border-neutral-800">
        <ToolbarButton
          onClick={() => formatHeading(1)}
          icon={Heading1}
          label="Heading 1"
        />
        <ToolbarButton
          onClick={() => formatHeading(2)}
          icon={Heading2}
          label="Heading 2"
        />
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r border-neutral-200 pr-2 dark:border-neutral-800">
        <ToolbarButton
          onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
          icon={List}
          label="Bullet List"
        />
        <ToolbarButton
          onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
          icon={ListOrdered}
          label="Numbered List"
        />
      </div>

      {/* Insert Elements */}
      <div className="flex items-center gap-1 border-r border-neutral-200 pr-2 dark:border-neutral-800">
        <ToolbarButton
          onClick={insertImage}
          icon={ImageIcon}
          label="Insert Image"
        />
        <ToolbarButton
          onClick={insertTable}
          icon={Table}
          label="Insert Table"
        />
        <ToolbarButton
          onClick={insertCodeBlock}
          icon={Code2}
          label="Code Block"
        />
        <ToolbarButton
          onClick={insertLink}
          icon={LinkIcon}
          label="Insert Link"
        />
      </div>
    </div>
  );
}
