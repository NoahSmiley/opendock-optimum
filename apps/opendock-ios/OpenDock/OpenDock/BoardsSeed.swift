import Foundation

enum BoardsSeed {
    static func defaultColumns() -> [BoardColumn] {
        ["To Do", "In Progress", "Done"].enumerated().map { BoardColumn(id: UUID(), title: $1, order: $0) }
    }

    static func sample() -> [Board] {
        let cols = defaultColumns()
        let cards: [Card] = [
            Card(id: UUID(), title: "Design system review", description: "", columnId: cols[0].id, order: 0, updatedAt: Date()),
            Card(id: UUID(), title: "Set up CI pipeline", description: "", columnId: cols[0].id, order: 1, updatedAt: Date()),
            Card(id: UUID(), title: "Build notes feature", description: "", columnId: cols[1].id, order: 0, updatedAt: Date()),
            Card(id: UUID(), title: "Ship v0.1", description: "", columnId: cols[2].id, order: 0, updatedAt: Date()),
        ]
        return [Board(id: UUID(), name: "Project Alpha", columns: cols, cards: cards)]
    }
}
