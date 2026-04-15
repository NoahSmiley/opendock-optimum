import Foundation

struct Note: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var content: String
    var pinned: Bool
    var updatedAt: Date

    init(title: String = "Untitled", content: String = "", pinned: Bool = false) {
        self.id = UUID()
        self.title = title
        self.content = content
        self.pinned = pinned
        self.updatedAt = Date()
    }

    var wordCount: Int {
        content.split(separator: " ").count
    }

    var tags: [String] {
        let words = content.components(separatedBy: .whitespacesAndNewlines)
        return Array(Set(words.filter { $0.hasPrefix("#") && $0.count > 1 })).sorted()
    }

    var preview: String {
        let lines = content.components(separatedBy: "\n")
            .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty && !$0.hasPrefix("#") }
        return String(lines.first?.prefix(80) ?? "")
    }

    var timeAgo: String {
        let diff = Date().timeIntervalSince(updatedAt)
        if diff < 60 { return "now" }
        if diff < 3600 { return "\(Int(diff / 60))m" }
        if diff < 86400 { return "\(Int(diff / 3600))h" }
        return "\(Int(diff / 86400))d"
    }
}
