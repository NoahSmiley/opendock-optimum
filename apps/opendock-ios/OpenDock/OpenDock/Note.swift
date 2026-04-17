import Foundation

struct Note: Identifiable, Codable, Equatable {
    let id: UUID
    let ownerId: UUID
    var title: String
    var content: String
    var pinned: Bool
    let createdAt: Date
    var updatedAt: Date
}

struct NoteMember: Identifiable, Codable, Equatable, Hashable {
    var id: UUID { userId }
    let userId: UUID
    let email: String
    let displayName: String?
    let role: String
}

struct UserSummary: Identifiable, Codable, Equatable, Hashable {
    let id: UUID
    let email: String
    let displayName: String?
    let avatarUrl: String?
}
