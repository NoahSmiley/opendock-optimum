import jsPDF from 'jspdf';
import type { Note } from '@opendock/shared/types';

/**
 * Convert Lexical JSON content to plain text
 */
export function lexicalToPlainText(content: any): string {
  if (!content || typeof content !== 'object') {
    return '';
  }

  const processNode = (node: any): string => {
    if (!node) return '';

    // Handle text nodes
    if (node.type === 'text') {
      return node.text || '';
    }

    // Handle paragraph nodes
    if (node.type === 'paragraph' || node.type === 'heading') {
      const children = node.children || [];
      return children.map(processNode).join('') + '\n\n';
    }

    // Handle list nodes
    if (node.type === 'list') {
      const children = node.children || [];
      return children.map(processNode).join('');
    }

    if (node.type === 'listitem') {
      const children = node.children || [];
      return '• ' + children.map(processNode).join('') + '\n';
    }

    // Handle code blocks
    if (node.type === 'code') {
      const children = node.children || [];
      return '```\n' + children.map(processNode).join('') + '\n```\n\n';
    }

    // Handle links
    if (node.type === 'link') {
      const children = node.children || [];
      const text = children.map(processNode).join('');
      return `${text} (${node.url || ''})`;
    }

    // Handle root and other container nodes
    if (node.children) {
      return node.children.map(processNode).join('');
    }

    return '';
  };

  return processNode(content.root || content);
}

/**
 * Export a note to PDF
 */
export async function exportNoteToPDF(note: Note): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper to add text with word wrapping
  const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');

    const lines = pdf.splitTextToSize(text, maxWidth);

    for (const line of lines) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    }
  };

  // Add title
  addText(note.title || 'Untitled', 18, true);
  yPosition += 5;

  // Add metadata
  const metadata: string[] = [];
  if (note.createdAt) {
    metadata.push(`Created: ${new Date(note.createdAt).toLocaleDateString()}`);
  }
  if (note.updatedAt) {
    metadata.push(`Updated: ${new Date(note.updatedAt).toLocaleDateString()}`);
  }
  if (note.tags && note.tags.length > 0) {
    metadata.push(`Tags: ${note.tags.join(', ')}`);
  }

  if (metadata.length > 0) {
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.text(metadata.join(' • '), margin, yPosition);
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);
  }

  // Add divider
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Add content
  const plainText = lexicalToPlainText(note.content);
  addText(plainText, 11, false);

  // Add footer with page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download the PDF
  const fileName = `${note.title || 'Untitled'}.pdf`.replace(/[^a-z0-9]/gi, '_');
  pdf.save(fileName);
}

/**
 * Export a note to Markdown
 */
export function exportNoteToMarkdown(note: Note): string {
  let markdown = `# ${note.title || 'Untitled'}\n\n`;

  // Add metadata
  if (note.tags && note.tags.length > 0) {
    markdown += `**Tags:** ${note.tags.join(', ')}\n\n`;
  }

  if (note.createdAt) {
    markdown += `**Created:** ${new Date(note.createdAt).toLocaleDateString()}\n\n`;
  }

  markdown += '---\n\n';

  // Convert Lexical to Markdown
  const processNode = (node: any): string => {
    if (!node) return '';

    if (node.type === 'text') {
      let text = node.text || '';
      if (node.format) {
        if (node.format & 1) text = `**${text}**`; // Bold
        if (node.format & 2) text = `*${text}*`; // Italic
        if (node.format & 16) text = `\`${text}\``; // Code
      }
      return text;
    }

    if (node.type === 'heading') {
      const level = node.tag?.replace('h', '') || '1';
      const children = node.children || [];
      return '#'.repeat(Number(level)) + ' ' + children.map(processNode).join('') + '\n\n';
    }

    if (node.type === 'paragraph') {
      const children = node.children || [];
      return children.map(processNode).join('') + '\n\n';
    }

    if (node.type === 'list') {
      const children = node.children || [];
      return children.map(processNode).join('') + '\n';
    }

    if (node.type === 'listitem') {
      const children = node.children || [];
      const prefix = node.listType === 'number' ? '1. ' : '- ';
      return prefix + children.map(processNode).join('') + '\n';
    }

    if (node.type === 'code') {
      const children = node.children || [];
      return '```\n' + children.map(processNode).join('') + '\n```\n\n';
    }

    if (node.type === 'link') {
      const children = node.children || [];
      const text = children.map(processNode).join('');
      return `[${text}](${node.url || ''})`;
    }

    if (node.children) {
      return node.children.map(processNode).join('');
    }

    return '';
  };

  const contentData: any = typeof note.content === 'object' && note.content !== null && 'root' in note.content
    ? (note.content as any).root
    : note.content;
  const content = processNode(contentData);
  markdown += content;

  return markdown;
}

/**
 * Download markdown file
 */
export function downloadMarkdown(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export note to JSON (for backup/transfer)
 */
export function exportNoteToJSON(note: Note): string {
  return JSON.stringify(note, null, 2);
}

/**
 * Download JSON file
 */
export function downloadJSON(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
