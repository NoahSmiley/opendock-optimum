import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import type { LexicalCommand } from 'lexical';
import { $createImageNode, ImageNode } from './ImageNode';

export const INSERT_IMAGE_COMMAND: LexicalCommand<{
  src: string;
  altText?: string;
  width?: number;
  height?: number;
}> = createCommand();

export function ImagePlugin(): null {
  const [editor] = useLexicalComposerContext();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagePlugin: ImageNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const imageNode = $createImageNode(payload);
          selection.insertNodes([imageNode]);
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  // Create hidden file input for image upload
  useEffect(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.addEventListener('change', handleFileSelect);
    document.body.appendChild(input);
    inputRef.current = input;

    return () => {
      input.removeEventListener('change', handleFileSelect);
      document.body.removeChild(input);
    };
  }, []);

  const handleFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // For now, convert to base64 data URL
    // In production, you'd upload to S3/CDN
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src,
        altText: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  // Expose upload trigger method
  useEffect(() => {
    (window as any).__triggerImageUpload = () => {
      inputRef.current?.click();
    };
  }, []);

  return null;
}
