import Foundation

enum NoteFormat {
    static func wordCount(_ content: String) -> Int { plainText(content).split(separator: " ").count }

    static func tags(_ content: String) -> [String] {
        Array(Set(plainText(content).components(separatedBy: .whitespacesAndNewlines).filter { $0.hasPrefix("#") && $0.count > 1 })).sorted()
    }

    /// Strip HTML tags and decode basic entities so note previews don't
    /// render as raw `<p>…</p>` markup. Note content is HTML on the wire;
    /// the preview column just wants the first line of human text.
    static func preview(_ content: String) -> String {
        let lines = plainText(content)
            .components(separatedBy: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty && !$0.hasPrefix("#") }
        return String((lines.first ?? "").prefix(80))
    }

    /// Replace block-level closing tags with newlines so we keep paragraph
    /// breaks, then strip the rest and decode common HTML entities.
    private static func plainText(_ html: String) -> String {
        var s = html
        for tag in ["</p>", "</h1>", "</h2>", "</h3>", "</li>", "<br>", "<br/>", "<br />"] {
            s = s.replacingOccurrences(of: tag, with: "\n", options: .caseInsensitive)
        }
        s = s.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
        s = s.replacingOccurrences(of: "&nbsp;", with: " ")
            .replacingOccurrences(of: "&amp;", with: "&")
            .replacingOccurrences(of: "&lt;", with: "<")
            .replacingOccurrences(of: "&gt;", with: ">")
            .replacingOccurrences(of: "&quot;", with: "\"")
            .replacingOccurrences(of: "&#39;", with: "'")
        return s
    }

    static func timeAgo(_ date: Date) -> String {
        let d = Date().timeIntervalSince(date)
        if d < 60 { return "now" }
        if d < 3600 { return "\(Int(d / 60))m" }
        if d < 86400 { return "\(Int(d / 3600))h" }
        return "\(Int(d / 86400))d"
    }
}
