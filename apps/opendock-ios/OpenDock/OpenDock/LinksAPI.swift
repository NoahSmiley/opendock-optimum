import Foundation

enum EntityKind: String, Codable { case note, card }

struct EntityRef: Codable, Hashable {
    let kind: EntityKind
    let id: UUID
    enum CodingKeys: String, CodingKey { case kind, id }
}

struct LinkedEntity: Decodable, Identifiable {
    let linkId: UUID
    let kind: EntityKind
    let id: UUID
    let title: String
    let context: String?
    let source: String
}

struct CreateLinkBody: Encodable {
    let a: EntityRef
    let b: EntityRef
    let source: String
}

enum LinksAPI {
    static func list(_ kind: EntityKind, _ id: UUID) async throws -> [LinkedEntity] {
        try await APIClient.shared.get("links?kind=\(kind.rawValue)&id=\(id.uuidString.lowercased())")
    }

    static func attach(_ a: EntityRef, _ b: EntityRef) async throws {
        try await APIClient.shared.postVoid("links", body: CreateLinkBody(a: a, b: b, source: "manual"))
    }

    static func detach(_ a: EntityRef, _ b: EntityRef) async throws {
        try await APIClient.shared.delete("links?a_kind=\(a.kind.rawValue)&a_id=\(a.id.uuidString.lowercased())&b_kind=\(b.kind.rawValue)&b_id=\(b.id.uuidString.lowercased())")
    }
}
