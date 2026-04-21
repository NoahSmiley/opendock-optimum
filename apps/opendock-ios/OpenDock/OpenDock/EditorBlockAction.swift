import UIKit

/// Change the block type of the line containing the caret, inserting or
/// removing a leading checkbox attachment as the type demands. Rewrites
/// every non-attachment run's font to match the new block.
@MainActor enum EditorBlockAction {
    static func set(_ block: EditorBlock, in tv: UITextView) {
        let m = NSMutableAttributedString(attributedString: tv.attributedText)
        let (start, end, caret) = lineRange(tv)
        var lineStart = start, lineEnd = end, newCaret = caret

        // If the line already starts with a checkbox, drop it.
        if lineStart < m.length,
           m.attribute(.attachment, at: lineStart, effectiveRange: nil) is CheckboxAttachment {
            m.deleteCharacters(in: NSRange(location: lineStart, length: 1))
            lineEnd -= 1
            if newCaret > lineStart { newCaret -= 1 }
        }

        let lineRange = NSRange(location: lineStart, length: max(0, lineEnd - lineStart))
        if lineRange.length > 0 {
            m.addAttribute(EditorAttr.block, value: block.rawValue, range: lineRange)
            if block != .checklist { m.removeAttribute(EditorAttr.checked, range: lineRange) }
            m.enumerateAttributes(in: lineRange) { attrs, sub, _ in
                if attrs[.attachment] != nil { return }
                let f = (attrs[.font] as? UIFont) ?? EditorBlock.p.font(bold: false, italic: false)
                let bold = f.fontDescriptor.symbolicTraits.contains(.traitBold)
                let italic = f.fontDescriptor.symbolicTraits.contains(.traitItalic)
                m.addAttribute(.font, value: block.font(bold: bold, italic: italic), range: sub)
            }
        }

        if block == .checklist {
            let box = NSAttributedString(attachment: CheckboxAttachment(checked: false))
            m.insert(box, at: lineStart)
            newCaret += 1
        }

        tv.attributedText = m
        tv.selectedRange = NSRange(location: min(newCaret, m.length), length: 0)
        var typing = tv.typingAttributes
        typing[.font] = block.font(bold: false, italic: false)
        typing[EditorAttr.block] = block.rawValue
        tv.typingAttributes = typing
        tv.delegate?.textViewDidChange?(tv)
    }

    /// Toggle the `checked` state of the checklist line whose checkbox sits at `loc`.
    static func toggleCheckbox(at loc: Int, in tv: UITextView) {
        guard loc < tv.attributedText.length,
              tv.attributedText.attribute(.attachment, at: loc, effectiveRange: nil) is CheckboxAttachment else { return }
        let m = NSMutableAttributedString(attributedString: tv.attributedText)
        let (start, end, _) = lineRange(tv, at: loc)
        let line = NSRange(location: start, length: end - start)
        let wasChecked = (m.attribute(EditorAttr.checked, at: start, effectiveRange: nil) as? Bool) == true
        m.replaceCharacters(in: NSRange(location: loc, length: 1),
                            with: NSAttributedString(attachment: CheckboxAttachment(checked: !wasChecked)))
        if wasChecked { m.removeAttribute(EditorAttr.checked, range: line) }
        else { m.addAttribute(EditorAttr.checked, value: true, range: line) }
        m.addAttribute(EditorAttr.block, value: EditorBlock.checklist.rawValue, range: line)
        tv.attributedText = m
        tv.delegate?.textViewDidChange?(tv)
    }

    private static func lineRange(_ tv: UITextView, at fromLoc: Int? = nil) -> (Int, Int, Int) {
        let ns = tv.text as NSString
        let caret = fromLoc ?? tv.selectedRange.location
        var s = caret
        while s > 0, ns.character(at: s - 1) != 0x0A { s -= 1 }
        var e = caret
        while e < ns.length, ns.character(at: e) != 0x0A { e += 1 }
        return (s, e, caret)
    }
}
