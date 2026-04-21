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

    private func btn(symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 15, weight: .regular))
                .foregroundColor(Theme.text)
                .frame(width: 36, height: 32)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    // MARK: - inline marks

    /// Apply or remove a bold/italic trait. Custom fonts (Inter) don't
    /// register italic variants in their descriptor tables, so we can't
    /// just flip `symbolicTraits` — that returns nil for italic on the
    /// Theme font. Route through `EditorBlock.font(bold:italic:)` which
    /// falls back to the system italic face when the custom font lacks one.
    private func flipTrait(_ trait: UIFontDescriptor.SymbolicTraits) {
        guard let tv = textView() else { return }
        let r = tv.selectedRange
        if r.length == 0 {
            var attrs = tv.typingAttributes
            let base = (attrs[.font] as? UIFont) ?? EditorBlock.p.font(bold: false, italic: false)
            attrs[.font] = fontByFlipping(trait, on: base, in: attrs)
            tv.typingAttributes = attrs
            return
        }
        let m = NSMutableAttributedString(attributedString: tv.attributedText)
        m.enumerateAttributes(in: r, options: []) { sub, range, _ in
            let base = (sub[.font] as? UIFont) ?? EditorBlock.p.font(bold: false, italic: false)
            m.addAttribute(.font, value: fontByFlipping(trait, on: base, in: sub), range: range)
        }
        tv.attributedText = m
        tv.selectedRange = r
        tv.delegate?.textViewDidChange?(tv)
    }

    private func fontByFlipping(_ trait: UIFontDescriptor.SymbolicTraits,
                                on base: UIFont,
                                in attrs: [NSAttributedString.Key: Any]) -> UIFont {
        // Custom fonts (Inter Semibold / italic fallbacks) don't reliably
        // expose their traits via fontDescriptor.symbolicTraits — the face
        // name is a more trustworthy signal.
        let curTraits = base.fontDescriptor.symbolicTraits
        let lname = base.fontName.lowercased()
        let isBold = curTraits.contains(.traitBold)
            || lname.contains("semibold") || lname.contains("bold")
        let isItalic = curTraits.contains(.traitItalic)
            || lname.contains("italic") || lname.contains("oblique")
        let block = (attrs[EditorAttr.block] as? String).flatMap(EditorBlock.init(rawValue:)) ?? .p
        let wantBold = trait == .traitBold ? !isBold : isBold
        let wantItalic = trait == .traitItalic ? !isItalic : isItalic
        return block.font(bold: wantBold, italic: wantItalic)
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
