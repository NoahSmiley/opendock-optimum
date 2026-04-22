import SwiftUI
import UIKit

/// Inline editor toolbar rendered as a SwiftUI subview of NoteEditorView,
/// sitting directly above the LinkedEntitiesSection. Previously this was a
/// UIKit inputAccessoryView attached to the text view's keyboard — that
/// didn't render at all without the software keyboard up, and collided
/// visually with the tab bar when it did. Rendering inline makes it
/// always-present and avoids the keyboard-presence dependency.
///
/// Actions mutate the owning UITextView's attributedText. Inline marks
/// (bold / italic / underline / strike) toggle on selection or flip the
/// typing attributes when the cursor is collapsed. Block actions
/// (H1/H2/bullet/ordered/checklist) transform the block on the current line.
@MainActor struct EditorToolbarView: View {
    let textView: () -> UITextView?
    @AppStorage("opendock.autocorrect") private var autocorrect: Bool = true

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                btn(symbol: "bold") { flipTrait(.traitBold) }
                btn(symbol: "italic") { flipTrait(.traitItalic) }
                btn(symbol: "underline") { toggleAttr(.underlineStyle, on: NSUnderlineStyle.single.rawValue) }
                btn(symbol: "strikethrough") { toggleAttr(.strikethroughStyle, on: NSUnderlineStyle.single.rawValue) }
                divider
                btn(symbol: "textformat.size.larger") { setBlock(.h1) }
                btn(symbol: "textformat.size") { setBlock(.h2) }
                btn(symbol: "textformat") { setBlock(.h3) }
                btn(symbol: "text.alignleft") { setBlock(.p) }
                divider
                btn(symbol: "list.bullet") { setBlock(.ul) }
                btn(symbol: "list.number") { setBlock(.ol) }
                btn(symbol: "checklist") { setBlock(.checklist) }
                divider
                // Autocorrect toggle. Persisted via AppStorage so the
                // pref survives relaunch; MentionTextView reads the
                // same key and applies it to the UITextView.
                btn(
                    symbol: autocorrect ? "textformat.abc.dottedunderline" : "textformat.abc",
                    tint: autocorrect ? Theme.active : Theme.text
                ) {
                    autocorrect.toggle()
                    applyAutocorrectToTextView()
                }
                // Keyboard dismiss. With short notes, the `.onDrag`
                // fallback doesn't have enough content to scroll, so
                // users need an explicit button.
                btn(symbol: "keyboard.chevron.compact.down") {
                    textView()?.resignFirstResponder()
                }
            }
            .padding(.horizontal, 12)
            .frame(minWidth: 0, maxWidth: .infinity, alignment: .leading)
        }
        .frame(height: 40)
        .background(Theme.input)
        .overlay(Rectangle().fill(Theme.border).frame(height: 0.5), alignment: .top)
        // Subtle right-edge fade so users can see there's more content
        // beyond the visible buttons. The toolbar is scrollable but with
        // no indicator it looks like a fixed clipped row otherwise.
        .overlay(alignment: .trailing) {
            LinearGradient(
                colors: [Theme.input.opacity(0), Theme.input],
                startPoint: .leading, endPoint: .trailing
            )
            .frame(width: 24)
            .allowsHitTesting(false)
        }
    }

    private var divider: some View {
        Rectangle().fill(Theme.border).frame(width: 0.5, height: 20)
            .padding(.horizontal, 2)
    }

    private func btn(symbol: String, tint: Color = Theme.text, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 15, weight: .regular))
                .foregroundColor(tint)
                .frame(width: 36, height: 32)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func applyAutocorrectToTextView() {
        guard let tv = textView() else { return }
        tv.autocorrectionType = autocorrect ? .yes : .no
        tv.spellCheckingType = autocorrect ? .yes : .no
        tv.smartQuotesType = autocorrect ? .yes : .no
        tv.smartDashesType = autocorrect ? .yes : .no
        tv.smartInsertDeleteType = autocorrect ? .yes : .no
        // Toggle first-responder to pick up the new input traits —
        // iOS ignores in-place changes while the keyboard is up.
        if tv.isFirstResponder {
            tv.resignFirstResponder()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                tv.becomeFirstResponder()
            }
        }
    }

    // MARK: - inline marks

    /// Apply or remove a bold/italic trait. Routes through
    /// `EditorBlock.attrs(bold:italic:)` which picks the right real
    /// font face (Bold / BoldItalic / RegularItalic / Regular) — no
    /// synthetic stroke or skew. Face name inspection reads the
    /// current run's bold/italic state; flipping the requested trait
    /// then rebuilds the full attribute set.
    private func flipTrait(_ trait: UIFontDescriptor.SymbolicTraits) {
        guard let tv = textView() else { return }
        let r = tv.selectedRange
        if r.length == 0 {
            var attrs = tv.typingAttributes
            let new = attrsByFlipping(trait, in: attrs)
            for (k, v) in new { attrs[k] = v }
            tv.typingAttributes = attrs
            return
        }
        let m = NSMutableAttributedString(attributedString: tv.attributedText)
        m.enumerateAttributes(in: r, options: []) { sub, range, _ in
            let new = attrsByFlipping(trait, in: sub)
            for (k, v) in new { m.addAttribute(k, value: v, range: range) }
        }
        tv.attributedText = m
        tv.selectedRange = r
        tv.delegate?.textViewDidChange?(tv)
    }

    /// Read bold / italic state from the current run's font face, then
    /// flip the requested trait and rebuild attrs from the target block.
    /// OpenAISans ships real Bold + Italic + BoldItalic variants so we
    /// can detect from the registered face name — `symbolicTraits` on
    /// named custom faces isn't always populated, but the face name is.
    private func attrsByFlipping(_ trait: UIFontDescriptor.SymbolicTraits,
                                 in attrs: [NSAttributedString.Key: Any]) -> [NSAttributedString.Key: Any] {
        let base = (attrs[.font] as? UIFont) ?? EditorBlock.p.font(bold: false, italic: false)
        let lname = base.fontName.lowercased()
        let isBold = lname.contains("bold")   // matches Bold + BoldItalic
        let isItalic = lname.contains("italic")
        let block = (attrs[EditorAttr.block] as? String).flatMap(EditorBlock.init(rawValue:)) ?? .p
        let wantBold = trait == .traitBold ? !isBold : isBold
        let wantItalic = trait == .traitItalic ? !isItalic : isItalic
        return block.attrs(bold: wantBold, italic: wantItalic)
    }

    private func toggleAttr(_ key: NSAttributedString.Key, on value: Int) {
        guard let tv = textView() else { return }
        let r = tv.selectedRange
        if r.length == 0 {
            var attrs = tv.typingAttributes
            let cur = attrs[key] as? Int ?? 0
            if cur == 0 { attrs[key] = value } else { attrs.removeValue(forKey: key) }
            tv.typingAttributes = attrs
            return
        }
        let m = NSMutableAttributedString(attributedString: tv.attributedText)
        let existing = (m.attribute(key, at: r.location, effectiveRange: nil) as? Int) ?? 0
        if existing == 0 { m.addAttribute(key, value: value, range: r) } else { m.removeAttribute(key, range: r) }
        tv.attributedText = m
        tv.selectedRange = r
        tv.delegate?.textViewDidChange?(tv)
    }

    // MARK: - block actions

    private func setBlock(_ block: EditorBlock) {
        guard let tv = textView() else { return }
        EditorBlockAction.set(block, in: tv)
    }
}
