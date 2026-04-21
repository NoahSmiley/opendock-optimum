import UIKit

/// HTML ↔ NSAttributedString conversion for the iOS note editor.
/// Uses the same mention pill shape as Tauri so the backend mention
/// extractor sees identical HTML from either client.
enum MentionHTML {
    /// Encode the editor's attributed string to HTML: plain text plus
    /// `<span class="mention" contenteditable="false" data-kind data-id>`
    /// for each attachment. Line breaks become `<p>` blocks.
    static func encode(_ attr: NSAttributedString) -> String {
        var paragraphs: [String] = []
        var current = ""
        attr.enumerateAttributes(in: NSRange(location: 0, length: attr.length)) { attrs, range, _ in
            if let att = attrs[.attachment] as? MentionAttachment {
                current += "<span class=\"mention\" contenteditable=\"false\" data-kind=\"\(att.kind.rawValue)\" data-id=\"\(att.targetId.uuidString.lowercased())\">@\(escapeHTML(att.title))</span>"
                return
            }
            let piece = (attr.attributedSubstring(from: range).string)
            for (i, line) in piece.components(separatedBy: "\n").enumerated() {
                if i > 0 { paragraphs.append("<p>" + current + "</p>"); current = "" }
                current += escapeHTML(line)
            }
        }
        paragraphs.append("<p>" + current + "</p>")
        return paragraphs.joined()
    }

    /// Parse HTML into an attributed string. Mention spans become
    /// MentionAttachment. Everything else becomes plain text (block tags
    /// map to newlines). The editor's typing attributes apply on render.
    static func decode(_ html: String) -> NSAttributedString {
        let out = NSMutableAttributedString()
        var i = html.startIndex
        while i < html.endIndex {
            if html[i] == "<" {
                guard let end = html[i...].firstIndex(of: ">") else { break }
                let tag = String(html[i...end])
                if let att = parseMention(tag) {
                    out.append(NSAttributedString(attachment: att))
                    // skip past the inner text + closing </span>
                    if let close = html.range(of: "</span>", range: html.index(after: end)..<html.endIndex) {
                        i = close.upperBound; continue
                    }
                } else if isBlockClose(tag) { out.append(NSAttributedString(string: "\n")) }
                i = html.index(after: end)
            } else {
                let next = html[i...].firstIndex(of: "<") ?? html.endIndex
                out.append(NSAttributedString(string: unescapeHTML(String(html[i..<next]))))
                i = next
            }
        }
        let trimmed = out.string.trimmingCharacters(in: .newlines)
        return NSAttributedString(string: trimmed) == out ? out : out
    }

    private static func parseMention(_ tag: String) -> MentionAttachment? {
        guard tag.range(of: #"class=["'][^"']*\bmention\b"#, options: .regularExpression) != nil else { return nil }
        guard let kindMatch = tag.range(of: #"data-kind=["'](note|card)["']"#, options: .regularExpression),
              let idMatch = tag.range(of: #"data-id=["']([0-9a-f-]{36})["']"#, options: .regularExpression)
        else { return nil }
        let kindStr = String(tag[kindMatch]).replacingOccurrences(of: #"data-kind=["']|["']"#, with: "", options: .regularExpression)
        let idStr = String(tag[idMatch]).replacingOccurrences(of: #"data-id=["']|["']"#, with: "", options: .regularExpression)
        guard let kind = EntityKind(rawValue: kindStr), let id = UUID(uuidString: idStr) else { return nil }
        return MentionAttachment(kind: kind, targetId: id, title: "…")
    }

    private static func isBlockClose(_ tag: String) -> Bool { tag.hasPrefix("</p") || tag.hasPrefix("</div") || tag == "<br>" || tag == "<br/>" }
    private static func escapeHTML(_ s: String) -> String {
        s.replacingOccurrences(of: "&", with: "&amp;").replacingOccurrences(of: "<", with: "&lt;").replacingOccurrences(of: ">", with: "&gt;")
    }
    private static func unescapeHTML(_ s: String) -> String {
        s.replacingOccurrences(of: "&amp;", with: "&").replacingOccurrences(of: "&lt;", with: "<").replacingOccurrences(of: "&gt;", with: ">").replacingOccurrences(of: "&nbsp;", with: " ")
    }
}
