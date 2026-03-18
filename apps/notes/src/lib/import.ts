/**
 * Import markdown content and convert to Lexical JSON
 */
export function importMarkdown(markdownContent: string): any {
  // This is a simplified converter
  // In production, you'd use @lexical/markdown with proper transformers

  const lines = markdownContent.split('\n');
  const children: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      children.push({
        type: 'heading',
        tag: 'h1',
        children: [{ type: 'text', text: line.substring(2) }],
      });
    } else if (line.startsWith('## ')) {
      children.push({
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: line.substring(3) }],
      });
    } else if (line.startsWith('### ')) {
      children.push({
        type: 'heading',
        tag: 'h3',
        children: [{ type: 'text', text: line.substring(4) }],
      });
    }
    // List items
    else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      children.push({
        type: 'listitem',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: line.trim().substring(2) }],
          },
        ],
      });
    }
    // Code blocks
    else if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++; // Move to next line
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      children.push({
        type: 'code',
        children: [{ type: 'text', text: codeLines.join('\n') }],
      });
    }
    // Regular paragraphs
    else {
      // Process inline formatting
      const textWithFormatting = processInlineFormatting(line);
      children.push({
        type: 'paragraph',
        children: textWithFormatting,
      });
    }
  }

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  };
}

function processInlineFormatting(text: string): any[] {
  const children: any[] = [];

  // Simple regex for bold
  const boldRegex = /\*\*(.+?)\*\*/g;

  // This is a simplified version - proper implementation would handle nested formatting
  let match;
  let lastIndex = 0;

  // Find bold text
  boldRegex.lastIndex = 0;
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      children.push({ type: 'text', text: text.substring(lastIndex, match.index) });
    }
    children.push({ type: 'text', text: match[1], format: 1 }); // 1 = bold
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    children.push({ type: 'text', text: text.substring(lastIndex) });
  }

  return children.length > 0 ? children : [{ type: 'text', text }];
}

/**
 * Read and import markdown file
 */
export function readMarkdownFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lexicalJSON = importMarkdown(content);
      resolve(lexicalJSON);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
