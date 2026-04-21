import SwiftUI
import UIKit

/// SwiftUI overlay that paints one real `CheckboxButton` over every
/// `CheckboxAttachment` in the UITextView. Needed because NSTextAttachment
/// images are static — to match the Tauri checkbox (green fill, centered
/// tick, scale-pop + ring-ripple on toggle) we need real views.
///
/// The overlay is a sibling of the UITextView in NoteEditorView, not a
/// child; it reads positions via layoutManager, translates them through
/// the text view's scroll offset + content inset, and renders buttons at
/// the computed rects. Positions recompute on every attributed change.
@MainActor struct CheckboxOverlay: View {
    let textView: () -> UITextView?
    /// Bumped whenever the text view's attributedText changes so SwiftUI
    /// re-runs the position lookup. Bound to NoteEditorView's `attributed`.
    let revision: Int
    /// Bumped on scroll so boxes track the text as the user pans.
    let scrollRevision: Int

    var body: some View {
        // The overlay is PURELY visual. Hit-testing is disabled for
        // the whole subtree so scroll / tap / selection gestures flow
        // through to the UITextView beneath it. Checkbox taps are
        // routed via a UITapGestureRecognizer on the UITextView
        // (handled in MentionTextView.Coordinator.handleTap) which
        // toggles the attachment's `checked` state; the resulting
        // attributed-text change bumps the revision and this view
        // re-renders with the new checked/unchecked visuals.
        ZStack(alignment: .topLeading) {
            ForEach(checkboxes(), id: \.index) { box in
                CheckboxButton(checked: box.checked) { }
                    .frame(width: 26, height: 26)
                    .position(x: box.rect.midX, y: box.rect.midY)
            }
        }
        .allowsHitTesting(false)
    }

    private struct Box { let index: Int; let rect: CGRect; let checked: Bool }

    private func checkboxes() -> [Box] {
        _ = revision; _ = scrollRevision   // re-evaluate on either bump
        guard let tv = textView() else { return [] }
        let text = tv.attributedText ?? NSAttributedString()
        var out: [Box] = []
        text.enumerateAttribute(.attachment, in: NSRange(location: 0, length: text.length)) { v, range, _ in
            guard let att = v as? CheckboxAttachment else { return }
            let glyphRange = tv.layoutManager.glyphRange(forCharacterRange: range, actualCharacterRange: nil)
            // Use lineFragmentRect (not boundingRect) to get the full
            // typographic line including lineHeight + leading — that's
            // what determines the Y spacing between consecutive boxes.
            // boundingRect returns only the glyph box which for an 18pt
            // attachment is 18pt tall even if the line is taller, so
            // consecutive boxes end up 18pt apart even when paragraph
            // style says 28pt.
            // Line fragment: full typographic row including leading.
            // Used fragment (usedRectForTextContainer): tight bounding
            // box of actually-drawn glyphs on that line.
            let usedRect = tv.layoutManager.lineFragmentUsedRect(
                forGlyphAt: glyphRange.location,
                effectiveRange: nil
            )
            // Offset by the textContainerInset so we land on the visible
            // coordinate system, not the layout manager's.
            var rect = usedRect
            rect.origin.x += tv.textContainerInset.left
            rect.origin.y += tv.textContainerInset.top
            // Account for scroll. Without this the box drifts off-screen
            // when the user scrolls long notes.
            rect.origin.y -= tv.contentOffset.y
            rect.origin.x -= tv.contentOffset.x
            // Centre an 18pt box within the used-rect's vertical span.
            // usedRect is the actual glyph ink + descender so centering
            // on its middle aligns the box with the text's visual middle
            // instead of drifting above or below the baseline.
            let boxY = rect.origin.y + (rect.height - 18) / 2
            let boxRect = CGRect(x: rect.origin.x, y: boxY, width: 18, height: 18)
            out.append(Box(index: range.location, rect: boxRect, checked: att.checked))
        }
        return out
    }
}

/// One interactive checkbox. Green fill + white check when on, bordered
/// square when off. Toggle fires a scale-pop + green ring-ripple that
/// mirrors Tauri's `@keyframes check-pop` + `check-ring`.
@MainActor struct CheckboxButton: View {
    let checked: Bool
    let onToggle: () -> Void

    @State private var pop: CGFloat = 1
    @State private var ringScale: CGFloat = 0
    @State private var ringOpacity: Double = 0

    private let green = Color(red: 0x22/255.0, green: 0xc5/255.0, blue: 0x5e/255.0)

    var body: some View {
        Button(action: { trigger() }) {
            ZStack {
                // Ring ripple — green halo expanding behind the box.
                Circle()
                    .fill(green)
                    .opacity(ringOpacity)
                    .scaleEffect(ringScale)
                    .frame(width: 18, height: 18)
                    .allowsHitTesting(false)

                // The box itself.
                RoundedRectangle(cornerRadius: 5)
                    .fill(checked ? green : Color.clear)
                    .frame(width: 18, height: 18)
                    .overlay(
                        RoundedRectangle(cornerRadius: 5)
                            .stroke(checked ? green : Theme.faint, lineWidth: 1.5)
                    )
                    .overlay(checkmark.opacity(checked ? 1 : 0))
                    .scaleEffect(pop)
            }
            .frame(width: 26, height: 26)   // larger hit target
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var checkmark: some View {
        // 45°-rotated L with white strokes — matches the CSS
        // `::after { border-width: 0 2px 2px 0 }` construction.
        Path { p in
            p.move(to: CGPoint(x: 4, y: 9))
            p.addLine(to: CGPoint(x: 7.5, y: 12.5))
            p.addLine(to: CGPoint(x: 14, y: 5.5))
        }
        .stroke(Color.white, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
        .frame(width: 18, height: 18)
    }

    private func trigger() {
        onToggle()
        // Box pop: 1 → 1.2 → 1 over 0.4s with spring ease.
        withAnimation(.interpolatingSpring(mass: 0.6, stiffness: 320, damping: 14, initialVelocity: 6)) {
            pop = 1.2
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
            withAnimation(.interpolatingSpring(mass: 0.5, stiffness: 280, damping: 18)) {
                pop = 1
            }
        }
        // Ring ripple: starts at center fully-coloured, expands + fades.
        ringScale = 0; ringOpacity = 0.5
        withAnimation(.easeOut(duration: 0.6)) {
            ringScale = 2.5
            ringOpacity = 0
        }
    }
}
