import UIKit

/// An atomic inline pill representing a mention. The pill carries the target
/// (kind + id) so we can re-render its title on mount, serialize to HTML on
/// save, and jump to the target on tap.
final class MentionAttachment: NSTextAttachment {
    let kind: EntityKind
    let targetId: UUID
    var title: String

    init(kind: EntityKind, targetId: UUID, title: String) {
        self.kind = kind
        self.targetId = targetId
        self.title = title
        super.init(data: nil, ofType: nil)
        image = renderImage()
    }
    required init?(coder: NSCoder) { fatalError("not used") }

    override func attachmentBounds(for textContainer: NSTextContainer?, proposedLineFragment lineFrag: CGRect,
                                   glyphPosition position: CGPoint, characterIndex charIndex: Int) -> CGRect {
        let img = image ?? renderImage()
        return CGRect(x: 0, y: -3, width: img.size.width, height: img.size.height)
    }

    private func renderImage() -> UIImage {
        let text = "@\(title.isEmpty ? "Untitled" : title)"
        let font = UIFont(name: Theme.fontMedium, size: 14) ?? UIFont.systemFont(ofSize: 14, weight: .medium)
        let textSize = (text as NSString).size(withAttributes: [.font: font])
        let padX: CGFloat = 6, padY: CGFloat = 2
        let size = CGSize(width: ceil(textSize.width + padX * 2), height: ceil(textSize.height + padY * 2))
        let r = UIGraphicsImageRenderer(size: size)
        return r.image { ctx in
            let rect = CGRect(origin: .zero, size: size).insetBy(dx: 0.5, dy: 0.5)
            let path = UIBezierPath(roundedRect: rect, cornerRadius: 4)
            UIColor(Theme.elevated).setFill(); path.fill()
            UIColor(Theme.border).setStroke(); path.lineWidth = 0.5; path.stroke()
            let attrs: [NSAttributedString.Key: Any] = [
                .font: font, .foregroundColor: UIColor(Theme.text),
            ]
            (text as NSString).draw(at: CGPoint(x: padX, y: padY), withAttributes: attrs)
            _ = ctx
        }
    }
}
