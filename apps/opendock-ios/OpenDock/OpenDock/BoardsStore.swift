import Foundation

@MainActor
class BoardsStore: ObservableObject {
    @Published private(set) var boards: [Board] = [] { didSet { recompute() } }
    @Published private(set) var sortedBoards: [Board] = []
    @Published private(set) var cardsByColumn: [UUID: [Card]] = [:]
    @Published private(set) var cardById: [UUID: Card] = [:]
    @Published var selectedId: UUID?
    private let key = "opendock-boards"
    private var saveTask: Task<Void, Never>?

    init() {
        if let data = UserDefaults.standard.data(forKey: key),
           let decoded = try? JSONDecoder().decode([Board].self, from: data) { boards = decoded }
        if boards.isEmpty { boards = BoardsSeed.sample(); save() }
        selectedId = sortedBoards.first?.id
    }

    func board(_ id: UUID) -> Board? { boards.first { $0.id == id } }
    func createBoard(name: String) {
        let b = Board(id: UUID(), name: name, columns: BoardsSeed.defaultColumns(), cards: [])
        boards.insert(b, at: 0); selectedId = b.id; save()
    }
    func deleteBoard(_ id: UUID) { boards.removeAll { $0.id == id }; if selectedId == id { selectedId = nil }; save() }
    func renameBoard(_ id: UUID, name: String) { mutate(id) { $0.name = name } }
    func togglePin(_ id: UUID) { mutate(id) { $0.pinned.toggle() } }
    func deleteCard(boardId: UUID, cardId: UUID) { mutate(boardId) { $0.cards.removeAll { $0.id == cardId } } }

    func addCard(boardId: UUID, columnId: UUID, title: String) {
        mutate(boardId) { b in
            let order = b.cards.filter { $0.columnId == columnId }.count
            b.cards.append(Card(id: UUID(), title: title, description: "", columnId: columnId, order: order, updatedAt: Date()))
        }
    }

    func updateCard(boardId: UUID, cardId: UUID, title: String? = nil, description: String? = nil) {
        mutateCard(boardId: boardId, cardId: cardId) { c in
            if let t = title { c.title = t }
            if let d = description { c.description = d }
            c.updatedAt = Date()
        }
    }

    func moveCard(boardId: UUID, cardId: UUID, to columnId: UUID) {
        mutateCard(boardId: boardId, cardId: cardId, { c in
            guard c.columnId != columnId else { return }
            c.columnId = columnId; c.order = Int.max; c.updatedAt = Date()
        }) { b in
            let ordered = b.cards.filter { $0.columnId == columnId }.sorted { $0.order < $1.order }
            for (i, oc) in ordered.enumerated() { if let j = b.cards.firstIndex(where: { $0.id == oc.id }) { b.cards[j].order = i } }
        }
    }

    private func mutate(_ id: UUID, _ fn: (inout Board) -> Void) {
        guard let i = boards.firstIndex(where: { $0.id == id }) else { return }
        var b = boards[i]; fn(&b); boards[i] = b; save()
    }

    private func mutateCard(boardId: UUID, cardId: UUID, _ fn: (inout Card) -> Void, _ after: ((inout Board) -> Void)? = nil) {
        mutate(boardId) { b in
            guard let j = b.cards.firstIndex(where: { $0.id == cardId }) else { return }
            var c = b.cards[j]; fn(&c); b.cards[j] = c; after?(&b)
        }
    }

    private func recompute() {
        sortedBoards = boards.sorted { a, b in
            if a.pinned != b.pinned { return a.pinned && !b.pinned }
            return a.name.localizedCaseInsensitiveCompare(b.name) == .orderedAscending
        }
        var map: [UUID: [Card]] = [:]; var byId: [UUID: Card] = [:]
        for b in boards { for c in b.cards { map[c.columnId, default: []].append(c); byId[c.id] = c } }
        for k in map.keys { map[k]?.sort { $0.order < $1.order } }
        cardsByColumn = map; cardById = byId
    }

    private func save() {
        saveTask?.cancel()
        let snapshot = boards
        saveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 150_000_000)
            if Task.isCancelled { return }
            if let data = try? JSONEncoder().encode(snapshot) { UserDefaults.standard.set(data, forKey: key) }
        }
    }
}
