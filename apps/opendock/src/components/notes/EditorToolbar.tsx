import type { ToolbarState } from "./lib/state";

export interface EditorToolbarProps {
  active: ToolbarState;
  onSaveRange: () => void;
  onInline: (cmd: "bold" | "italic" | "underline" | "strikeThrough") => void;
  onHeading: (tag: "H1" | "H2" | "H3") => void;
  onList: (type: "ul" | "ol" | "checklist") => void;
}

export function EditorToolbar({ active, onSaveRange, onInline, onHeading, onList }: EditorToolbarProps) {
  const onMouseDown = (e: React.MouseEvent) => { onSaveRange(); e.preventDefault(); };
  return (
    <div className="rich-toolbar" onMouseDown={onMouseDown}>
      <ToolbarBtn active={active.bold} title="Bold (⌘B)" onClick={() => onInline("bold")}><b>B</b></ToolbarBtn>
      <ToolbarBtn active={active.italic} title="Italic (⌘I)" onClick={() => onInline("italic")}><i>I</i></ToolbarBtn>
      <ToolbarBtn active={active.underline} title="Underline (⌘U)" onClick={() => onInline("underline")}><u>U</u></ToolbarBtn>
      <ToolbarBtn active={active.strike} title="Strikethrough" onClick={() => onInline("strikeThrough")}><s>S</s></ToolbarBtn>
      <span className="rich-toolbar-sep" />
      <ToolbarBtn active={active.h1} title="Heading 1" onClick={() => onHeading("H1")}>H1</ToolbarBtn>
      <ToolbarBtn active={active.h2} title="Heading 2" onClick={() => onHeading("H2")}>H2</ToolbarBtn>
      <ToolbarBtn active={active.h3} title="Heading 3" onClick={() => onHeading("H3")}>H3</ToolbarBtn>
      <span className="rich-toolbar-sep" />
      <ToolbarBtn active={active.ul} title="Bullet list" onClick={() => onList("ul")}>•</ToolbarBtn>
      <ToolbarBtn active={active.ol} title="Numbered list" onClick={() => onList("ol")}>1.</ToolbarBtn>
      <ToolbarBtn active={active.check} title="Checklist" onClick={() => onList("checklist")}>☐</ToolbarBtn>
    </div>
  );
}

interface ToolbarBtnProps {
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarBtn({ active, title, onClick, children }: ToolbarBtnProps) {
  return (
    <button type="button" className={`rich-toolbar-btn${active ? " active" : ""}`} title={title} onClick={onClick}>
      {children}
    </button>
  );
}
