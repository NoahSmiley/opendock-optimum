import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  KEY_TAB_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  COMMAND_PRIORITY_LOW,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import { $isListItemNode } from '@lexical/list';

export function TabIndentPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (event: KeyboardEvent) => {
        event.preventDefault();

        if (event.shiftKey) {
          // Shift+Tab: Outdent or convert to paragraph if at first level
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const anchorNode = selection.anchor.getNode();

              // Check if we're in a list item
              let listItemNode = null;
              if ($isListItemNode(anchorNode)) {
                listItemNode = anchorNode;
              } else if ($isListItemNode(anchorNode.getParent())) {
                listItemNode = anchorNode.getParent();
              }

              if (listItemNode && $isListItemNode(listItemNode)) {
                const indent = listItemNode.getIndent();

                // If at first level (indent 0), convert this item to a paragraph
                if (indent === 0) {
                  // Get the text content
                  const textContent = listItemNode.getTextContent();

                  // Create a new paragraph with the same content
                  const paragraph = $createParagraphNode();
                  if (textContent) {
                    paragraph.append($createTextNode(textContent));
                  }

                  // Replace the list item with the paragraph
                  listItemNode.replace(paragraph);

                  // Move selection to the paragraph
                  paragraph.select();
                  return;
                }
              }

              // Otherwise, just outdent
              editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
            }
          });
        } else {
          // Tab: Indent
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }

        return true; // Prevent default tab behavior
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
