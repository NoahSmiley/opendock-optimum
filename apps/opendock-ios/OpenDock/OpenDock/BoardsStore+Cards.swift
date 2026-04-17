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

    func moveCard(boardId: UUID, cardId: UUID, to columnId: UUID) async {
        do {
            let body = UpdateCardBody(title: nil, description: nil, columnId: columnId, position: nil)
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
