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
        // Height 32 forces each checklist line to be at least 32pt tall
        // so consecutive boxes get ~14pt of breathing room between them
        // (18pt box + 14pt slack). NSParagraphStyle.minimumLineHeight
        // wasn't reliably respected by the layout manager across iOS
        // versions; a tall attachment is. Width reservation is 26pt
        // (18pt box + 8pt gap before the following text).
        CGRect(x: 0, y: -7, width: 26, height: 32)
    }

    override func image(forBounds imageBounds: CGRect, textContainer: NSTextContainer?,
                        characterIndex charIndex: Int) -> UIImage? {
        // Explicitly return nil so NSLayoutManager doesn't draw anything.
        // The SwiftUI overlay owns the visual.
        nil
    }
}
