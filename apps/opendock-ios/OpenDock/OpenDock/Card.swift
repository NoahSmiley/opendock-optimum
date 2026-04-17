import Foundation

struct Card: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var description: String
    var columnId: UUID
    var order: Int
    var updatedAt: Date
}
