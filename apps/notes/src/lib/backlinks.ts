import type { Note } from '@opendock/shared/types';

export interface Backlink {
  sourceNoteId: string;
  sourceNoteTitle: string;
  context: string; // Surrounding text where the link appears
  createdAt: Date;
}

export interface BacklinksData {
  noteId: string;
  backlinks: Backlink[];
}

/**
 * Extract wiki links from note content
 */
export function extractWikiLinks(content: any): string[] {
  const links: string[] = [];

  function traverse(node: any) {
    if (!node) return;

    // Check if it's a WikiLink node
    if (node.type === 'wikilink') {
      links.push(node.noteTitle);
      return;
    }

    // Check for [[link]] pattern in text nodes
    if (node.type === 'text' && node.text) {
      const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = wikiLinkRegex.exec(node.text)) !== null) {
        links.push(match[1]);
      }
    }

    // Traverse children
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  // Handle both string and object content
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (parsed.root) {
        traverse(parsed.root);
      }
    } catch {
      // If not JSON, search for [[]] pattern in plain text
      const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = wikiLinkRegex.exec(content)) !== null) {
        links.push(match[1]);
      }
    }
  } else if (content?.root) {
    traverse(content.root);
  }

  // Remove duplicates
  return Array.from(new Set(links));
}

/**
 * Get context around a wiki link (20 chars before and after)
 */
function getContext(text: string, linkText: string): string {
  const index = text.indexOf(`[[${linkText}]]`);
  if (index === -1) return '';

  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + linkText.length + 4 + 20);

  let context = text.substring(start, end);
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';

  return context;
}

/**
 * Extract plain text from Lexical content for context
 */
function extractPlainText(content: any): string {
  const textParts: string[] = [];

  function traverse(node: any) {
    if (!node) return;

    if (node.type === 'text') {
      textParts.push(node.text || '');
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (parsed.root) {
        traverse(parsed.root);
      }
    } catch {
      return content;
    }
  } else if (content?.root) {
    traverse(content.root);
  }

  return textParts.join(' ');
}

/**
 * Calculate backlinks for a specific note
 */
export function calculateBacklinks(targetNote: Note, allNotes: Note[]): Backlink[] {
  const backlinks: Backlink[] = [];

  for (const note of allNotes) {
    if (note.id === targetNote.id) continue; // Skip self-references

    const links = extractWikiLinks(note.content);

    // Check if this note links to the target note
    const matchingLinks = links.filter(
      (linkTitle) => linkTitle.toLowerCase() === targetNote.title.toLowerCase()
    );

    if (matchingLinks.length > 0) {
      const plainText = extractPlainText(note.content);
      const context = getContext(plainText, matchingLinks[0]);

      backlinks.push({
        sourceNoteId: note.id,
        sourceNoteTitle: note.title,
        context,
        createdAt: new Date(note.createdAt),
      });
    }
  }

  return backlinks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get all backlinks for all notes (for graph visualization)
 */
export function calculateAllBacklinks(notes: Note[]): Map<string, Backlink[]> {
  const backlinksMap = new Map<string, Backlink[]>();

  for (const note of notes) {
    const backlinks = calculateBacklinks(note, notes);
    backlinksMap.set(note.id, backlinks);
  }

  return backlinksMap;
}

/**
 * Build a graph structure for visualization
 */
export interface GraphNode {
  id: string;
  title: string;
  group: number; // For coloring by collection/tag
}

export interface GraphLink {
  source: string;
  target: string;
  value: number; // Link strength
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function buildNoteGraph(notes: Note[]): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const linkCounts = new Map<string, number>();

  // Create nodes
  for (const note of notes) {
    nodes.push({
      id: note.id,
      title: note.title,
      group: note.tags?.[0]?.charCodeAt(0) || 0, // Simple grouping by first tag
    });
  }

  // Create links
  for (const note of notes) {
    const wikiLinks = extractWikiLinks(note.content);

    for (const linkTitle of wikiLinks) {
      const targetNote = notes.find(
        (n) => n.title.toLowerCase() === linkTitle.toLowerCase()
      );

      if (targetNote) {
        const linkKey = `${note.id}-${targetNote.id}`;
        linkCounts.set(linkKey, (linkCounts.get(linkKey) || 0) + 1);
      }
    }
  }

  // Convert link counts to graph links
  for (const [linkKey, count] of linkCounts.entries()) {
    const [source, target] = linkKey.split('-');
    links.push({
      source,
      target,
      value: count,
    });
  }

  return { nodes, links };
}
