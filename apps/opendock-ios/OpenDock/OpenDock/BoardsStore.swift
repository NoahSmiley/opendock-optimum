import Foundation

struct Card: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var description: String
    var columnId: UUID
    var order: Int
    var updatedAt: Date
}

struct BoardColumn: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var order: Int
}

struct Board: Identifiable, Codable, Equatable {
    let id: UUID
    var name: String
    var columns: [BoardColumn]
    var cards: [Card]

    func cardsIn(_ columnId: UUID) -> [Card] {
        cards.filter { $0.columnId == columnId }.sorted { $0.order < $1.order }
    }
}

@MainActor
class BoardsStore: ObservableObject {
    @Published var boards: [Board] = []
    @Published var selectedId: UUID?
    private let key = "opendock-boards"

    init() {
        if let data = UserDefaults.standard.data(forKey: key),
           let decoded = try? JSONDecoder().decode([Board].self, from: data) { boards = decoded }
        if boards.isEmpty { seedSample() }
    }

    private func seedSample() {
        let cols = ["To Do", "In Progress", "Done"].enumerated().map { BoardColumn(id: UUID(), title: $1, order: $0) }
        var b = Board(id: UUID(), name: "Project Alpha", columns: cols, cards: [])
        b.cards = [
            Card(id: UUID(), title: "Design system review", description: "", columnId: cols[0].id, order: 0, updatedAt: Date()),
            Card(id: UUID(), title: "Set up CI pipeline", description: "", columnId: cols[0].id, order: 1, updatedAt: Date()),
            Card(id: UUID(), title: "Build notes feature", description: "", columnId: cols[1].id, order: 0, updatedAt: Date()),
            Card(id: UUID(), title: "Ship v0.1", description: "", columnId: cols[2].id, order: 0, updatedAt: Date()),
        ]
        boards = [b]; save()
    }

    var selected: Board? { boards.first { $0.id == selectedId } }

    func createBoard(name: String) {
        let cols = ["To Do", "In Progress", "Done"].enumerated().map { BoardColumn(id: UUID(), title: $1, order: $0) }
        let b = Board(id: UUID(), name: name, columns: cols, cards: []); boards.insert(b, at: 0); selectedId = b.id; save()
    }

    func deleteBoard(_ id: UUID) { boards.removeAll { $0.id == id }; if selectedId == id { selectedId = nil }; save() }

    func addCard(boardId: UUID, columnId: UUID, title: String) {
        guard let i = boards.firstIndex(where: { $0.id == boardId }) else { return }
        let order = boards[i].cardsIn(columnId).count
        boards[i].cards.append(Card(id: UUID(), title: title, description: "", columnId: columnId, order: order, updatedAt: Date())); save()
    }

    func moveCard(boardId: UUID, cardId: UUID, to columnId: UUID) {
        guard let i = boards.firstIndex(where: { $0.id == boardId }),
              let j = boards[i].cards.firstIndex(where: { $0.id == cardId }) else { return }
        boards[i].cards[j].columnId = columnId; boards[i].cards[j].updatedAt = Date(); save()
    }

    func deleteCard(boardId: UUID, cardId: UUID) {
        guard let i = boards.firstIndex(where: { $0.id == boardId }) else { return }
        boards[i].cards.removeAll { $0.id == cardId }; save()
    }

    private func save() { if let data = try? JSONEncoder().encode(boards) { UserDefaults.standard.set(data, forKey: key) } }
}
