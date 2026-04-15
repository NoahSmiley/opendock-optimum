import { useState, useCallback } from "react";
import { useNotes } from "@/stores/notes";
import { ContextMenu, type MenuItem } from "@/components/ContextMenu";

interface MenuState { x: number; y: number; noteId: string }

const Logo = () => (
  <svg style={{ height: 13, width: "auto" }} viewBox="0 0 4904 1047" fill="none" xmlns="http://www.w3.org/2000/svg"><path transform="translate(0,952) scale(1,-1)" d="M45 350Q45 456 89.5 538.0Q134 620 211.5 665.0Q289 710 386 710Q482 710 559.5 665.0Q637 620 681.5 538.0Q726 456 726 350Q726 244 681.5 162.0Q637 80 559.5 35.0Q482 -10 386 -10Q289 -10 211.5 35.0Q134 80 89.5 162.0Q45 244 45 350ZM605 350Q605 426 577.5 483.0Q550 540 501.0 570.5Q452 601 390 601H381Q319 601 270.5 570.5Q222 540 194.5 483.0Q167 426 167 350Q167 274 194.5 217.0Q222 160 270.5 129.5Q319 99 381 99H390Q452 99 501.0 129.5Q550 160 577.5 217.0Q605 274 605 350Z" fill="currentColor"/><path transform="translate(772,952) scale(1,-1)" d="M71 500H186V434Q205 466 247.0 488.0Q289 510 341 510Q406 510 457.5 477.5Q509 445 538.0 386.0Q567 327 567 250Q567 173 537.5 113.5Q508 54 455.5 21.5Q403 -11 338 -11Q287 -11 246.5 10.0Q206 31 186 62V-200H71ZM453 249Q453 323 416.5 368.5Q380 414 322 414H317Q260 414 222.5 368.0Q185 322 185 249Q185 176 222.5 130.5Q260 85 317 85H322Q381 85 417.0 130.5Q453 176 453 249Z" fill="currentColor"/><path transform="translate(1381,952) scale(1,-1)" d="M41 250Q41 327 72.5 386.5Q104 446 158.0 478.5Q212 511 279 511Q372 511 435.0 454.0Q498 397 508 298Q511 261 510 219H154Q157 158 193.0 121.0Q229 84 279 84H285Q324 84 351.5 103.5Q379 123 388 155H503Q485 81 426.0 35.0Q367 -11 280 -11Q213 -11 158.5 21.5Q104 54 72.5 113.0Q41 172 41 250ZM282 416H276Q231 416 198.5 388.5Q166 361 157 308H395Q391 358 360.0 387.0Q329 416 282 416Z" fill="currentColor"/><path transform="translate(1933,952) scale(1,-1)" d="M71 500H186V438Q208 472 246.5 491.5Q285 511 335 511Q417 511 467.0 457.5Q517 404 517 316V0H402V293Q402 349 377.0 380.0Q352 411 304 411H302Q252 411 219.0 371.0Q186 331 186 268V0H71Z" fill="currentColor"/><path transform="translate(2516,952) scale(1,-1)" d="M85 700H327Q430 700 507.5 659.5Q585 619 628.0 540.0Q671 461 671 350Q671 239 629.0 160.0Q587 81 510.5 40.5Q434 0 331 0H85ZM551 350Q551 593 317 593H205V107H317Q551 107 551 350Z" fill="currentColor"/><path transform="translate(3234,952) scale(1,-1)" d="M40 251Q40 324 73.0 383.5Q106 443 163.0 477.0Q220 511 291 511Q362 511 419.0 477.0Q476 443 508.5 384.0Q541 325 541 251Q541 177 508.5 117.0Q476 57 419.0 23.0Q362 -11 291 -11Q220 -11 163.0 23.0Q106 57 73.0 117.0Q40 177 40 251ZM425 251Q425 325 388.5 369.5Q352 414 293 414H287Q229 414 192.5 369.0Q156 324 156 251Q156 177 192.5 131.5Q229 86 287 86H293Q352 86 388.5 131.0Q425 176 425 251Z" fill="currentColor"/><path transform="translate(3815,952) scale(1,-1)" d="M41 251Q41 324 71.5 383.5Q102 443 157.5 477.0Q213 511 284 511Q377 511 439.0 459.5Q501 408 510 325H394Q387 364 357.5 390.0Q328 416 285 416H281Q223 416 189.5 369.0Q156 322 156 251Q156 180 190.0 133.0Q224 86 282 86H285Q329 86 358.0 112.0Q387 138 394 176H511Q498 93 437.0 41.0Q376 -11 283 -11Q211 -11 156.0 22.0Q101 55 71.0 115.0Q41 175 41 251Z" fill="currentColor"/><path transform="translate(4363,952) scale(1,-1)" d="M71 700H186V299L385 500H529L332 301L539 0H402L251 220L186 155V0H71Z" fill="currentColor"/></svg>
);

export function Sidebar({ onNew }: { onNew: () => void }) {
  const activeId = useNotes((s) => s.activeId);
  const search = useNotes((s) => s.search);
  const setActive = useNotes((s) => s.setActive);
  const setSearch = useNotes((s) => s.setSearch);
  const remove = useNotes((s) => s.remove);
  const togglePin = useNotes((s) => s.togglePin);
  const duplicate = useNotes((s) => s.duplicate);
  const notes = useNotes((s) => s.filtered());
  const [menu, setMenu] = useState<MenuState | null>(null);

  const onContext = useCallback((e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, noteId });
  }, []);

  const menuNote = menu ? notes.find((n) => n.id === menu.noteId) : null;
  const menuItems: MenuItem[] = menuNote ? [
    { label: "Open", action: () => setActive(menu!.noteId) },
    { label: menuNote.pinned ? "Unpin" : "Pin to top", shortcut: "Ctrl+P", action: () => togglePin(menu!.noteId) },
    { divider: true, label: "", action: () => {} },
    { label: "Duplicate", action: () => duplicate(menu!.noteId) },
    { label: "Copy contents", action: () => navigator.clipboard.writeText(menuNote.content) },
    { divider: true, label: "", action: () => {} },
    { label: "Delete", action: () => remove(menu!.noteId), danger: true },
  ] : [];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Logo />
        <span className="count">{notes.length}</span>
      </div>
      <div className="sidebar-search">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
      </div>
      <div className="sidebar-notes">
        {notes.map((n) => (
          <div key={n.id} className={`note-item${n.id === activeId ? " active" : ""}`} onClick={() => setActive(n.id)} onContextMenu={(e) => onContext(e, n.id)}>
            <div className="note-title">
              {n.pinned && <span className="note-pin">*</span>}
              {n.title || "Untitled"}
            </div>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <button onClick={onNew}>New note</button>
      </div>
      {menu && menuNote && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}
    </aside>
  );
}
