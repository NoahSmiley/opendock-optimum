export function extractTags(content: string): string[] {
  const tags = new Set<string>();
  for (const word of content.split(/\s/)) {
    if (word.startsWith("#") && word.length > 1) {
      tags.add(word.replace(/[^a-zA-Z0-9#]/g, "").toLowerCase());
    }
  }
  return [...tags].sort();
}
