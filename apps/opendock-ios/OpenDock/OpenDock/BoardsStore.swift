import Foundation

@MainActor
class BoardsStore: ObservableObject {
    @Published private(set) var boards: [Board] = []
    @Published internal(set) var detail: BoardDetail?
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

    func addColumn(boardId: UUID, title: String) async {
        do {
            let c = try await BoardsAPI.createColumn(boardId, title: title)
            if detail?.board.id == boardId { detail?.columns.append(c) }
        } catch { self.error = "\(error)" }
    }

    func addBoardMember(_ boardId: UUID, email: String) async -> Bool {
        do { try await BoardsAPI.addMember(boardId, email: email); await loadDetail(boardId); return true }
        catch { self.error = "\(error)"; return false }
    }

    func removeBoardMember(_ boardId: UUID, userId: UUID) async {
        do { try await BoardsAPI.removeMember(boardId, userId: userId); await loadDetail(boardId) }
        catch { self.error = "\(error)" }
    }

    func reset() { boards = []; detail = nil; selectedId = nil; error = nil }

    func apply(event: LiveEvent) {
        switch event {
        case .boardShareAdded, .boardShareRemoved:
            Task { await self.loadBoards() }
        case .cardUpserted(let bid, _, let card) where detail?.board.id == bid:
            if let i = detail?.cards.firstIndex(where: { $0.id == card.id }) { detail?.cards[i] = card }
            else { detail?.cards.append(card) }
        case .cardDeleted(let bid, let cid, _) where detail?.board.id == bid:
            detail?.cards.removeAll { $0.id == cid }
        default: break
        }
    }
}
