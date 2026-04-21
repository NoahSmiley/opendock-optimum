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

    func renameColumn(boardId: UUID, columnId: UUID, title: String) async {
        do {
            let fresh = try await BoardsAPI.updateColumn(boardId, columnId: columnId, body: UpdateColumnBody(title: title, position: nil))
            if detail?.board.id == boardId, let i = detail?.columns.firstIndex(where: { $0.id == columnId }) {
                detail?.columns[i] = fresh
            }
        } catch { self.error = "\(error)" }
    }

    func deleteColumn(boardId: UUID, columnId: UUID) async {
        do {
            try await BoardsAPI.deleteColumn(boardId, columnId: columnId)
            if detail?.board.id == boardId {
                detail?.columns.removeAll { $0.id == columnId }
                detail?.cards.removeAll { $0.columnId == columnId }
            }
        } catch { self.error = "\(error)" }
    }

    func reorderColumn(boardId: UUID, columnId: UUID, toPosition: Int) async {
        guard var d = detail, d.board.id == boardId else { return }
        guard let col = d.columns.first(where: { $0.id == columnId }) else { return }
        let snapshot = d
        var siblings = d.columns.filter { $0.id != columnId }.sorted { $0.position < $1.position }
        let clamped = max(0, min(toPosition, siblings.count))
        siblings.insert(col, at: clamped)
        for (i, var c) in siblings.enumerated() { c.position = i; siblings[i] = c }
        d.columns = siblings
        detail = d
        do { _ = try await BoardsAPI.updateColumn(boardId, columnId: columnId, body: UpdateColumnBody(title: nil, position: clamped)) }
        catch { detail = snapshot; self.error = "\(error)" }
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
        case .boardUpdated(let bid, _, let patch) where detail?.board.id == bid:
            applyBoardPatch(patch)
        default: break
        }
    }

    private func applyBoardPatch(_ data: Data) {
        struct Envelope: Decodable { let patch: Patch }
        struct Patch: Decodable { let column: BoardColumn?; let removedColumnId: UUID? }
        guard let env = try? JSONDecoder.live().decode(Envelope.self, from: data) else { return }
        if let col = env.patch.column {
            if let i = detail?.columns.firstIndex(where: { $0.id == col.id }) { detail?.columns[i] = col }
            else { detail?.columns.append(col) }
        }
        if let removedId = env.patch.removedColumnId {
            detail?.columns.removeAll { $0.id == removedId }
            detail?.cards.removeAll { $0.columnId == removedId }
        }
    }
}
