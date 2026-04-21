import UIKit

/// Floating accessory bar over the keyboard for formatting actions.
/// Actions mutate the attributed text of the owning UITextView in place.
@MainActor final class EditorToolbar: UIView {
    weak var textView: UITextView?

    init(textView: UITextView) {
        self.textView = textView
        super.init(frame: CGRect(x: 0, y: 0, width: 0, height: 44))
        backgroundColor = UIColor(Theme.input)
        autoresizingMask = [.flexibleWidth, .flexibleHeight]
        buildButtons()
    }
    required init?(coder: NSCoder) { fatalError() }

    private func buildButtons() {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.alignment = .center
        stack.distribution = .equalSpacing
        stack.spacing = 4
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.isLayoutMarginsRelativeArrangement = true
        stack.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 0, leading: 12, bottom: 0, trailing: 12)
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor),
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
        let specs: [(String, Selector)] = [
            ("bold", #selector(tapBold)),
            ("italic", #selector(tapItalic)),
            ("underline", #selector(tapUnderline)),
            ("strikethrough", #selector(tapStrike)),
            ("list.bullet", #selector(tapBullet)),
            ("list.number", #selector(tapOrdered)),
            ("checklist.checked", #selector(tapChecklist)),
            ("keyboard.chevron.compact.down", #selector(tapDismiss)),
        ]
        for (symbol, action) in specs { stack.addArrangedSubview(button(symbol: symbol, action: action)) }
    }

    private func button(symbol: String, action: Selector) -> UIButton {
        let b = UIButton(type: .system)
        b.setImage(UIImage(systemName: symbol), for: .normal)
        b.tintColor = UIColor(Theme.text)
        b.widthAnchor.constraint(equalToConstant: 36).isActive = true
        b.heightAnchor.constraint(equalToConstant: 36).isActive = true
        b.addTarget(self, action: action, for: .touchUpInside)
        return b
    }

    // MARK: - inline traits

    @objc private func tapBold() { toggleTrait(.traitBold) }
    @objc private func tapItalic() { toggleTrait(.traitItalic) }
    @objc private func tapUnderline() { toggleUnderline() }
    @objc private func tapStrike() { toggleStrike() }
    @objc private func tapBullet() { prefixLine(with: "• ") }
    @objc private func tapOrdered() { prefixLine(with: "1. ") }
    @objc private func tapChecklist() { prefixLine(with: "☐ ") }
    @objc private func tapDismiss() { textView?.resignFirstResponder() }

    private func toggleTrait(_ trait: UIFontDescriptor.SymbolicTraits) {
        guard let tv = textView, tv.selectedRange.length > 0 else { return }
        let m = NSMutableAttributedString(attributedString: tv.attributedText)
        let range = tv.selectedRange
        m.enumerateAttribute(.font, in: range, options: []) { value, sub, _ in
            let base = (value as? UIFont) ?? MentionTextView.bodyFont
            var traits = base.fontDescriptor.symbolicTraits
            if traits.contains(trait) { traits.remove(trait) } else { traits.insert(trait) }
            let desc = base.fontDescriptor.withSymbolicTraits(traits) ?? base.fontDescriptor
            let font = UIFont(descriptor: desc, size: base.pointSize)
            m.addAttribute(.font, value: font, range: sub)
        }
        tv.attributedText = m
        tv.selectedRange = range
    }

    private func toggleUnderline() { toggleStyleAttr(.underlineStyle) }
    private func toggleStrike() { toggleStyleAttr(.strikethroughStyle) }
    private func toggleStyleAttr(_ key: NSAttributedString.Key) {
        guard let tv = textView, tv.selectedRange.length > 0 else { return }
        let range = tv.selectedRange
        let m = NSMutableAttributedString(attributedString: tv.attributedText)
        let existing = m.attribute(key, at: range.location, effectiveRange: nil) as? Int ?? 0
        if existing == 0 {
            m.addAttribute(key, value: NSUnderlineStyle.single.rawValue, range: range)
        } else {
            m.removeAttribute(key, range: range)
        }
        tv.attributedText = m
        tv.selectedRange = range
    }

    /// Inserts a marker prefix at the start of the current line. Crude but
    /// it round-trips as plain text when viewed elsewhere; Tauri-shape
    /// block formatting comes in a follow-up.
    private func prefixLine(with marker: String) {
        guard let tv = textView else { return }
        let text = tv.text as NSString
        let cur = tv.selectedRange.location
        var lineStart = cur
        while lineStart > 0, text.character(at: lineStart - 1) != 0x0A { lineStart -= 1 }
        let m = NSMutableAttributedString(attributedString: tv.attributedText)
        m.insert(NSAttributedString(string: marker, attributes: MentionTextView.bodyAttrs), at: lineStart)
        tv.attributedText = m
        tv.selectedRange = NSRange(location: cur + (marker as NSString).length, length: 0)
    }
}
