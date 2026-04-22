import SwiftUI
import UIKit

/// Live @-mention trigger state. When non-nil, the popover shows.
struct MentionTriggerState: Equatable {
    var query: String
    var caretRect: CGRect
    var atIndex: Int
}

/// UIViewRepresentable wrapping UITextView. Canonical attributed text lives
/// on the text view; the SwiftUI binding mirrors it for persistence. A
/// commit token prevents the binding's writeback from reentrantly rewriting
/// the text view while the user is typing.
/// Shared reference to the live UITextView so SwiftUI siblings (e.g. the
/// inline EditorToolbarView) can manipulate its attributedText directly.
/// Never written to by SwiftUI's diff — only assigned once from makeUIView.
@MainActor final class TextViewRef: ObservableObject {
    weak var textView: UITextView?
}

/// UITextView subclass that returns a caret rect scaled to the current
/// font's intrinsic height rather than the full line height. Without
/// this the caret matches the full typographic line (inflated by
/// lineHeightMultiple and any attachment bounds on that line), so a
/// 16-18pt font ends up with a ~24pt caret that looks disproportionately
/// tall vs the glyphs.
final class TightCaretTextView: UITextView {
    override func caretRect(for position: UITextPosition) -> CGRect {
        let r = super.caretRect(for: position)
        // Anchor the caret at the font baseline and give it the font's
        // ascender + 2pt descender. That matches how text visually
        // occupies the line and keeps the caret from running past the
        // cap / descender in either direction.
        let loc = offset(from: beginningOfDocument, to: position)
        let font: UIFont
        if loc > 0, loc <= attributedText.length {
            font = (attributedText.attribute(.font, at: loc - 1, effectiveRange: nil) as? UIFont)
                ?? (typingAttributes[.font] as? UIFont)
                ?? UIFont.systemFont(ofSize: 18)
        } else {
            font = (typingAttributes[.font] as? UIFont) ?? UIFont.systemFont(ofSize: 18)
        }
        let targetHeight = font.ascender + abs(font.descender) + 2
        guard targetHeight < r.height else { return r }
        // Keep the caret's bottom where UIKit put it (on the baseline +
        // descender) and shrink upward so we don't push into the line
        // below.
        let dy = r.height - targetHeight
        return CGRect(x: r.origin.x, y: r.origin.y + dy, width: r.width, height: targetHeight)
    }
}

struct MentionTextView: UIViewRepresentable {
    @Binding var attributed: NSAttributedString
    @Binding var trigger: MentionTriggerState?
    let onChange: () -> Void
    let ref: TextViewRef
    /// Called whenever the text view scrolls. CheckboxOverlay uses this
    /// to re-layout its buttons so they track the text as it moves.
    var onScroll: (() -> Void)? = nil

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    @MainActor static let bodyColor: UIColor = UIColor(Theme.text)

