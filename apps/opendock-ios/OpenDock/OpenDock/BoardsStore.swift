import Foundation

@MainActor
class BoardsStore: ObservableObject {
    @Published private(set) var boards: [Board] = []
    @Published private(set) var detail: BoardDetail?
    @Published var selectedId: UUID?
    @Published private(set) var loading = false
    @Published var error: String?

    var cardsByColumn: [UUID: [Card]] {
        guard let d = detail else { return [:] }
        var map: [UUID: [Card]] = [:]
        for c in d.cards { map[c.columnId, default: []].append(c) }
        for k in map.keys { map[k]?.sort { $0.position < $1.position } }
        return map
    }

    func board(_ id: UUID) -> Board? { detail?.board.id == id ? detail?.board : boards.first { $0.id == id } }
    func columns(_ id: UUID) -> [BoardColumn] { detail?.board.id == id ? (detail?.columns ?? []) : [] }

    func loadBoards() async {
        loading = true
        do { boards = try await BoardsAPI.list() } catch { self.error = "\(error)" }
        loading = false
    }

    func loadDetail(_ id: UUID) async {
        do { detail = try await BoardsAPI.detail(id); selectedId = id } catch { self.error = "\(error)" }
    }

    func createBoard(name: String) async {
        do {
            let b = try await BoardsAPI.create(name); boards.insert(b, at: 0); selectedId = b.id
            await loadDetail(b.id)
        } catch { self.error = "\(error)" }
    }

    func deleteBoard(_ id: UUID) async {
        do {
            try await BoardsAPI.delete(id); boards.removeAll { $0.id == id }
            if detail?.board.id == id { detail = nil; selectedId = nil }
        } catch { self.error = "\(error)" }
    }

    func togglePin(_ id: UUID) async {
        guard let b = boards.first(where: { $0.id == id }) ?? (detail?.board.id == id ? detail?.board : nil) else { return }
        do {
            let fresh = try await BoardsAPI.update(id, UpdateBoardBody(name: nil, pinned: !b.pinned))
            if let i = boards.firstIndex(where: { $0.id == id }) { boards[i] = fresh }
            if detail?.board.id == id { detail?.board = fresh }
        } catch { self.error = "\(error)" }
    }

    func renameBoard(_ id: UUID, name: String) async {
        do {
            let fresh = try await BoardsAPI.update(id, UpdateBoardBody(name: name, pinned: nil))
            if let i = boards.firstIndex(where: { $0.id == id }) { boards[i] = fresh }
            if detail?.board.id == id { detail?.board = fresh }
        } catch { self.error = "\(error)" }
    }

    func addCard(boardId: UUID, columnId: UUID, title: String) async {
        do {
            let c = try await BoardsAPI.createCard(boardId, columnId: columnId, title: title)
            detail?.cards.append(c)
        } catch { self.error = "\(error)" }
    }

    func updateCard(boardId: UUID, cardId: UUID, title: String? = nil, description: String? = nil) async {
        do {
            let body = UpdateCardBody(title: title, description: description, columnId: nil, position: nil, assigneeId: nil)
            let fresh = try await BoardsAPI.updateCard(boardId, cardId: cardId, body: body)
            if let i = detail?.cards.firstIndex(where: { $0.id == cardId }) { detail?.cards[i] = fresh }
        } catch { self.error = "\(error)" }
    }

    func moveCard(boardId: UUID, cardId: UUID, to columnId: UUID) async {
        do {
            let body = UpdateCardBody(title: nil, description: nil, columnId: columnId, position: nil, assigneeId: nil)
            let fresh = try await BoardsAPI.updateCard(boardId, cardId: cardId, body: body)
            if let i = detail?.cards.firstIndex(where: { $0.id == cardId }) { detail?.cards[i] = fresh }
        } catch { self.error = "\(error)" }
    }

    func deleteCard(boardId: UUID, cardId: UUID) async {
        do { try await BoardsAPI.deleteCard(boardId, cardId: cardId); detail?.cards.removeAll { $0.id == cardId } }
        catch { self.error = "\(error)" }
    }

    func reset() { boards = []; detail = nil; selectedId = nil; error = nil }
}
