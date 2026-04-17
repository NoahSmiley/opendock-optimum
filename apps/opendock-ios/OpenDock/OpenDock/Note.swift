import Foundation

struct Note: Identifiable, Codable, Equatable {
    let id: UUID
    let ownerId: UUID
    var title: String
    var content: String
    var pinned: Bool
    var sharedWith: [UUID]
    let createdAt: Date
    var updatedAt: Date
}