    func makeUIView(context: Context) -> UITextView {
        let tv = TightCaretTextView()
        tv.backgroundColor = .clear
        tv.textColor = Self.bodyColor
        tv.tintColor = Self.bodyColor
        tv.textContainerInset = UIEdgeInsets(top: 8, left: 16, bottom: 8, right: 16)
        // `.interactive` only dismisses when there's scrollable content;
        // short notes had no way to dismiss the keyboard. `.onDrag` drops
        // it on any scroll drag regardless of content length.
        tv.keyboardDismissMode = .onDrag
        // Autocorrect state is persisted under the same key the toolbar
        // writes to. UserDefaults.bool default is false, so treat absent
        // as "on" (default expected behaviour).
        let autocorrect = UserDefaults.standard.object(forKey: "opendock.autocorrect") as? Bool ?? true
        tv.autocorrectionType = autocorrect ? .yes : .no
        tv.spellCheckingType = autocorrect ? .yes : .no
        tv.smartQuotesType = autocorrect ? .yes : .no
        tv.smartDashesType = autocorrect ? .yes : .no
        tv.smartInsertDeleteType = autocorrect ? .yes : .no
        tv.delegate = context.coordinator
        tv.layoutManager.delegate = context.coordinator
        tv.attributedText = attributed
        applyTypingAttributes(tv)
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTap(_:)))
        // Cancel touches in-view so a tap landing on a checkbox doesn't
        // also plant the UITextView caret at that location — otherwise
        // the caret flashes on/next to the box for a frame before the
        // toggle animation runs. The coordinator's shouldReceive
        // callback only accepts the touch when it's over a checkbox
        // glyph, so non-checkbox taps still reach UITextView normally.
        tap.cancelsTouchesInView = true
        tap.delegate = context.coordinator
        tv.addGestureRecognizer(tap)
        context.coordinator.lastAssignedRevision = attributed.hash
        ref.textView = tv
        return tv
    }

    func updateUIView(_ tv: UITextView, context: Context) {
        let rev = attributed.hash
        guard rev != context.coordinator.lastAssignedRevision else { return }
        // Don't clobber the user's in-progress edit; we only apply external
        // updates that arrive when the view is not editing.
        guard !tv.isFirstResponder else {
            context.coordinator.lastAssignedRevision = rev
            return
        }
        tv.attributedText = attributed
        applyTypingAttributes(tv)
        context.coordinator.lastAssignedRevision = rev
    }

    /// Update typing attributes to match the BLOCK the caret now lives
    /// in. We only refresh the block-level attributes (font, block tag,
    /// paragraph style, color) and preserve the inline mark state —
    /// which is now read from the current typing font's face name
    /// (OpenAISans-Bold / OpenAISans-BoldItalic / OpenAISans-RegularItalic
    /// / OpenAISans-Regular etc.). Toolbar toggles set the face
    /// directly, and we re-compute the right face for the new block
    /// while preserving bold / italic state.
    @MainActor func applyTypingAttributes(_ tv: UITextView) {
        let loc = tv.selectedRange.location
        let block: EditorBlock
        if tv.attributedText.length > 0,
           let raw = tv.attributedText.attribute(EditorAttr.block, at: max(0, loc - 1), effectiveRange: nil) as? String,
           let b = EditorBlock(rawValue: raw) {
            block = b
        } else {
            block = .p
        }
        var typing = tv.typingAttributes
        let curFontName = ((typing[.font] as? UIFont)?.fontName ?? "").lowercased()
        let wantBold = curFontName.contains("bold")
        let wantItalic = curFontName.contains("italic")
        typing[.font] = block.font(bold: wantBold, italic: wantItalic)
        typing[EditorAttr.block] = block.rawValue
        typing[.paragraphStyle] = block.attrs(bold: wantBold, italic: wantItalic)[.paragraphStyle]
        let isHeading = block == .h1 || block == .h2 || block == .h3
        typing[.foregroundColor] = (wantBold || isHeading) ? UIColor(Theme.active) : Self.bodyColor
        // Clear any legacy synthetic mark attrs from old notes so new
        // runs don't double-apply stroke/obliqueness on top of the real
        // Bold / Italic face.
        typing.removeValue(forKey: .strokeWidth)
        typing.removeValue(forKey: .obliqueness)
        tv.typingAttributes = typing
    }

    final class Coordinator: NSObject, UITextViewDelegate, NSLayoutManagerDelegate, UIGestureRecognizerDelegate {
        var parent: MentionTextView
        var lastAssignedRevision: Int = 0
        init(_ parent: MentionTextView) { self.parent = parent }

        func gestureRecognizer(_ g: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool { true }

        /// Only accept taps that land on a CheckboxAttachment's glyph —
        /// other taps (for caret placement, selection, etc.) pass
        /// through to the UITextView's own handling. Prevents the
        /// caret-flash that happens when UITextView sets the caret at
        /// the tap location before our handler runs.
        func gestureRecognizer(_ g: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
            guard let tv = g.view as? UITextView else { return false }
            let point = touch.location(in: tv)
            return hitsCheckbox(at: point, in: tv)
        }

        private func hitsCheckbox(at point: CGPoint, in tv: UITextView) -> Bool {
            let origin = CGPoint(x: point.x - tv.textContainerInset.left,
                                 y: point.y - tv.textContainerInset.top)
            var frac: CGFloat = 0
            let idx = tv.layoutManager.characterIndex(
                for: origin,
                in: tv.textContainer,
                fractionOfDistanceBetweenInsertionPoints: &frac
            )
            guard idx >= 0, idx < tv.attributedText.length else { return false }
            return tv.attributedText.attribute(.attachment, at: idx, effectiveRange: nil) is CheckboxAttachment
        }

        /// Backspace across a pill deletes the whole attachment atomically.
        func textView(_ tv: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
            // Backspace across a mention pill deletes the whole attachment.
            if text.isEmpty, range.length == 1, range.location > 0 {
                let s = tv.attributedText.attributedSubstring(from: NSRange(location: range.location - 1, length: 1))
                if s.attribute(.attachment, at: 0, effectiveRange: nil) is MentionAttachment {
                    let wider = NSRange(location: range.location - 1, length: 1)
                    let m = NSMutableAttributedString(attributedString: tv.attributedText)
                    m.replaceCharacters(in: wider, with: "")
                    tv.attributedText = m
                    tv.selectedRange = NSRange(location: wider.location, length: 0)
                    commitToParent(tv)
                    return false
                }
            }
            // Remember whether the caret is currently sitting on a
            // checklist / ul / ol line and if that line has content
            // beyond the checkbox attachment — we use this in
            // textViewDidChange to decide whether to patch in a new
            // list head after UIKit inserts the newline.
            if text == "\n", range.length == 0 {
                pendingListContinuation = listStateForReturn(tv, at: range.location)
                pendingNewlineReset = true
            } else {
                pendingListContinuation = nil
            }
            return true
        }

        /// Set when the user just typed a newline; consumed by
        /// `textViewDidChange` to strip inline marks (bold, italic,
        /// underline, strikethrough) from the NEW line's typing
        /// attributes. Without this, U / S / bold state bleeds from
        /// line to line — if you underline line 1, line 2 inherits
        /// the underline even though you never asked for it.
        var pendingNewlineReset: Bool = false

        /// State captured in `shouldChangeTextIn` and consumed by the
        /// matching `textViewDidChange` — used to auto-continue list
        /// blocks on Return without fighting UIKit's insertion pipeline.
        struct ListContinuation { let block: EditorBlock; let isEmptyLine: Bool; let lineStart: Int; let lineEnd: Int }
        var pendingListContinuation: ListContinuation? = nil

        private func listStateForReturn(_ tv: UITextView, at loc: Int) -> ListContinuation? {
            guard loc <= tv.attributedText.length else { return nil }
            let ns = tv.text as NSString
            var lineStart = loc
            while lineStart > 0, ns.character(at: lineStart - 1) != 0x0A { lineStart -= 1 }
            var lineEnd = loc
            while lineEnd < ns.length, ns.character(at: lineEnd) != 0x0A { lineEnd += 1 }
            guard lineStart < tv.attributedText.length,
                  let raw = tv.attributedText.attribute(EditorAttr.block, at: lineStart, effectiveRange: nil) as? String,
                  let block = EditorBlock(rawValue: raw),
                  block == .checklist || block == .ul || block == .ol
            else { return nil }
            // Content length excluding a leading checklist attachment.
            var contentStart = lineStart
            if block == .checklist, contentStart < tv.attributedText.length,
               tv.attributedText.attribute(.attachment, at: contentStart, effectiveRange: nil) is CheckboxAttachment {
                contentStart += 1
            }
            let empty = lineEnd <= contentStart
            return ListContinuation(block: block, isEmptyLine: empty, lineStart: lineStart, lineEnd: lineEnd)
        }

        func textViewDidChange(_ tv: UITextView) {
            consumePendingListContinuation(tv)
            consumePendingNewlineReset(tv)
            commitToParent(tv)
            updateTrigger(tv)
        }

        /// After a newline is inserted, clear all inline-mark typing
        /// attributes so the new line starts plain. Without this, any
        /// bold / italic / underline / strikethrough / foreground-color
        /// the user had active on the previous line bleeds into the new
        /// line's typing attributes and appears on the next typed char.
        private func consumePendingNewlineReset(_ tv: UITextView) {
            guard pendingNewlineReset else { return }
            pendingNewlineReset = false
            // Rebuild typing attrs for the current block (Return may
            // have moved us into a list with paragraph styling) with
            // NO inline marks active.
            let loc = tv.selectedRange.location
            let block: EditorBlock = {
                guard tv.attributedText.length > 0,
                      let raw = tv.attributedText.attribute(EditorAttr.block, at: max(0, loc - 1), effectiveRange: nil) as? String,
                      let b = EditorBlock(rawValue: raw)
                else { return .p }
                return b
            }()
            var typing = block.attrs(bold: false, italic: false)
            typing.removeValue(forKey: .underlineStyle)
            typing.removeValue(forKey: .strikethroughStyle)
            typing.removeValue(forKey: .strokeWidth)
            typing.removeValue(forKey: .obliqueness)
            tv.typingAttributes = typing
        }

        /// If `shouldChangeTextIn` spotted a Return inside a list block,
        /// UIKit has now inserted the `\n` character. Patch up the new
        /// line to be either another item of the same list (non-empty
        /// previous line) or a plain paragraph that escapes the list
        /// (previous line was empty — user wanted to exit).
        private func consumePendingListContinuation(_ tv: UITextView) {
            guard let state = pendingListContinuation else { return }
            pendingListContinuation = nil

            let caret = tv.selectedRange.location
            // Sanity: we should be right after a freshly-inserted \n.
            guard caret > 0 else { return }

            if state.isEmptyLine {
                // Empty checklist/list line + Return → exit to a plain
                // paragraph. Strip the leading checkbox attachment on
                // the prior empty line if any.
                let m = NSMutableAttributedString(attributedString: tv.attributedText)
                // Remove the checkbox attachment that was on the empty line.
                if state.block == .checklist,
                   state.lineStart < m.length,
                   m.attribute(.attachment, at: state.lineStart, effectiveRange: nil) is CheckboxAttachment {
                    m.deleteCharacters(in: NSRange(location: state.lineStart, length: 1))
                }
                // Strip any residual block attribute on the line that
                // held the checkbox and on the fresh \n just inserted.
                let end = min(m.length, state.lineStart + 2)
                if state.lineStart < end {
                    m.removeAttribute(EditorAttr.block, range: NSRange(location: state.lineStart, length: end - state.lineStart))
                }
                tv.attributedText = m
                // Place caret at the start of where the checkbox used to
                // be — the new empty paragraph.
                tv.selectedRange = NSRange(location: state.lineStart, length: 0)
                var typing = EditorBlock.p.attrs(bold: false, italic: false)
                typing.removeValue(forKey: .strokeWidth)
                tv.typingAttributes = typing
                return
            }

            // Non-empty line + Return. UIKit inserted just `\n` at
            // `caret - 1`. Tag that newline with the list block type so
            // round-tripping sees it, and for checklists insert a fresh
            // unchecked CheckboxAttachment at the caret as the new
            // line head.
            let m = NSMutableAttributedString(attributedString: tv.attributedText)
            let blockAttrs = state.block.attrs(bold: false, italic: false)
            // Tag the \n itself.
            let newlineIdx = caret - 1
            if newlineIdx >= 0, newlineIdx < m.length {
                m.addAttribute(EditorAttr.block, value: state.block.rawValue, range: NSRange(location: newlineIdx, length: 1))
            }
            if state.block == .checklist {
                let box = NSMutableAttributedString(attachment: CheckboxAttachment(checked: false))
                box.addAttributes(blockAttrs, range: NSRange(location: 0, length: box.length))
                m.insert(box, at: caret)
                tv.attributedText = m
                tv.selectedRange = NSRange(location: caret + box.length, length: 0)
            } else {
                tv.attributedText = m
                tv.selectedRange = NSRange(location: caret, length: 0)
            }
            // Typing attributes inherit the block but drop stroke/italic
            // so next keystrokes are plain body text in the list.
            var typing = state.block.attrs(bold: false, italic: false)
            typing.removeValue(forKey: .strokeWidth)
            tv.typingAttributes = typing
        }
        func textViewDidChangeSelection(_ tv: UITextView) {
            parent.applyTypingAttributes(tv)
            updateTrigger(tv)
        }

        /// Scroll forwarding — drives CheckboxOverlay's re-layout so the
        /// real checkbox buttons track the (invisible) attachment
        /// placeholders as the user pans the text view.
        func scrollViewDidScroll(_ sv: UIScrollView) { parent.onScroll?() }

        /// Tap gesture on the UITextView. The SwiftUI CheckboxOverlay
        /// is hit-test-transparent (otherwise it blocks scroll) so
        /// checkbox taps come through here instead. Detect hits on a
        /// CheckboxAttachment's glyph region and toggle its `checked`
        /// state; the overlay re-renders the animated state change.
        @objc func handleTap(_ g: UITapGestureRecognizer) {
            guard let tv = g.view as? UITextView else { return }
            let point = g.location(in: tv)
            let origin = CGPoint(x: point.x - tv.textContainerInset.left,
                                 y: point.y - tv.textContainerInset.top)
            var frac: CGFloat = 0
            let idx = tv.layoutManager.characterIndex(
                for: origin,
                in: tv.textContainer,
                fractionOfDistanceBetweenInsertionPoints: &frac
            )
            guard idx >= 0, idx < tv.attributedText.length,
                  tv.attributedText.attribute(.attachment, at: idx, effectiveRange: nil) is CheckboxAttachment
            else { return }
            EditorBlockAction.toggleCheckbox(at: idx, in: tv)
        }

        @MainActor private func commitToParent(_ tv: UITextView) {
            let s = tv.attributedText ?? NSAttributedString()
            lastAssignedRevision = s.hash
            parent.attributed = s
            parent.onChange()
        }

        @MainActor private func updateTrigger(_ tv: UITextView) {
            let sel = tv.selectedRange
            guard sel.length == 0, sel.location > 0 else { parent.trigger = nil; return }
            let upto = (tv.text as NSString).substring(to: sel.location)
            guard let atRange = upto.range(of: "@", options: .backwards) else { parent.trigger = nil; return }
            let atIdx = upto.distance(from: upto.startIndex, to: atRange.lowerBound)
            if atIdx > 0 {
                let prev = upto[upto.index(upto.startIndex, offsetBy: atIdx - 1)]
                if !prev.isWhitespace && !prev.isNewline { parent.trigger = nil; return }
            }
            let query = String(upto.suffix(upto.count - atIdx - 1))
            if query.contains(where: { $0.isWhitespace || $0.isNewline }) { parent.trigger = nil; return }
            let start = tv.position(from: tv.beginningOfDocument, offset: atIdx) ?? tv.beginningOfDocument
            let end = tv.position(from: tv.beginningOfDocument, offset: sel.location) ?? tv.beginningOfDocument
            let range = tv.textRange(from: start, to: end) ?? tv.textRange(from: end, to: end)!
            parent.trigger = MentionTriggerState(query: query, caretRect: tv.convert(tv.firstRect(for: range), to: nil), atIndex: atIdx)
        }
    }
}

@MainActor func insertMention(into tv: UITextView?, trigger: MentionTriggerState, kind: EntityKind, id: UUID, title: String) {
    guard let tv else { return }
    let replace = NSRange(location: trigger.atIndex, length: tv.selectedRange.location - trigger.atIndex)
    let m = NSMutableAttributedString(attributedString: tv.attributedText)
    m.replaceCharacters(in: replace, with: "")
    let pill = NSMutableAttributedString(attachment: MentionAttachment(kind: kind, targetId: id, title: title))
    pill.append(NSAttributedString(string: "\u{00A0}", attributes: [.font: EditorBlock.p.font(bold: false, italic: false), .foregroundColor: MentionTextView.bodyColor]))
    m.insert(pill, at: replace.location)
    tv.attributedText = m
    tv.selectedRange = NSRange(location: replace.location + pill.length, length: 0)
}
