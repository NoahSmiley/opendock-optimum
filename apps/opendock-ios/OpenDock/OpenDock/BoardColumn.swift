import Foundation

struct BoardColumn: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var order: Int
}
