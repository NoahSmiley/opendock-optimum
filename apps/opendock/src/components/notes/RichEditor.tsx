import { useState } from "react";
import { EditorToolbar } from "./EditorToolbar";
import { MentionPopover, type MentionCandidate } from "./MentionPopover";
import { runBlock, type HeadingTag } from "./lib/headings";
import { toggleListType, type ListType } from "./lib/lists";
import { indentBlock } from "./lib/indent";
import { handleChecklistEnter, toggleCheckItem } from "./lib/checklistKeys";
import { useRichEditor } from "./lib/useRichEditor";
import {
  detectMentionTrigger, insertMentionPill, handleBackspaceOverMention,
  type MentionTrigger,
} from "./lib/mention";
import { handlePaste } from "./lib/paste";

export interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  noteId?: string;
}

export function RichEditor({ value, onChange, noteId }: RichEditorProps) {
  const { ref, active, emit, doCmd, saveRange, onSelectionChange } = useRichEditor(value, onChange);
  const [trigger, setTrigger] = useState<MentionTrigger | null>(null);

  const inline = (cmd: "bold" | "italic" | "underline" | "strikeThrough") =>
    doCmd(() => document.execCommand(cmd));

  const heading = (tag: HeadingTag) => doCmd(() => {
    if (ref.current) runBlock(tag, ref.current);
  });

  const list = (type: ListType) => doCmd(() => {
    if (ref.current) toggleListType(type, ref.current);
  });

  const pickMention = (c: MentionCandidate) => {
    if (!trigger) return;
    insertMentionPill(trigger, c);
    setTrigger(null);
    emit();
    onSelectionChange();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const root = ref.current;
    if (!root) return;
    // Mention popover owns Arrow/Enter/Escape while open; its own listener handles them.
    if (trigger && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === "Escape")) return;
    if (e.key === "Backspace" && handleBackspaceOverMention(root)) {
      e.preventDefault();
      emit();
      onSelectionChange();
      return;
    }
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

  const refreshTrigger = () => {
    const root = ref.current;
    setTrigger(root ? detectMentionTrigger(root) : null);
  };

  const onInput = () => {
    emit();
    onSelectionChange();
    refreshTrigger();
  };

  const onSelection = () => {
    onSelectionChange();
    refreshTrigger();
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
        onInput={onInput}
        onKeyDown={onKeyDown}
        onKeyUp={onSelection}
        onMouseUp={onSelection}
        onFocus={onSelection}
        onBlur={() => setTrigger(null)}
        onClick={onClick}
        onPaste={(e) => { if (handlePaste(e)) { emit(); onSelectionChange(); } }}
      />
      {trigger && (
        <MentionPopover
          query={trigger.query}
          rect={trigger.rect}
          excludeId={noteId ?? null}
          onPick={pickMention}
          onCancel={() => setTrigger(null)}
        />
      )}
    </div>
  );
}
