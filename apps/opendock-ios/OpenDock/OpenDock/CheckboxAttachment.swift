import UIKit

/// Zero-visual placeholder attachment reserving space at the start of
/// every checklist line. The actual clickable + animated checkbox is
/// rendered by `CheckboxOverlay` as a SwiftUI view positioned over the
/// UITextView — attachment images can't animate or match Tauri's
/// spring/ripple behaviour.
///
/// Bounds: 18pt wide + 8pt gap to match the Tauri `.check-box` CSS,
/// with a small negative y offset so the box visually centres against
/// the cap-height of 16pt body text.
final class CheckboxAttachment: NSTextAttachment {
    var checked: Bool

    init(checked: Bool) {
        self.checked = checked
        super.init(data: nil, ofType: nil)
    }
    required init?(coder: NSCoder) { fatalError() }

    override func attachmentBounds(for textContainer: NSTextContainer?, proposedLineFragment lineFrag: CGRect,
                                   glyphPosition position: CGPoint, characterIndex charIndex: Int) -> CGRect {
        // Height 24 (18pt box + 6pt bottom breathing) is enough to show
        // a visible gap between consecutive boxes without making the
        // spacing feel loose. y = -4 pulls the top of the box up above
        // the text baseline so the 18pt box visually centres with 16pt
        // body text (cap-height ~11pt sits in the baseline→top region).
        CGRect(x: 0, y: -4, width: 26, height: 24)
    }

    override func image(forBounds imageBounds: CGRect, textContainer: NSTextContainer?,
                        characterIndex charIndex: Int) -> UIImage? {
        // Explicitly return nil so NSLayoutManager doesn't draw anything.
        // The SwiftUI overlay owns the visual.
        nil
    }
}
