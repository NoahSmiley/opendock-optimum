import Foundation

struct Card: Identifiable, Codable, Equatable {
    let id: UUID
    let boardId: UUID
    var columnId: UUID
    var title: String
    var description: String
    var position: Int
    var assigneeId: UUID?
    var updatedAt: Date
}
