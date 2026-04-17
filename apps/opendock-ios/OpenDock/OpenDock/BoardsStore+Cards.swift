import Foundation

extension BoardsStore {
    func addCard(boardId: UUID, columnId: UUID, title: String) async {
        do {
            let c = try await BoardsAPI.createCard(boardId, columnId: columnId, title: title)
            detail?.cards.append(c)
        } catch { self.error = "\(error)" }
    }

    func updateCard(boardId: UUID, cardId: UUID, title: String? = nil, description: String? = nil) async {
        do {
            let body = UpdateCardBody(title: title, description: description, columnId: nil, position: nil)
            let fresh = try await BoardsAPI.updateCard(boardId, cardId: cardId, body: body)
            if let i = detail?.cards.firstIndex(where: { $0.id == cardId }) { detail?.cards[i] = fresh }
        } catch { self.error = "\(error)" }
    }

    func applyReorderLocally(cardId: UUID, to columnId: UUID, before beforeId: UUID?) -> Int? {
        guard let d = detail, let card = d.cards.first(where: { $0.id == cardId }) else { return nil }
        let siblings = d.cards.filter { $0.columnId == columnId && $0.id != cardId }.sorted { $0.position < $1.position }
        let idx = beforeId.flatMap { id in siblings.firstIndex { $0.id == id } }
        let position = idx ?? siblings.count
        if card.columnId == columnId && card.position == position { return nil }
        if let i = detail?.cards.firstIndex(where: { $0.id == cardId }) {
            detail?.cards[i].columnId = columnId; detail?.cards[i].position = position
        }
        return position
    }

    func reorderCard(boardId: UUID, cardId: UUID, to columnId: UUID, before beforeId: UUID?) async {
        guard let position = applyReorderLocally(cardId: cardId, to: columnId, before: beforeId) else { return }
        do {
            let body = UpdateCardBody(title: nil, description: nil, columnId: columnId, position: position)
            let fresh = try await BoardsAPI.updateCard(boardId, cardId: cardId, body: body)
            if let i = detail?.cards.firstIndex(where: { $0.id == cardId }) { detail?.cards[i] = fresh }
        } catch { self.error = "\(error)" }
    }

    func assignCard(boardId: UUID, cardId: UUID, to userId: UUID?) async {
        do {
            let fresh = try await BoardsAPI.assignCard(boardId, cardId: cardId, assigneeId: userId)
            if let i = detail?.cards.firstIndex(where: { $0.id == cardId }) { detail?.cards[i] = fresh }
        } catch { self.error = "\(error)" }
    }

    func deleteCard(boardId: UUID, cardId: UUID) async {
        do { try await BoardsAPI.deleteCard(boardId, cardId: cardId); detail?.cards.removeAll { $0.id == cardId } }
        catch { self.error = "\(error)" }
    }
}
