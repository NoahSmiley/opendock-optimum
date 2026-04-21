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

struct MentionTextView: UIViewRepresentable {
    @Binding var attributed: NSAttributedString
    @Binding var trigger: MentionTriggerState?
    let onChange: () -> Void
    let ref: TextViewRef

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    @MainActor static let bodyColor: UIColor = UIColor(Theme.text)

    func makeUIView(context: Context) -> UITextView {
        let tv = UITextView()
        tv.backgroundColor = .clear
        tv.textColor = Self.bodyColor
        tv.tintColor = Self.bodyColor
        tv.textContainerInset = UIEdgeInsets(top: 8, left: 16, bottom: 8, right: 16)
        tv.keyboardDismissMode = .interactive
        tv.delegate = context.coordinator
        tv.layoutManager.delegate = context.coordinator
        tv.attributedText = attributed
        applyTypingAttributes(tv)
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTap(_:)))
        tap.cancelsTouchesInView = false
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

    /// Pick typing attributes from the char immediately before the caret so
    /// continuing to type preserves whatever format is active there.
    @MainActor func applyTypingAttributes(_ tv: UITextView) {
        let loc = tv.selectedRange.location
        if loc > 0 && loc <= tv.attributedText.length {
            var stop: NSRange = NSRange(location: 0, length: 0)
            let a = tv.attributedText.attributes(at: loc - 1, effectiveRange: &stop)
            if a[.attachment] == nil {
                var copy = a
                copy[.foregroundColor] = Self.bodyColor
                tv.typingAttributes = copy
                return
            }
        }
        // Default typing attrs: body text in current block.
        let block = (tv.attributedText.length > 0
                     ? tv.attributedText.attribute(EditorAttr.block, at: max(0, loc - 1), effectiveRange: nil) as? String
                     : nil)
            .flatMap { EditorBlock(rawValue: $0) } ?? .p
        tv.typingAttributes = [
            .font: block.font(bold: false, italic: false),
            .foregroundColor: Self.bodyColor,
            EditorAttr.block: block.rawValue,
        ]
    }

    final class Coordinator: NSObject, UITextViewDelegate, NSLayoutManagerDelegate, UIGestureRecognizerDelegate {
        var parent: MentionTextView
        var lastAssignedRevision: Int = 0
        init(_ parent: MentionTextView) { self.parent = parent }

        func gestureRecognizer(_ g: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool { true }

        /// Backspace across a pill deletes the whole attachment atomically.
        func textView(_ tv: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
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
            return true
        }

        func textViewDidChange(_ tv: UITextView) { commitToParent(tv); updateTrigger(tv) }
        func textViewDidChangeSelection(_ tv: UITextView) {
            parent.applyTypingAttributes(tv)
            updateTrigger(tv)
        }

        /// Detect taps on a CheckboxAttachment and toggle its state.
        @objc func handleTap(_ g: UITapGestureRecognizer) {
            guard let tv = g.view as? UITextView else { return }
            let point = g.location(in: tv)
            let origin = CGPoint(x: point.x - tv.textContainerInset.left, y: point.y - tv.textContainerInset.top)
            var frac: CGFloat = 0
            let idx = tv.layoutManager.characterIndex(for: origin, in: tv.textContainer,
                                                     fractionOfDistanceBetweenInsertionPoints: &frac)
            guard idx >= 0, idx < tv.attributedText.length,
                  tv.attributedText.attribute(.attachment, at: idx, effectiveRange: nil) is CheckboxAttachment else { return }
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
