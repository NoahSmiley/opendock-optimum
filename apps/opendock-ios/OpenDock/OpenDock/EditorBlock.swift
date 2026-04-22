import UIKit

/// The editor represents each "line" (newline-separated run) as a single
/// block with a type and some inline content. Used by both the HTML
/// encoder/decoder and the toolbar action logic.
enum EditorBlock: String {
    case p, h1, h2, h3, ul, ol, checklist

    /// Real font face for the given block + inline marks. OpenAISans
    /// ships the full weight family (Regular through Bold, with Italic
    /// variants at every weight), so bold and italic are selected via
    /// named faces instead of synthetic strokeWidth / obliqueness
    /// transforms. This keeps bold and bold+italic at matching weights
    /// and avoids the layer of hacks that made earlier renders look off.
    @MainActor func font(bold: Bool, italic: Bool) -> UIFont {
        let size: CGFloat
        let headingSemibold: Bool
        switch self {
        case .h1: size = 26; headingSemibold = true
        case .h2: size = 22; headingSemibold = true
        case .h3: size = 19; headingSemibold = true
        default: size = 18; headingSemibold = false
        }
        let name: String
        if bold {
            name = italic ? Theme.fontBoldItalic : Theme.fontBold
        } else if headingSemibold {
            name = italic ? Theme.fontSemiboldItalic : Theme.fontSemibold
        } else {
            name = italic ? Theme.fontRegularItalic : Theme.fontName
        }
        return UIFont(name: name, size: size)
            ?? UIFont.systemFont(ofSize: size, weight: bold ? .bold : (headingSemibold ? .semibold : .regular))
    }

    /// Full attribute set for body text in this block with the given
    /// inline marks. Since bold and italic now come from real font
    /// faces, `attrs()` only decides foreground colour (brighter for
    /// bold / heading text, matching Tauri's `strong { color: active }`)
    /// and attaches the paragraph style.
    @MainActor func attrs(bold: Bool, italic: Bool) -> [NSAttributedString.Key: Any] {
        var a: [NSAttributedString.Key: Any] = [
            .font: font(bold: bold, italic: italic),
            EditorAttr.block: rawValue,
        ]
        let isHeading = self == .h1 || self == .h2 || self == .h3
        a[.foregroundColor] = (bold || isHeading) ? UIColor(Theme.active) : UIColor(Theme.text)
        a[.paragraphStyle] = paragraphStyle
        return a
    }

    @MainActor private var paragraphStyle: NSParagraphStyle {
        let ps = NSMutableParagraphStyle()
        ps.lineHeightMultiple = 1.2
        if self == .checklist || self == .ul || self == .ol {
            ps.paragraphSpacing = 4
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
