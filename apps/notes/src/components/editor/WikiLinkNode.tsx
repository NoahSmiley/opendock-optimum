import { TextNode } from 'lexical';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
} from 'lexical';

export type SerializedWikiLinkNode = Spread<
  {
    noteTitle: string;
    noteId?: string;
  },
  SerializedTextNode
>;

export class WikiLinkNode extends TextNode {
  __noteTitle: string;
  __noteId?: string;

  static getType(): string {
    return 'wikilink';
  }

  static clone(node: WikiLinkNode): WikiLinkNode {
    return new WikiLinkNode(node.__noteTitle, node.__noteId, node.__text, node.__key);
  }

  constructor(noteTitle: string, noteId?: string, text?: string, key?: NodeKey) {
    super(text || `[[${noteTitle}]]`, key);
    this.__noteTitle = noteTitle;
    this.__noteId = noteId;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.className = 'wiki-link';
    element.style.cssText =
      'color: #6366f1; text-decoration: none; cursor: pointer; padding: 2px 4px; border-radius: 4px; background-color: rgba(99, 102, 241, 0.1); transition: background-color 0.2s;';
    element.setAttribute('data-note-title', this.__noteTitle);
    if (this.__noteId) {
      element.setAttribute('data-note-id', this.__noteId);
    }

    // Add hover effect
    element.addEventListener('mouseenter', () => {
      element.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
    });
    element.addEventListener('mouseleave', () => {
      element.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
    });

    return element;
  }

  updateDOM(prevNode: WikiLinkNode, dom: HTMLElement, config: EditorConfig): boolean {
    const isUpdated = super.updateDOM(prevNode as unknown as this, dom, config);
    if (prevNode.__noteTitle !== this.__noteTitle) {
      dom.setAttribute('data-note-title', this.__noteTitle);
    }
    if (prevNode.__noteId !== this.__noteId && this.__noteId) {
      dom.setAttribute('data-note-id', this.__noteId);
    }
    return isUpdated;
  }

  static importJSON(serializedNode: SerializedWikiLinkNode): WikiLinkNode {
    const node = $createWikiLinkNode(serializedNode.noteTitle, serializedNode.noteId);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedWikiLinkNode {
    return {
      ...super.exportJSON(),
      noteTitle: this.__noteTitle,
      noteId: this.__noteId,
      type: 'wikilink',
      version: 1,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-note-title')) {
          return null;
        }
        return {
          conversion: convertWikiLinkElement,
          priority: 1,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-note-title', this.__noteTitle);
    if (this.__noteId) {
      element.setAttribute('data-note-id', this.__noteId);
    }
    element.textContent = this.__text;
    element.className = 'wiki-link';
    return { element };
  }

  getNoteTitle(): string {
    return this.__noteTitle;
  }

  getNoteId(): string | undefined {
    return this.__noteId;
  }

  setNoteId(noteId: string): void {
    const writable = this.getWritable();
    writable.__noteId = noteId;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  isSegmented(): boolean {
    return true;
  }
}

function convertWikiLinkElement(domNode: HTMLElement): DOMConversionOutput | null {
  const noteTitle = domNode.getAttribute('data-note-title');
  const noteId = domNode.getAttribute('data-note-id') || undefined;
  if (noteTitle) {
    const node = $createWikiLinkNode(noteTitle, noteId);
    return { node };
  }
  return null;
}

export function $createWikiLinkNode(noteTitle: string, noteId?: string): WikiLinkNode {
  return new WikiLinkNode(noteTitle, noteId);
}

export function $isWikiLinkNode(node: LexicalNode | null | undefined): node is WikiLinkNode {
  return node instanceof WikiLinkNode;
}
