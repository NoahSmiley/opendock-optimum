import Foundation

struct Board: Identifiable, Codable, Equatable {
    let id: UUID
    var name: String
    var columns: [BoardColumn]
    var cards: [Card]
    var pinned: Bool = false
}
