import UIKit

/// Floating accessory bar over the keyboard. Actions mutate the owning
/// UITextView's attributedText. Inline marks (bold / italic / underline /
/// strike) toggle on selection; block actions (H1/H2/H3/bullet/ordered/
/// checklist) transform the block on the current line.
@MainActor final class EditorToolbar: UIView {
    weak var textView: UITextView?

    init(textView: UITextView) {
        self.textView = textView
        super.init(frame: CGRect(x: 0, y: 0, width: 0, height: 44))
        backgroundColor = UIColor(Theme.input)
        autoresizingMask = [.flexibleWidth, .flexibleHeight]
        build()
    }
    required init?(coder: NSCoder) { fatalError() }

    private func build() {
        let scroll = UIScrollView()
        scroll.translatesAutoresizingMaskIntoConstraints = false
        scroll.showsHorizontalScrollIndicator = false
        addSubview(scroll)
        let stack = UIStackView()
        stack.axis = .horizontal; stack.spacing = 2; stack.alignment = .center
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.isLayoutMarginsRelativeArrangement = true
        stack.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 0, leading: 8, bottom: 0, trailing: 8)
        scroll.addSubview(stack)
        NSLayoutConstraint.activate([
            scroll.leadingAnchor.constraint(equalTo: leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: trailingAnchor),
            scroll.topAnchor.constraint(equalTo: topAnchor),
            scroll.bottomAnchor.constraint(equalTo: bottomAnchor),
            stack.leadingAnchor.constraint(equalTo: scroll.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: scroll.trailingAnchor),
            stack.topAnchor.constraint(equalTo: scroll.topAnchor),
            stack.bottomAnchor.constraint(equalTo: scroll.bottomAnchor),
            stack.heightAnchor.constraint(equalTo: scroll.heightAnchor),
        ])
        let specs: [(String, Selector)] = [
            ("bold", #selector(tapBold)),
            ("italic", #selector(tapItalic)),
            ("underline", #selector(tapUnderline)),
            ("strikethrough", #selector(tapStrike)),
            ("textformat.size.larger", #selector(tapH1)),
            ("textformat.size", #selector(tapH2)),
            ("textformat", #selector(tapH3)),
            ("text.alignleft", #selector(tapPara)),
            ("list.bullet", #selector(tapBullet)),
            ("list.number", #selector(tapOrdered)),
            ("checklist", #selector(tapChecklist)),
            ("keyboard.chevron.compact.down", #selector(tapDismiss)),
        ]
        for (s, a) in specs { stack.addArrangedSubview(button(symbol: s, action: a)) }
    }

    private func button(symbol: String, action: Selector) -> UIButton {
        let b = UIButton(type: .system)
        b.setImage(UIImage(systemName: symbol), for: .normal)
        b.tintColor = UIColor(Theme.text)
        b.widthAnchor.constraint(equalToConstant: 38).isActive = true
        b.heightAnchor.constraint(equalToConstant: 38).isActive = true
        b.addTarget(self, action: action, for: .touchUpInside)
        return b
    }

    // MARK: - inline marks

    @objc private func tapBold() { toggleFontTrait(.traitBold) }
    @objc private func tapItalic() { toggleFontTrait(.traitItalic) }
    @objc private func tapUnderline() { toggleAttr(.underlineStyle, on: NSUnderlineStyle.single.rawValue) }
    @objc private func tapStrike() { toggleAttr(.strikethroughStyle, on: NSUnderlineStyle.single.rawValue) }

    private func toggleFontTrait(_ trait: UIFontDescriptor.SymbolicTraits) {
        guard let tv = textView else { return }
        let r = tv.selectedRange
        if r.length == 0 { flipTypingTrait(tv, trait); return }
        let m = NSMutableAttributedString(attributedString: tv.attributedText)
        m.enumerateAttribute(.font, in: r, options: []) { v, sub, _ in
            let base = (v as? UIFont) ?? EditorBlock.p.font(bold: false, italic: false)
            var t = base.fontDescriptor.symbolicTraits
            if t.contains(trait) { t.remove(trait) } else { t.insert(trait) }
            let d = base.fontDescriptor.withSymbolicTraits(t) ?? base.fontDescriptor
            m.addAttribute(.font, value: UIFont(descriptor: d, size: base.pointSize), range: sub)
        }
        tv.attributedText = m
        tv.selectedRange = r
        tv.delegate?.textViewDidChange?(tv)
    }

    private func flipTypingTrait(_ tv: UITextView, _ trait: UIFontDescriptor.SymbolicTraits) {
        var attrs = tv.typingAttributes
        let base = (attrs[.font] as? UIFont) ?? EditorBlock.p.font(bold: false, italic: false)
        var t = base.fontDescriptor.symbolicTraits
        if t.contains(trait) { t.remove(trait) } else { t.insert(trait) }
        let d = base.fontDescriptor.withSymbolicTraits(t) ?? base.fontDescriptor
        attrs[.font] = UIFont(descriptor: d, size: base.pointSize)
        tv.typingAttributes = attrs
    }

    private func toggleAttr(_ key: NSAttributedString.Key, on value: Int) {
        guard let tv = textView else { return }
        let r = tv.selectedRange
        if r.length == 0 {
            var attrs = tv.typingAttributes
            let cur = attrs[key] as? Int ?? 0
            if cur == 0 { attrs[key] = value } else { attrs.removeValue(forKey: key) }
            tv.typingAttributes = attrs
            return
        }
        let m = NSMutableAttributedString(attributedString: tv.attributedText)
        let existing = (m.attribute(key, at: r.location, effectiveRange: nil) as? Int) ?? 0
        if existing == 0 { m.addAttribute(key, value: value, range: r) } else { m.removeAttribute(key, range: r) }
        tv.attributedText = m
        tv.selectedRange = r
        tv.delegate?.textViewDidChange?(tv)
    }

    // MARK: - block actions

    @objc private func tapPara() { setBlock(.p) }
    @objc private func tapH1() { setBlock(.h1) }
    @objc private func tapH2() { setBlock(.h2) }
    @objc private func tapH3() { setBlock(.h3) }
    @objc private func tapBullet() { setBlock(.ul) }
    @objc private func tapOrdered() { setBlock(.ol) }
    @objc private func tapChecklist() { setBlock(.checklist) }
    @objc private func tapDismiss() { textView?.resignFirstResponder() }

    private func setBlock(_ block: EditorBlock) {
        guard let tv = textView else { return }
        EditorBlockAction.set(block, in: tv)
    }
}
