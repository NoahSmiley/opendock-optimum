import Foundation

struct CreateBoardBody: Encodable { let name: String }
struct UpdateBoardBody: Encodable { var name: String?; var pinned: Bool? }
struct CreateColumnBody: Encodable { let title: String }
struct UpdateColumnBody: Encodable {
    var title: String?
    var position: Int?
}
struct CreateCardBody: Encodable { let columnId: UUID; let title: String }
struct UpdateCardBody: Encodable {
    var title: String?
    var description: String?
    var columnId: UUID?
    var position: Int?
}
struct AssignCardBody: Encodable { let assigneeId: UUID? }
struct AddBoardMemberBody: Encodable { let email: String }

enum BoardsAPI {
    static func list() async throws -> [Board] { try await APIClient.shared.get("boards") }
    static func detail(_ id: UUID) async throws -> BoardDetail { try await APIClient.shared.get(path(id)) }
    static func create(_ name: String) async throws -> Board { try await APIClient.shared.post("boards", body: CreateBoardBody(name: name)) }
    static func update(_ id: UUID, _ body: UpdateBoardBody) async throws -> Board { try await APIClient.shared.patch(path(id), body: body) }
    static func delete(_ id: UUID) async throws { try await APIClient.shared.delete(path(id)) }

    static func createColumn(_ boardId: UUID, title: String) async throws -> BoardColumn {
        try await APIClient.shared.post("\(path(boardId))/columns", body: CreateColumnBody(title: title))
    }
    static func updateColumn(_ boardId: UUID, columnId: UUID, body: UpdateColumnBody) async throws -> BoardColumn {
        try await APIClient.shared.patch("\(path(boardId))/columns/\(columnId.uuidString.lowercased())", body: body)
    }
    static func deleteColumn(_ boardId: UUID, columnId: UUID) async throws {
        try await APIClient.shared.delete("\(path(boardId))/columns/\(columnId.uuidString.lowercased())")
    }
    static func createCard(_ boardId: UUID, columnId: UUID, title: String) async throws -> Card {
        try await APIClient.shared.post("\(path(boardId))/cards", body: CreateCardBody(columnId: columnId, title: title))
    }
    static func updateCard(_ boardId: UUID, cardId: UUID, body: UpdateCardBody) async throws -> Card {
        try await APIClient.shared.patch("\(path(boardId))/cards/\(cardId.uuidString.lowercased())", body: body)
    }
    static func assignCard(_ boardId: UUID, cardId: UUID, assigneeId: UUID?) async throws -> Card {
        try await APIClient.shared.patch("\(path(boardId))/cards/\(cardId.uuidString.lowercased())", body: AssignCardBody(assigneeId: assigneeId))
    }
    static func deleteCard(_ boardId: UUID, cardId: UUID) async throws {
        try await APIClient.shared.delete("\(path(boardId))/cards/\(cardId.uuidString.lowercased())")
    }

    static func members(_ boardId: UUID) async throws -> [BoardMember] {
        try await APIClient.shared.get("\(path(boardId))/members")
    }
    static func addMember(_ boardId: UUID, email: String) async throws {
        try await APIClient.shared.postVoid("\(path(boardId))/members", body: AddBoardMemberBody(email: email))
    }
    static func removeMember(_ boardId: UUID, userId: UUID) async throws {
        try await APIClient.shared.delete("\(path(boardId))/members/\(userId.uuidString.lowercased())")
    }

    private static func path(_ id: UUID) -> String { "boards/\(id.uuidString.lowercased())" }
}
