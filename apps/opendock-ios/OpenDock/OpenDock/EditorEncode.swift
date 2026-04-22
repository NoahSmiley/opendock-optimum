import UIKit

/// Encode the editor's NSAttributedString back to the HTML shape the
/// backend and Tauri expect. Each logical line becomes a block element.
enum EditorEncode {
    static func encode(_ attr: NSAttributedString) -> String {
        var out = ""
        let ns = attr.string as NSString
        var cursor = 0
        while cursor < ns.length {
            let nl = ns.range(of: "\n", range: NSRange(location: cursor, length: ns.length - cursor))
            let end = nl.location == NSNotFound ? ns.length : nl.location
            let lineRange = NSRange(location: cursor, length: end - cursor)
            out += encodeLine(attr, range: lineRange)
            cursor = (nl.location == NSNotFound) ? ns.length : nl.location + 1
        }
        if out.isEmpty { out = "<p></p>" }
        return out
    }

    private static func encodeLine(_ attr: NSAttributedString, range: NSRange) -> String {
        let block = blockFor(attr, at: range.location)
        let sub = range.length > 0 ? attr.attributedSubstring(from: range) : NSAttributedString()
        let inner = encodeInline(sub)
        switch block {
        case .p: return "<p>\(inner)</p>"
        case .h1: return "<h1>\(inner)</h1>"
        case .h2: return "<h2>\(inner)</h2>"
        case .h3: return "<h3>\(inner)</h3>"
        case .ul: return "<ul><li>\(inner)</li></ul>"
        case .ol: return "<ol><li>\(inner)</li></ol>"
        case .checklist:
            let checked = range.length > 0 &&
                (attr.attribute(EditorAttr.checked, at: range.location, effectiveRange: nil) as? Bool) == true
            let cls = checked ? "check-box checked" : "check-box"
            return "<ul class=\"checklist\"><li class=\"check-item\">" +
                "<span class=\"\(cls)\"></span><span class=\"check-text\">\(inner)</span></li></ul>"
        }
    }

    private static func encodeInline(_ line: NSAttributedString) -> String {
        var out = ""
        line.enumerateAttributes(in: NSRange(location: 0, length: line.length)) { attrs, r, _ in
            if attrs[.attachment] is CheckboxAttachment { return }  // drawn via block wrapper
            // Skip the leading bullet / number marker chars on ul / ol
            // lines — the <ul><li> / <ol><li> wrapping is what renders
            // the marker in HTML; the stored marker text is editor-only.
            if (attrs[EditorAttr.listMarker] as? Bool) == true { return }
            if let att = attrs[.attachment] as? MentionAttachment {
                out += "<span class=\"mention\" contenteditable=\"false\" data-kind=\"\(att.kind.rawValue)\" " +
                    "data-id=\"\(att.targetId.uuidString.lowercased())\">@\(escape(att.title))</span>"
                return
            }
            let raw = line.attributedSubstring(from: r).string
            let font = attrs[.font] as? UIFont
            // Face name is the source of truth for bold / italic since
            // OpenAISans ships real Bold + Italic + BoldItalic faces.
            // We also honour legacy strokeWidth / obliqueness attrs from
            // pre-real-font notes so their HTML still round-trips
            // correctly; new runs use font face only.
            let fname = font?.fontName.lowercased() ?? ""
            let hasStroke = (attrs[.strokeWidth] as? CGFloat ?? 0) < 0
            let hasObliqueness = (attrs[.obliqueness] as? CGFloat ?? 0) > 0
            let bold = fname.contains("bold") || hasStroke
            let italic = fname.contains("italic") || hasObliqueness
            let underline = (attrs[.underlineStyle] as? Int ?? 0) != 0
            let strike = (attrs[.strikethroughStyle] as? Int ?? 0) != 0
            var s = escape(raw)
            if bold { s = "<strong>\(s)</strong>" }
            if italic { s = "<em>\(s)</em>" }
            if underline { s = "<u>\(s)</u>" }
            if strike { s = "<s>\(s)</s>" }
            out += s
        }
        return out
    }

    private static func blockFor(_ attr: NSAttributedString, at loc: Int) -> EditorBlock {
        guard loc < attr.length,
              let raw = attr.attribute(EditorAttr.block, at: loc, effectiveRange: nil) as? String,
              let b = EditorBlock(rawValue: raw)
        else { return .p }
        return b
    }

    private static func escape(_ s: String) -> String {
        s.replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
    }
}
