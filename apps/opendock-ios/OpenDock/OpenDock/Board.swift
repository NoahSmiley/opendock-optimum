import Foundation

struct Board: Identifiable, Codable, Equatable {
    let id: UUID
    let ownerId: UUID
    var name: String
    var pinned: Bool
    let createdAt: Date
    var updatedAt: Date
}

struct BoardDetail: Codable, Equatable {
    var board: Board
    var columns: [BoardColumn]
    var cards: [Card]
    var members: [UUID]
}
