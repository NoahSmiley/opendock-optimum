import { EditorToolbar } from "./EditorToolbar";
import { runBlock, type HeadingTag } from "./lib/headings";
import { toggleListType, type ListType } from "./lib/lists";
import { indentBlock } from "./lib/indent";
import { handleChecklistEnter, toggleCheckItem } from "./lib/checklistKeys";
import { useRichEditor } from "./lib/useRichEditor";

export interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function RichEditor({ value, onChange }: RichEditorProps) {
  const { ref, active, emit, doCmd, saveRange, onSelectionChange } = useRichEditor(value, onChange);

  const inline = (cmd: "bold" | "italic" | "underline" | "strikeThrough") =>
    doCmd(() => document.execCommand(cmd));

  const heading = (tag: HeadingTag) => doCmd(() => {
    if (ref.current) runBlock(tag, ref.current);
  });

  const list = (type: ListType) => doCmd(() => {
    if (ref.current) toggleListType(type, ref.current);
  });

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const root = ref.current;
    if (!root) return;
    if (e.key === "Enter" && handleChecklistEnter(root)) {
      e.preventDefault();
      emit();
      onSelectionChange();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      doCmd(() => indentBlock(e.shiftKey ? "out" : "in", root));
      return;
    }
    if (!(e.metaKey || e.ctrlKey)) return;
    const k = e.key.toLowerCase();
    if (k === "b") { e.preventDefault(); inline("bold"); }
    else if (k === "i") { e.preventDefault(); inline("italic"); }
    else if (k === "u") { e.preventDefault(); inline("underline"); }
  };

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("check-box")) {
      e.preventDefault();
      const li = target.closest("li.check-item");
      if (!(li instanceof HTMLElement)) return;
      toggleCheckItem(li);
      emit();
      return;
    }
    const li = target.closest?.("li.check-item");
    if (li instanceof HTMLElement && target === li) {
      const text = li.querySelector<HTMLElement>(".check-text");
      if (text) {
        const sel = window.getSelection();
        const r = document.createRange();
        r.selectNodeContents(text);
        r.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(r);
      }
    }
  };

  return (
    <div className="rich-editor-wrap">
      <EditorToolbar
        active={active}
        onSaveRange={saveRange}
        onInline={inline}
        onHeading={heading}
        onList={list}
      />
      <div
        ref={ref}
        className="rich-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={() => { emit(); onSelectionChange(); }}
        onKeyDown={onKeyDown}
        onKeyUp={onSelectionChange}
        onMouseUp={onSelectionChange}
        onFocus={onSelectionChange}
        onClick={onClick}
      />
    </div>
  );
}
