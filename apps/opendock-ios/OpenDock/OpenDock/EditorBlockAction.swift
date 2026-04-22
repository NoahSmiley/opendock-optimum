import UIKit

/// Change the block type of the line containing the caret, inserting or
/// removing a leading checkbox attachment as the type demands. Rewrites
/// every non-attachment run's font to match the new block.
@MainActor enum EditorBlockAction {
    static func set(_ requestedBlock: EditorBlock, in tv: UITextView) {
        let m = NSMutableAttributedString(attributedString: tv.attributedText)
        let (start, end, caret) = lineRange(tv)
        var lineStart = start, lineEnd = end, newCaret = caret

        // If the user taps the SAME list button they're already on
        // (bullet on a ul line, checklist on a checklist line, etc.)
        // toggle the line back to a plain paragraph — matches Tauri
        // and Apple Notes behaviour. Otherwise apply the requested
        // block as-is.
        let block: EditorBlock = {
            guard lineStart < m.length,
                  let raw = m.attribute(EditorAttr.block, at: lineStart, effectiveRange: nil) as? String,
                  let cur = EditorBlock(rawValue: raw),
                  cur == requestedBlock
            else { return requestedBlock }
            return .p
        }()

        // If the line already starts with a checkbox, drop it.
        if lineStart < m.length,
           m.attribute(.attachment, at: lineStart, effectiveRange: nil) is CheckboxAttachment {
            m.deleteCharacters(in: NSRange(location: lineStart, length: 1))
            lineEnd -= 1
            if newCaret > lineStart { newCaret -= 1 }
        }

        // Strip any existing list-marker prefix (• or 1. with their
        // trailing nbsp). Walks forward past contiguous listMarker
        // characters so re-tapping the same bullet button doesn't
        // stack more markers onto the line — previously doing so
        // ended up with "••  foo" / "1. 1.  foo".
        while lineStart < m.length,
              (m.attribute(EditorAttr.listMarker, at: lineStart, effectiveRange: nil) as? Bool) == true {
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
                // Read bold / italic from face name — OpenAISans ships
                // real Bold / BoldItalic / RegularItalic faces, so the
                // font name is the source of truth. No more synthetic
                // strokeWidth / obliqueness attributes to strip.
                let lname = f.fontName.lowercased()
                let bold = lname.contains("bold")
                let italic = lname.contains("italic")
                let new = block.attrs(bold: bold, italic: italic)
                for (k, v) in new { m.addAttribute(k, value: v, range: sub) }
                // Clear any legacy stroke / obliqueness left over from
                // notes created before the real-font migration.
                m.removeAttribute(.strokeWidth, range: sub)
                m.removeAttribute(.obliqueness, range: sub)
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
        } else if block == .ul || block == .ol {
            // Prepend a visible marker so bullet / numbered items read
            // as lists in the editor. HTML encode strips this prefix
            // before wrapping the line in <ul><li>…</li></ul> so the
            // marker never double-renders on save/reload. Tagged with
            // EditorMarker.isListMarker so encode can identify and
            // remove it cleanly, and with the block attr so Return
            // auto-continue and HTML round-trip preserve the block.
            let markerText = block == .ul ? "•\u{00A0}" : "1.\u{00A0}"
            let markerAttrs = block.attrs(bold: false, italic: false)
                .merging([EditorAttr.listMarker: true]) { _, new in new }
            let marker = NSAttributedString(string: markerText, attributes: markerAttrs)
            m.insert(marker, at: lineStart)
            newCaret += markerText.count
        }

        tv.attributedText = m
        tv.selectedRange = NSRange(location: min(newCaret, m.length), length: 0)
        var typing = tv.typingAttributes
        let seed = block.attrs(bold: false, italic: false)
        for (k, v) in seed { typing[k] = v }
        typing.removeValue(forKey: .strokeWidth)
        tv.typingAttributes = typing
        renumberOrderedLists(in: tv)
        tv.delegate?.textViewDidChange?(tv)
    }

    /// Walk the document, find consecutive lines tagged .ol, and rewrite
    /// each line's leading marker to its running 1-based index. Resets
    /// the counter any time a non-.ol line (or the start of the doc) is
    /// encountered, so several independent ordered lists are numbered
    /// independently. Called after any change that could add, remove,
    /// or reorder OL items (block apply, Return auto-continue, toggle).
    static func renumberOrderedLists(in tv: UITextView) {
        let attr = tv.attributedText ?? NSAttributedString()
        guard attr.length > 0 else { return }
        let m = NSMutableAttributedString(attributedString: attr)
        let ns = attr.string as NSString
        // Walk line-by-line.
        var cursor = 0
        var counter = 0
        var dirty = false
        while cursor < ns.length {
            let nl = ns.range(of: "\n", range: NSRange(location: cursor, length: ns.length - cursor))
            let lineEnd = nl.location == NSNotFound ? ns.length : nl.location
            let lineStart = cursor
            cursor = (nl.location == NSNotFound) ? ns.length : nl.location + 1
            // Determine this line's block.
            let blockRaw = lineStart < m.length
                ? m.attribute(EditorAttr.block, at: lineStart, effectiveRange: nil) as? String
                : nil
            if blockRaw == EditorBlock.ol.rawValue {
                counter += 1
                // Find the run of listMarker characters at line start.
                var markerEnd = lineStart
                while markerEnd < lineEnd,
                      (m.attribute(EditorAttr.listMarker, at: markerEnd, effectiveRange: nil) as? Bool) == true {
                    markerEnd += 1
                }
                let desired = "\(counter).\u{00A0}"
                let current = m.attributedSubstring(from: NSRange(location: lineStart, length: markerEnd - lineStart)).string
                if current != desired {
                    let attrs = EditorBlock.ol.attrs(bold: false, italic: false)
                        .merging([EditorAttr.listMarker: true]) { _, new in new }
                    m.replaceCharacters(in: NSRange(location: lineStart, length: markerEnd - lineStart),
                                        with: NSAttributedString(string: desired, attributes: attrs))
                    dirty = true
                }
            } else {
                counter = 0   // non-OL line resets the numbering run
            }
        }
        if dirty {
            let sel = tv.selectedRange
            tv.attributedText = m
            tv.selectedRange = NSRange(location: min(sel.location, m.length), length: 0)
        }
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
