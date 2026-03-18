import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { TextNode } from 'lexical';
import type { Note } from '@opendock/shared/types';
import { $createWikiLinkNode, WikiLinkNode } from './WikiLinkNode';

interface WikiLinkPluginProps {
  notes: Note[];
  onNavigate?: (noteId: string) => void;
}

export function WikiLinkPlugin({ notes, onNavigate }: WikiLinkPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const [, setShowAutocomplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setFilteredNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!editor.hasNodes([WikiLinkNode])) {
      throw new Error('WikiLinkPlugin: WikiLinkNode not registered on editor');
    }

    // Register text mutation listener to detect [[ patterns
    const removeTextMutationListener = editor.registerMutationListener(TextNode, (mutatedNodes) => {
      editor.update(() => {
        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'created' || mutation === 'updated') {
            const node = editor.getEditorState()._nodeMap.get(nodeKey);
            if (node instanceof TextNode) {
              const text = node.getTextContent();

              // Check for [[ to trigger autocomplete
              if (text.endsWith('[[')) {
                setShowAutocomplete(true);
                setSearchQuery('');
              }

              // Check for complete [[note]] pattern
              const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
              let match;

              while ((match = wikiLinkRegex.exec(text)) !== null) {
                const noteTitle = match[1];
                const matchedNote = notes.find(
                  (n) => n.title.toLowerCase() === noteTitle.toLowerCase()
                );

                // Replace text with WikiLinkNode
                const start = match.index;
                const end = start + match[0].length;

                const wikiLinkNode = $createWikiLinkNode(noteTitle, matchedNote?.id);

                // Split the text node and insert WikiLinkNode
                if (start === 0 && end === text.length) {
                  node.replace(wikiLinkNode);
                } else if (start === 0) {
                  const [, afterNode] = node.splitText(end);
                  node.replace(wikiLinkNode);
                  if (afterNode) {
                    wikiLinkNode.insertAfter(afterNode);
                  }
                } else if (end === text.length) {
                  const [beforeNode] = node.splitText(start);
                  beforeNode.insertAfter(wikiLinkNode);
                } else {
                  const [beforeNode, middleNode] = node.splitText(start);
                  const [, afterNode] = middleNode.splitText(end - start);
                  beforeNode.insertAfter(wikiLinkNode);
                  if (afterNode) {
                    wikiLinkNode.insertAfter(afterNode);
                  }
                }
              }
            }
          }
        }
      });
    });

    // Handle clicks on wiki links
    const removeClickListener = editor.registerRootListener((rootElement, prevRootElement) => {
      if (prevRootElement) {
        prevRootElement.removeEventListener('click', handleClick);
      }
      if (rootElement) {
        rootElement.addEventListener('click', handleClick);
      }
    });

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.classList.contains('wiki-link')) {
        const noteId = target.getAttribute('data-note-id');
        if (noteId && onNavigate) {
          onNavigate(noteId);
        }
      }
    }

    return () => {
      removeTextMutationListener();
      removeClickListener();
    };
  }, [editor, notes, onNavigate]);

  // Filter notes based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = notes.filter((note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNotes(filtered.slice(0, 5)); // Show top 5 matches
    } else {
      setFilteredNotes(notes.slice(0, 5)); // Show recent notes
    }
  }, [searchQuery, notes]);

  // Autocomplete UI would go here (simplified for now)
  // In production, you'd render a dropdown menu with filtered notes

  return null;
}
