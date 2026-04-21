import UIKit

/// The editor represents each "line" (newline-separated run) as a single
/// block with a type and some inline content. Used by both the HTML
/// encoder/decoder and the toolbar action logic.
enum EditorBlock: String {
    case p, h1, h2, h3, ul, ol, checklist

    /// Font to stamp on body text in this block.
    @MainActor func font(bold: Bool, italic: Bool) -> UIFont {
        let size: CGFloat
        let semibold: Bool
        switch self {
        case .h1: size = 22; semibold = true
        case .h2: size = 18; semibold = true
        case .h3: size = 16; semibold = true
        default: size = 15; semibold = false
        }
        let face = (semibold || bold) ? Theme.fontSemibold : Theme.fontName
        var f = UIFont(name: face, size: size) ?? UIFont.systemFont(ofSize: size, weight: (semibold || bold) ? .semibold : .regular)
        if italic, let d = f.fontDescriptor.withSymbolicTraits(.traitItalic) {
            f = UIFont(descriptor: d, size: size)
        }
        return f
    }
}

/// Custom attribute keys the editor uses on NSAttributedString runs.
enum EditorAttr {
    /// The EditorBlock rawValue for this run's paragraph.
    static let block = NSAttributedString.Key("opendock.block")
    /// For checklist blocks, whether the line is checked.
    static let checked = NSAttributedString.Key("opendock.checked")
}
