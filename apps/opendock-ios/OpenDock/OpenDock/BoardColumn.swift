import Foundation

struct BoardColumn: Identifiable, Codable, Equatable {
    let id: UUID
    let boardId: UUID
    var title: String
    var position: Int
}
