import { getSelectedBlocks, withMarkers } from "./blocks";
import { unwrapToParagraph } from "./lists";

export type HeadingTag = "H1" | "H2" | "H3" | "P";

export function runBlock(tag: HeadingTag, root: HTMLElement) {
  const initial = getSelectedBlocks(root);
  if (initial.length === 0) return;
  withMarkers(() => {
    const blocks = initial.map((b) => b.tagName === "LI" ? unwrapToParagraph(b) : b);
    const target = tag.toLowerCase();
    const allTarget = blocks.every((b) => b.tagName.toLowerCase() === target);
    const newTag = allTarget ? "p" : target;
    for (const block of blocks) {
      if (block === root) {
        const wrapper = document.createElement(newTag);
        while (root.firstChild) wrapper.appendChild(root.firstChild);
        root.appendChild(wrapper);
        continue;
      }
      if (block.tagName.toLowerCase() === newTag) continue;
      const replacement = document.createElement(newTag);
      while (block.firstChild) replacement.appendChild(block.firstChild);
      block.parentNode?.replaceChild(replacement, block);
    }
  }, root);
}
