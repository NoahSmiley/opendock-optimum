import UIKit

/// Inline attachment drawn at the start of every checklist line. Its visible
/// image reflects the line's `EditorAttr.checked` attribute. Tapping the
/// attachment region toggles the attribute; the editor redraws the image.
final class CheckboxAttachment: NSTextAttachment {
    var checked: Bool {
        didSet { if oldValue != checked { image = Self.render(checked: checked) } }
    }

    init(checked: Bool) {
        self.checked = checked
        super.init(data: nil, ofType: nil)
        image = Self.render(checked: checked)
    }
    required init?(coder: NSCoder) { fatalError() }

    override func attachmentBounds(for textContainer: NSTextContainer?, proposedLineFragment lineFrag: CGRect,
                                   glyphPosition position: CGPoint, characterIndex charIndex: Int) -> CGRect {
        let img = image ?? Self.render(checked: checked)
        return CGRect(x: 0, y: -3, width: img.size.width, height: img.size.height)
    }

    static func render(checked: Bool) -> UIImage {
        let size = CGSize(width: 20, height: 20)
        let r = UIGraphicsImageRenderer(size: size)
        return r.image { _ in
            let rect = CGRect(x: 2, y: 2, width: 14, height: 14)
            let path = UIBezierPath(roundedRect: rect, cornerRadius: 3)
            if checked {
                UIColor(Theme.muted).setFill(); path.fill()
                let tick = UIBezierPath()
                tick.move(to: CGPoint(x: 5, y: 9))
                tick.addLine(to: CGPoint(x: 8, y: 12))
                tick.addLine(to: CGPoint(x: 13, y: 6))
                tick.lineWidth = 1.5; tick.lineCapStyle = .round; tick.lineJoinStyle = .round
                UIColor(Theme.bg).setStroke(); tick.stroke()
            } else {
                UIColor(Theme.muted).setStroke(); path.lineWidth = 1; path.stroke()
            }
        }
    }
}
