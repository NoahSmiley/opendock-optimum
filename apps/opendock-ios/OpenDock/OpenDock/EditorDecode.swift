import UIKit

/// Parse HTML (from the server or Tauri) into an NSAttributedString keyed
/// with editor block + inline attributes. One block element per line;
/// lines are joined with "\n".
enum EditorDecode {
    struct Marks { var bold = false, italic = false, underline = false, strike = false }
    enum Run { case text(String, Marks); case mention(EntityKind, UUID, String) }
    struct BlockHTML { let block: EditorBlock; let html: String; let checked: Bool }

    @MainActor static func decode(_ html: String) -> NSAttributedString {
        let m = NSMutableAttributedString()
        let blocks = parseBlocks(html)
        for (i, b) in blocks.enumerated() {
            let line = renderBlock(b)
            m.append(line)
            if i < blocks.count - 1 { m.append(NSAttributedString(string: "\n")) }
        }
        return m
    }

    @MainActor private static func renderBlock(_ b: BlockHTML) -> NSAttributedString {
        let line = NSMutableAttributedString()
        // Checklist lines get a leading tappable checkbox attachment.
        if b.block == .checklist {
            line.append(NSAttributedString(attachment: CheckboxAttachment(checked: b.checked)))
        }
        for run in parseInline(b.html) {
            switch run {
            case .text(let t, let marks):
                var a: [NSAttributedString.Key: Any] = [:]
                if marks.strike { a[.strikethroughStyle] = NSUnderlineStyle.single.rawValue }
                if marks.underline { a[.underlineStyle] = NSUnderlineStyle.single.rawValue }
                a[.font] = b.block.font(bold: marks.bold, italic: marks.italic)
                a[.foregroundColor] = UIColor(Theme.text)
                line.append(NSAttributedString(string: t, attributes: a))
            case .mention(let k, let id, let title):
                line.append(NSAttributedString(attachment: MentionAttachment(kind: k, targetId: id, title: title)))
            }
        }
        if line.length > 0 {
            line.addAttribute(EditorAttr.block, value: b.block.rawValue, range: NSRange(location: 0, length: line.length))
            if b.block == .checklist && b.checked {
                line.addAttribute(EditorAttr.checked, value: true, range: NSRange(location: 0, length: line.length))
            }
        }
        return line
    }

    private static func parseBlocks(_ html: String) -> [BlockHTML] {
        var out: [BlockHTML] = []
        guard let re = try? NSRegularExpression(
            pattern: #"<(h1|h2|h3|p|ul|ol)\b[^>]*>(.*?)</\1>"#,
            options: [.dotMatchesLineSeparators, .caseInsensitive]) else { return [BlockHTML(block: .p, html: html, checked: false)] }
        let ns = html as NSString
        re.enumerateMatches(in: html, options: [], range: NSRange(location: 0, length: ns.length)) { m, _, _ in
            guard let m,
                  let tagR = Range(m.range(at: 1), in: html),
                  let innerR = Range(m.range(at: 2), in: html),
                  let fullR = Range(m.range, in: html) else { return }
            let tag = html[tagR].lowercased()
            let inner = String(html[innerR])
            let outer = String(html[fullR])
            switch tag {
            case "h1": out.append(BlockHTML(block: .h1, html: inner, checked: false))
            case "h2": out.append(BlockHTML(block: .h2, html: inner, checked: false))
            case "h3": out.append(BlockHTML(block: .h3, html: inner, checked: false))
            case "p": out.append(BlockHTML(block: .p, html: inner, checked: false))
            case "ul" where outer.contains("checklist"):
                let checked = outer.contains("check-box checked")
                let text = innerText(outer, cls: "check-text")
                out.append(BlockHTML(block: .checklist, html: text, checked: checked))
            case "ul":
                for li in lis(inner) { out.append(BlockHTML(block: .ul, html: li, checked: false)) }
            case "ol":
                for li in lis(inner) { out.append(BlockHTML(block: .ol, html: li, checked: false)) }
            default: break
            }
        }
        return out.isEmpty ? [BlockHTML(block: .p, html: html, checked: false)] : out
    }

    private static func lis(_ html: String) -> [String] {
        guard let re = try? NSRegularExpression(
            pattern: #"<li\b[^>]*>(.*?)</li>"#,
            options: [.dotMatchesLineSeparators, .caseInsensitive]) else { return [] }
        let ns = html as NSString
        var out: [String] = []
        re.enumerateMatches(in: html, options: [], range: NSRange(location: 0, length: ns.length)) { m, _, _ in
            if let m, let r = Range(m.range(at: 1), in: html) { out.append(String(html[r])) }
        }
        return out
    }

    private static func innerText(_ html: String, cls: String) -> String {
        let pat = "<span\\s+class=\"[^\"]*\\b\(cls)\\b[^\"]*\"[^>]*>(.*?)</span>"
        guard let re = try? NSRegularExpression(pattern: pat, options: [.dotMatchesLineSeparators, .caseInsensitive]),
              let m = re.firstMatch(in: html, options: [], range: NSRange(location: 0, length: (html as NSString).length)),
              let r = Range(m.range(at: 1), in: html) else { return "" }
        return String(html[r])
    }

    private static func parseInline(_ html: String) -> [Run] {
        var out: [Run] = []; var i = html.startIndex; var marks = Marks()
        while i < html.endIndex {
            if html[i] == "<" {
                guard let end = html[i...].firstIndex(of: ">") else { break }
                let tag = String(html[i...end]).lowercased()
                if tag.contains("class=\"mention") || tag.contains("class='mention") || tag.contains(" mention") {
                    if let a = parseMention(tag), let close = html.range(of: "</span>", range: html.index(after: end)..<html.endIndex) {
                        out.append(.mention(a.kind, a.targetId, a.title)); i = close.upperBound; continue
                    }
                }
                switch tag {
                case "<b>", "<strong>": marks.bold = true
                case "</b>", "</strong>": marks.bold = false
                case "<i>", "<em>": marks.italic = true
                case "</i>", "</em>": marks.italic = false
                case "<u>": marks.underline = true
                case "</u>": marks.underline = false
                case "<s>", "<strike>": marks.strike = true
                case "</s>", "</strike>": marks.strike = false
                default: break
                }
                i = html.index(after: end)
            } else {
                let next = html[i...].firstIndex(of: "<") ?? html.endIndex
                let chunk = unescape(String(html[i..<next]))
                if !chunk.isEmpty { out.append(.text(chunk, marks)) }
                i = next
            }
        }
        return out
    }

    private static func parseMention(_ tag: String) -> MentionAttachment? {
        guard let kM = tag.range(of: #"data-kind=["'](note|card)["']"#, options: .regularExpression),
              let iM = tag.range(of: #"data-id=["']([0-9a-f-]{36})["']"#, options: .regularExpression) else { return nil }
        let k = String(tag[kM]).replacingOccurrences(of: #"data-kind=["']|["']"#, with: "", options: .regularExpression)
        let i = String(tag[iM]).replacingOccurrences(of: #"data-id=["']|["']"#, with: "", options: .regularExpression)
        guard let kind = EntityKind(rawValue: k), let id = UUID(uuidString: i) else { return nil }
        return MentionAttachment(kind: kind, targetId: id, title: "…")
    }

    private static func unescape(_ s: String) -> String {
        s.replacingOccurrences(of: "&amp;", with: "&")
            .replacingOccurrences(of: "&lt;", with: "<")
            .replacingOccurrences(of: "&gt;", with: ">")
            .replacingOccurrences(of: "&nbsp;", with: " ")
    }
}
