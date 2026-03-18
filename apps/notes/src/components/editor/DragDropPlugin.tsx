import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { INSERT_IMAGE_COMMAND } from './ImagePlugin';

export function DragDropPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const files = Array.from(event.dataTransfer?.files || []);
      const imageFiles = files.filter((file) =>
        file.type.startsWith('image/')
      );

      imageFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            src,
            altText: file.name,
          });
        };
        reader.readAsDataURL(file);
      });
    };

    const handlePaste = (event: ClipboardEvent) => {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItems = items.filter((item) =>
        item.type.startsWith('image/')
      );

      if (imageItems.length > 0) {
        event.preventDefault();

        imageItems.forEach((item) => {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                src,
                altText: 'Pasted image',
              });
            };
            reader.readAsDataURL(file);
          }
        });
      }
    };

    const editorElement = editor.getRootElement();
    if (editorElement) {
      editorElement.addEventListener('dragover', handleDragOver);
      editorElement.addEventListener('drop', handleDrop);
      editorElement.addEventListener('paste', handlePaste);

      return () => {
        editorElement.removeEventListener('dragover', handleDragOver);
        editorElement.removeEventListener('drop', handleDrop);
        editorElement.removeEventListener('paste', handlePaste);
      };
    }
  }, [editor]);

  return null;
}
