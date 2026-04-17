import Foundation

enum NoteFormat {
    static func wordCount(_ content: String) -> Int { content.split(separator: " ").count }

    static func tags(_ content: String) -> [String] {
        Array(Set(content.components(separatedBy: .whitespacesAndNewlines).filter { $0.hasPrefix("#") && $0.count > 1 })).sorted()
    }

    static func preview(_ content: String) -> String {
        String(content.components(separatedBy: "\n").filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty && !$0.hasPrefix("#") }.first?.prefix(80) ?? "")
    }

    static func timeAgo(_ date: Date) -> String {
        let d = Date().timeIntervalSince(date)
        if d < 60 { return "now" }
        if d < 3600 { return "\(Int(d / 60))m" }
        if d < 86400 { return "\(Int(d / 3600))h" }
        return "\(Int(d / 86400))d"
    }
}
