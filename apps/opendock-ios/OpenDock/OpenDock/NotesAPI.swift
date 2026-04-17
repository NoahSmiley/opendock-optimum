import Foundation

struct CreateNoteBody: Encodable {
    var title: String?
    var content: String?
    var pinned: Bool?
}

struct UpdateNoteBody: Encodable {
    var title: String?
    var content: String?
    var pinned: Bool?
}

enum NotesAPI {
    static func list() async throws -> [Note] { try await APIClient.shared.get("notes") }
    static func create(_ body: CreateNoteBody) async throws -> Note { try await APIClient.shared.post("notes", body: body) }
    static func update(_ id: UUID, _ body: UpdateNoteBody) async throws -> Note {
        try await APIClient.shared.patch("notes/\(id.uuidString.lowercased())", body: body)
    }
    static func delete(_ id: UUID) async throws {
        try await APIClient.shared.delete("notes/\(id.uuidString.lowercased())")
    }
}
