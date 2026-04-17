import Foundation

struct Board: Identifiable, Codable, Equatable {
    let id: UUID
    let ownerId: UUID
    var name: String
    var pinned: Bool
    let createdAt: Date
    var updatedAt: Date
}

struct BoardMember: Identifiable, Codable, Equatable, Hashable {
    var id: UUID { userId }
    let userId: UUID
    let email: String
    let displayName: String?
    let role: String
}

struct BoardDetail: Codable, Equatable {
    var board: Board
    var columns: [BoardColumn]
    var cards: [Card]
    var members: [BoardMember]
}
