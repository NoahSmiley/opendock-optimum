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
        // Match the 18pt body font's intrinsic line height (~21-22pt)
        // so the line doesn't balloon around the checkbox — inflated
        // line height makes UITextView draw a tall caret. Width 26
        // reserves 18pt for the box + 8pt gap before the following
        // text. y = -3 nudges the box up a hair so it centres against
        // the text's cap-height rather than sitting on the baseline.
        CGRect(x: 0, y: -3, width: 26, height: 21)
    }

    override func image(forBounds imageBounds: CGRect, textContainer: NSTextContainer?,
                        characterIndex charIndex: Int) -> UIImage? {
        // Explicitly return nil so NSLayoutManager doesn't draw anything.
        // The SwiftUI overlay owns the visual.
        nil
    }
}
