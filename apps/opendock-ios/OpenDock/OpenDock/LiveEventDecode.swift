import Foundation

extension LiveEvent {
    static func decode(from data: Data) throws -> LiveEvent {
        let decoder = JSONDecoder.live()
        let env = try decoder.decode(Envelope.self, from: data)
        switch env.kind {
        case "note_updated":
            let p = try decoder.decode(NoteUpdatedPayload.self, from: data)
            return .noteUpdated(noteId: p.noteId, actorId: p.actorId, patch: p.patch)
        case "note_deleted":
            let p = try decoder.decode(NoteIdActor.self, from: data)
            return .noteDeleted(noteId: p.noteId, actorId: p.actorId)
        case "note_members_changed":
            let p = try decoder.decode(NoteIdActor.self, from: data)
            return .noteMembersChanged(noteId: p.noteId, actorId: p.actorId)
        case "note_share_added":
            let p = try decoder.decode(NoteIdActor.self, from: data)
            return .noteShareAdded(noteId: p.noteId, actorId: p.actorId)
        case "note_share_removed":
            let p = try decoder.decode(NoteIdActor.self, from: data)
            return .noteShareRemoved(noteId: p.noteId, actorId: p.actorId)
        case "card_upserted":
            let p = try decoder.decode(CardUpsertedPayload.self, from: data)
            return .cardUpserted(boardId: p.boardId, actorId: p.actorId, card: p.card)
        case "card_deleted":
            let p = try decoder.decode(CardDeletedPayload.self, from: data)
            return .cardDeleted(boardId: p.boardId, cardId: p.cardId, actorId: p.actorId)
        case "board_updated":
            let p = try decoder.decode(BoardIdActor.self, from: data)
            return .boardUpdated(boardId: p.boardId, actorId: p.actorId, patch: data)
        case "board_deleted":
            let p = try decoder.decode(BoardIdActor.self, from: data)
            return .boardDeleted(boardId: p.boardId, actorId: p.actorId)
        case "board_members_changed":
            let p = try decoder.decode(BoardIdActor.self, from: data)
            return .boardMembersChanged(boardId: p.boardId, actorId: p.actorId)
        case "board_share_added":
            let p = try decoder.decode(BoardIdActor.self, from: data)
            return .boardShareAdded(boardId: p.boardId, actorId: p.actorId)
        case "board_share_removed":
            let p = try decoder.decode(BoardIdActor.self, from: data)
            return .boardShareRemoved(boardId: p.boardId, actorId: p.actorId)
        case "entity_link_changed":
            let p = try decoder.decode(EntityLinkPayload.self, from: data)
            let a = EntityRef(kind: EntityKind(rawValue: p.aKind) ?? .note, id: p.aId)
            let b = EntityRef(kind: EntityKind(rawValue: p.bKind) ?? .note, id: p.bId)
            return .entityLinkChanged(a: a, b: b, added: p.added, actorId: p.actorId)
        default:
            throw DecodingError.dataCorrupted(.init(codingPath: [], debugDescription: "unknown kind: \(env.kind)"))
        }
    }

    private struct Envelope: Decodable { let kind: String }
    private struct NoteUpdatedPayload: Decodable { let noteId: UUID; let actorId: UUID; let patch: Note }
    private struct NoteIdActor: Decodable { let noteId: UUID; let actorId: UUID }
    private struct CardUpsertedPayload: Decodable { let boardId: UUID; let actorId: UUID; let card: Card }
    private struct CardDeletedPayload: Decodable { let boardId: UUID; let cardId: UUID; let actorId: UUID }
    private struct BoardIdActor: Decodable { let boardId: UUID; let actorId: UUID }
    private struct EntityLinkPayload: Decodable {
        let aKind: String; let aId: UUID
        let bKind: String; let bId: UUID
        let added: Bool; let actorId: UUID
    }
}

extension JSONDecoder {
    static func live() -> JSONDecoder {
        let d = JSONDecoder(); d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .custom { decoder in
            let s = try decoder.singleValueContainer().decode(String.self)
            if let date = ISO8601DateFormatter.opendock().date(from: s) { return date }
            throw DecodingError.dataCorruptedError(in: try decoder.singleValueContainer(), debugDescription: "bad date \(s)")
        }
        return d
    }
}
