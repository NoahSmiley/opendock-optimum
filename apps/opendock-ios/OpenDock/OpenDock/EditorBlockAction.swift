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
            // Paragraph style (line height, spacing) is a line-level
            // attribute — apply it across the whole range in one shot,
            // not only on runs with text content, so single-glyph
            // lines (eg. a line with just a checkbox attachment)
            // still pick it up.
            if let ps = block.attrs(bold: false, italic: false)[.paragraphStyle] {
                m.addAttribute(.paragraphStyle, value: ps, range: lineRange)
            }
            m.enumerateAttributes(in: lineRange) { attrs, sub, _ in
                if attrs[.attachment] != nil { return }
                let f = (attrs[.font] as? UIFont) ?? EditorBlock.p.font(bold: false, italic: false)
                let hasStroke = (attrs[.strokeWidth] as? CGFloat ?? 0) < 0
                // Custom fonts (Inter Semibold) don't register .traitBold in
                // their symbolic traits — we detect by strokeWidth (our
                // synthetic-bold signal) + fallback face-name, otherwise
                // block transitions silently strip inline bold.
                let hasObliqueness = (attrs[.obliqueness] as? CGFloat ?? 0) > 0
                let bold = hasStroke
                    || f.fontDescriptor.symbolicTraits.contains(.traitBold)
                    || f.fontName.lowercased().contains("semibold")
                    || f.fontName.lowercased().contains("bold")
                let italic = hasObliqueness
                    || f.fontDescriptor.symbolicTraits.contains(.traitItalic)
                    || f.fontName.lowercased().contains("italic")
                    || f.fontName.lowercased().contains("oblique")
                let new = block.attrs(bold: bold, italic: italic)
                for (k, v) in new { m.addAttribute(k, value: v, range: sub) }
                if !bold { m.removeAttribute(.strokeWidth, range: sub) }
                if !italic { m.removeAttribute(.obliqueness, range: sub) }
            }
        }

        if block == .checklist {
            // Tag the inserted attachment with the block attribute so
            // the coordinator can detect "we are on a checklist line"
            // when reading attributes from this character index — the
            // attachment is often the ONLY character on a fresh
            // checklist line, so without the tag shouldChangeTextIn
            // has nothing to look up and the Return auto-continue
            // silently falls through to the default insertion.
            let box = NSMutableAttributedString(attachment: CheckboxAttachment(checked: false))
            let boxAttrs = block.attrs(bold: false, italic: false)
            box.addAttributes(boxAttrs, range: NSRange(location: 0, length: box.length))
            m.insert(box, at: lineStart)
            newCaret += 1
        }

        tv.attributedText = m
        tv.selectedRange = NSRange(location: min(newCaret, m.length), length: 0)
        var typing = tv.typingAttributes
        let seed = block.attrs(bold: false, italic: false)
        for (k, v) in seed { typing[k] = v }
        typing.removeValue(forKey: .strokeWidth)
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
