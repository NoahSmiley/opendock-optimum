import Foundation

struct CreateNoteBody: Encodable { var title: String?; var content: String?; var pinned: Bool? }
struct UpdateNoteBody: Encodable { var title: String?; var content: String?; var pinned: Bool? }
struct AddNoteMemberBody: Encodable { let email: String; let role: String? }

enum NotesAPI {
    static func list() async throws -> [Note] { try await APIClient.shared.get("notes") }
    static func create(_ body: CreateNoteBody) async throws -> Note { try await APIClient.shared.post("notes", body: body) }
    static func update(_ id: UUID, _ body: UpdateNoteBody) async throws -> Note {
        try await APIClient.shared.patch("notes/\(id.uuidString.lowercased())", body: body)
    }
    static func delete(_ id: UUID) async throws {
        try await APIClient.shared.delete("notes/\(id.uuidString.lowercased())")
    }
    static func members(_ id: UUID) async throws -> [NoteMember] {
        try await APIClient.shared.get("notes/\(id.uuidString.lowercased())/members")
    }
    static func addMember(_ id: UUID, email: String, role: String = "editor") async throws {
        try await APIClient.shared.postVoid("notes/\(id.uuidString.lowercased())/members", body: AddNoteMemberBody(email: email, role: role))
    }
    static func removeMember(_ id: UUID, userId: UUID) async throws {
        try await APIClient.shared.delete("notes/\(id.uuidString.lowercased())/members/\(userId.uuidString.lowercased())")
    }
}

enum UsersAPI {
    static func search(_ query: String) async throws -> [UserSummary] {
        let enc = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return try await APIClient.shared.get("users/search?q=\(enc)")
    }
}

