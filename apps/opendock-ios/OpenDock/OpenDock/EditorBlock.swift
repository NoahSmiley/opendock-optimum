import UIKit

/// The editor represents each "line" (newline-separated run) as a single
/// block with a type and some inline content. Used by both the HTML
/// encoder/decoder and the toolbar action logic.
enum EditorBlock: String {
    case p, h1, h2, h3, ul, ol, checklist

    /// Font to stamp on body text in this block. Sizes mirror the Tauri
    /// `.rich-editor` CSS: H1 22 / H2 18 / H3 16, body bumped to 16 for
    /// comfortable reading on mobile (was 15, user flagged as too small).
    @MainActor func font(bold: Bool, italic: Bool) -> UIFont {
        let size: CGFloat
        let semibold: Bool
        switch self {
        case .h1: size = 22; semibold = true
        case .h2: size = 18; semibold = true
        case .h3: size = 16; semibold = true
        default: size = 16; semibold = false
        }
        let face = (semibold || bold) ? Theme.fontSemibold : Theme.fontName
        var f = UIFont(name: face, size: size) ?? UIFont.systemFont(ofSize: size, weight: (semibold || bold) ? .semibold : .regular)
        if italic {
            // Custom fonts (Inter etc.) often don't register an italic
            // variant in the font descriptor table, so withSymbolicTraits
            // returns nil. Fall back to the system italic font at the same
            // weight so italic actually renders.
            if let d = f.fontDescriptor.withSymbolicTraits(.traitItalic) {
                f = UIFont(descriptor: d, size: size)
            } else {
                f = UIFont.italicSystemFont(ofSize: size)
                if bold || semibold,
                   let bd = f.fontDescriptor.withSymbolicTraits([.traitItalic, .traitBold]) {
                    f = UIFont(descriptor: bd, size: size)
                }
            }
        }
        return f
    }

    /// Full attribute set for body text in this block with the given
    /// inline marks. Inline bold is rendered with a negative strokeWidth
    /// (synthetic bold — the OpenAI Sans family only ships Regular /
    /// Medium / Semibold, so Semibold alone is too subtle) AND a brighter
    /// foreground to mirror Tauri's `strong { font-weight:700; color:
    /// var(--a-text-active); }`. Headings already use Semibold by block
    /// and inherit `Theme.active` via the toolbar/decode paths.
    @MainActor func attrs(bold: Bool, italic: Bool) -> [NSAttributedString.Key: Any] {
        var a: [NSAttributedString.Key: Any] = [
            .font: font(bold: bold, italic: italic),
            EditorAttr.block: rawValue,
        ]
        let isHeading = self == .h1 || self == .h2 || self == .h3
        if bold {
            // -3 is a middleweight synthetic bold: heavier than Semibold
            // alone, doesn't smear, matches browser bold-face weight.
            a[.strokeWidth] = -3.0
            a[.foregroundColor] = UIColor(Theme.active)
        } else if isHeading {
            a[.foregroundColor] = UIColor(Theme.active)
        } else {
            a[.foregroundColor] = UIColor(Theme.text)
        }
        a[.paragraphStyle] = paragraphStyle
        return a
    }

    /// Paragraph style per block — controls vertical breathing room so
    /// consecutive list / checklist lines aren't jammed against each
    /// other. Mirrors Tauri's `.check-item { padding: 4px 0 }`.
    ///
    /// We use `lineHeightMultiple` + `paragraphSpacing` together: the
    /// multiple adds a constant line-height bump per line (actually
    /// visible in layout, unlike bare `paragraphSpacingBefore` which
    /// NSLayoutManager ignores when the block is a single glyph line),
    /// and the trailing spacing adds a final gap after each paragraph.
    @MainActor private var paragraphStyle: NSParagraphStyle {
        let ps = NSMutableParagraphStyle()
        switch self {
        case .ul, .ol, .checklist:
            // `minimumLineHeight` guarantees the line is at least this tall
            // regardless of glyph height. Paired with paragraphSpacing this
            // gives a reliable gap between consecutive list items that
            // `lineHeightMultiple` alone can't because the checkbox glyph
            // is fixed at 18pt.
            ps.minimumLineHeight = 28
            ps.paragraphSpacing = 6
        case .h1, .h2, .h3:
            ps.lineHeightMultiple = 1.2
            ps.paragraphSpacing = 4
        case .p:
            ps.lineHeightMultiple = 1.2
        }
        return ps
    }
}

/// Custom attribute keys the editor uses on NSAttributedString runs.
enum EditorAttr {
    /// The EditorBlock rawValue for this run's paragraph.
    static let block = NSAttributedString.Key("opendock.block")
    /// For checklist blocks, whether the line is checked.
    static let checked = NSAttributedString.Key("opendock.checked")
}
