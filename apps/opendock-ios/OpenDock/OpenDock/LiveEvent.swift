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
    case noteShareAdded(noteId: UUID, actorId: UUID)
    case noteShareRemoved(noteId: UUID, actorId: UUID)
    case boardShareAdded(boardId: UUID, actorId: UUID)
    case boardShareRemoved(boardId: UUID, actorId: UUID)
}
