import SwiftUI
import UIKit

/// Live @-mention trigger state. When non-nil, the popover shows.
struct MentionTriggerState: Equatable {
    var query: String
    var caretRect: CGRect
    var atIndex: Int  // character index of the @ in the text view
}

/// UIViewRepresentable wrapping UITextView so we can have:
///  - atomic inline mention pills (via MentionAttachment)
///  - backspace-deletes-whole-pill behaviour
///  - `@` trigger detection with caret-anchored popover
///  - HTML serialization that matches Tauri's pill shape
struct MentionTextView: UIViewRepresentable {
    @Binding var attributed: NSAttributedString
    @Binding var trigger: MentionTriggerState?
    let onChange: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    @MainActor static let bodyFont: UIFont = UIFont(name: Theme.fontName, size: 15) ?? UIFont.systemFont(ofSize: 15)
    @MainActor static let bodyColor: UIColor = UIColor(Theme.text)
    @MainActor static var bodyAttrs: [NSAttributedString.Key: Any] { [.font: bodyFont, .foregroundColor: bodyColor] }

    func makeUIView(context: Context) -> UITextView {
        let tv = UITextView()
        tv.backgroundColor = .clear
        tv.textColor = Self.bodyColor
        tv.tintColor = Self.bodyColor
        tv.font = Self.bodyFont
        tv.textContainerInset = UIEdgeInsets(top: 8, left: 16, bottom: 8, right: 16)
        tv.keyboardDismissMode = .interactive
        tv.delegate = context.coordinator
        tv.attributedText = Self.stamp(attributed)
        tv.typingAttributes = Self.bodyAttrs
        tv.inputAccessoryView = EditorToolbar(textView: tv)
        return tv
    }

    func updateUIView(_ tv: UITextView, context: Context) {
        if !context.coordinator.isApplyingLocalChange && tv.attributedText != attributed {
            let sel = tv.selectedRange
            tv.attributedText = Self.stamp(attributed)
            tv.typingAttributes = Self.bodyAttrs
            tv.selectedRange = NSRange(location: min(sel.location, tv.text.count), length: 0)
        }
    }

    /// Re-apply the base font + color to every non-attachment run so text
    /// is never rendered with the system default (black on dark = invisible).
    /// Attachments keep their own rendering (the pill image).
    @MainActor static func stamp(_ s: NSAttributedString) -> NSAttributedString {
        let m = NSMutableAttributedString(attributedString: s)
        m.enumerateAttributes(in: NSRange(location: 0, length: m.length)) { attrs, range, _ in
            if attrs[.attachment] != nil { return }
            m.addAttributes(bodyAttrs, range: range)
        }
        return m
    }

    final class Coordinator: NSObject, UITextViewDelegate {
        var parent: MentionTextView
        var isApplyingLocalChange = false
        init(_ parent: MentionTextView) { self.parent = parent }

        func baseTypingAttributes(_ tv: UITextView) -> [NSAttributedString.Key: Any] { MentionTextView.bodyAttrs }

        /// Detect if the caret is inside an in-progress @query and report it.
        func updateTrigger(_ tv: UITextView) {
            let sel = tv.selectedRange
            guard sel.length == 0, sel.location > 0 else { parent.trigger = nil; return }
            let ns = tv.text as NSString
            let upto = ns.substring(to: sel.location)
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
            let rect = tv.firstRect(for: range)
            parent.trigger = MentionTriggerState(query: query, caretRect: tv.convert(rect, to: nil), atIndex: atIdx)
        }

        /// Backspace across a pill deletes the whole attachment as one unit.
        func textView(_ tv: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
            if text.isEmpty, range.length == 1, range.location > 0 {
                let s = tv.attributedText.attributedSubstring(from: NSRange(location: range.location - 1, length: 1))
                if s.attribute(.attachment, at: 0, effectiveRange: nil) is MentionAttachment {
                    let wider = NSRange(location: range.location - 1, length: 1)
                    isApplyingLocalChange = true
                    let m = NSMutableAttributedString(attributedString: tv.attributedText)
                    m.replaceCharacters(in: wider, with: "")
                    tv.attributedText = m
                    tv.selectedRange = NSRange(location: wider.location, length: 0)
                    parent.attributed = m
                    parent.onChange()
                    isApplyingLocalChange = false
                    updateTrigger(tv)
                    return false
                }
            }
            return true
        }

        func textViewDidChange(_ tv: UITextView) {
            tv.typingAttributes = baseTypingAttributes(tv)
            isApplyingLocalChange = true
            parent.attributed = tv.attributedText
            parent.onChange()
            isApplyingLocalChange = false
            updateTrigger(tv)
        }

        func textViewDidChangeSelection(_ tv: UITextView) { updateTrigger(tv) }
    }
}

/// Convenience for inserting a mention at the active trigger range.
@MainActor func insertMention(into tv: UITextView?, trigger: MentionTriggerState, kind: EntityKind, id: UUID, title: String) {
    guard let tv else { return }
    let replaceRange = NSRange(location: trigger.atIndex, length: tv.selectedRange.location - trigger.atIndex)
    let m = NSMutableAttributedString(attributedString: tv.attributedText)
    let pill = NSAttributedString(attachment: MentionAttachment(kind: kind, targetId: id, title: title))
    let joined = NSMutableAttributedString(attributedString: pill)
    joined.append(NSAttributedString(string: "\u{00A0}", attributes: MentionTextView.bodyAttrs))
    m.replaceCharacters(in: replaceRange, with: joined)
    tv.attributedText = MentionTextView.stamp(m)
    tv.selectedRange = NSRange(location: replaceRange.location + joined.length, length: 0)
    tv.typingAttributes = MentionTextView.bodyAttrs
}
