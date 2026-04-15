import Foundation

struct Note: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var content: String
    var pinned: Bool
    var updatedAt: Date

    init(title: String = "Untitled", content: String = "", pinned: Bool = false) {
        self.id = UUID(); self.title = title; self.content = content; self.pinned = pinned; self.updatedAt = Date()
    }

    var wordCount: Int { content.split(separator: " ").count }

    var tags: [String] {
        Array(Set(content.components(separatedBy: .whitespacesAndNewlines).filter { $0.hasPrefix("#") && $0.count > 1 })).sorted()
    }

    var preview: String {
        String(content.components(separatedBy: "\n").filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty && !$0.hasPrefix("#") }.first?.prefix(80) ?? "")
    }

    var timeAgo: String {
        let d = Date().timeIntervalSince(updatedAt)
        if d < 60 { return "now" }
        if d < 3600 { return "\(Int(d / 60))m" }
        if d < 86400 { return "\(Int(d / 3600))h" }
        return "\(Int(d / 86400))d"
    }
}
