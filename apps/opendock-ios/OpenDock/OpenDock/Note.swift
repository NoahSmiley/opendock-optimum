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
}
