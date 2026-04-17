import Foundation

enum LiveEvent {
    case noteUpdated(noteId: UUID, actorId: UUID, patch: Note)
    case noteDeleted(noteId: UUID, actorId: UUID)
    case noteMembersChanged(noteId: UUID, actorId: UUID)
    case boardUpdated(boardId: UUID, actorId: UUID, patch: Data)
    case boardDeleted(boardId: UUID, actorId: UUID)
    case boardMembersChanged(boardId: UUID, actorId: UUID)
    case cardUpserted(boardId: UUID, actorId: UUID, card: Card)
    case cardDeleted(boardId: UUID, cardId: UUID, actorId: UUID)

    static func decode(from data: Data) throws -> LiveEvent {
        let env = try JSONDecoder.live().decode(Envelope.self, from: data)
        switch env.kind {
        case "note_updated":
            let p = try JSONDecoder.live().decode(NoteUpdatedPayload.self, from: data)
            return .noteUpdated(noteId: p.noteId, actorId: p.actorId, patch: p.patch)
        case "note_deleted":
            let p = try JSONDecoder.live().decode(IdActor.self, from: data)
            return .noteDeleted(noteId: p.noteId ?? UUID(), actorId: p.actorId)
        case "note_members_changed":
            let p = try JSONDecoder.live().decode(IdActor.self, from: data)
            return .noteMembersChanged(noteId: p.noteId ?? UUID(), actorId: p.actorId)
        case "card_upserted":
            let p = try JSONDecoder.live().decode(CardUpsertedPayload.self, from: data)
            return .cardUpserted(boardId: p.boardId, actorId: p.actorId, card: p.card)
        case "card_deleted":
            let p = try JSONDecoder.live().decode(CardDeletedPayload.self, from: data)
            return .cardDeleted(boardId: p.boardId ?? UUID(), cardId: p.cardId, actorId: p.actorId)
        case "board_updated":
            let p = try JSONDecoder.live().decode(BoardIdActorRaw.self, from: data)
            return .boardUpdated(boardId: p.boardId, actorId: p.actorId, patch: data)
        case "board_deleted":
            let p = try JSONDecoder.live().decode(BoardIdActorRaw.self, from: data)
            return .boardDeleted(boardId: p.boardId, actorId: p.actorId)
        case "board_members_changed":
            let p = try JSONDecoder.live().decode(BoardIdActorRaw.self, from: data)
            return .boardMembersChanged(boardId: p.boardId, actorId: p.actorId)
        default: throw DecodingError.dataCorrupted(.init(codingPath: [], debugDescription: "unknown kind: \(env.kind)"))
        }
    }

    private struct Envelope: Decodable { let kind: String }
    private struct NoteUpdatedPayload: Decodable { let noteId: UUID; let actorId: UUID; let patch: Note }
    private struct IdActor: Decodable { let noteId: UUID?; let actorId: UUID }
    private struct CardUpsertedPayload: Decodable { let boardId: UUID; let actorId: UUID; let card: Card }
    private struct CardDeletedPayload: Decodable { let boardId: UUID?; let cardId: UUID; let actorId: UUID }
    private struct BoardIdActorRaw: Decodable { let boardId: UUID; let actorId: UUID }
}

extension JSONDecoder {
    static func live() -> JSONDecoder {
        let d = JSONDecoder(); d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .custom { decoder in
            let s = try decoder.singleValueContainer().decode(String.self)
            let f = ISO8601DateFormatter.opendock()
            if let date = f.date(from: s) { return date }
            throw DecodingError.dataCorruptedError(in: try decoder.singleValueContainer(), debugDescription: "bad date \(s)")
        }
        return d
    }
}
