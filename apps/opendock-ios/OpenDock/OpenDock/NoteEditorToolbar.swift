import SwiftUI

struct NoteEditorToolbar: ToolbarContent {
    @EnvironmentObject var store: NotesStore
    let noteId: UUID
    let note: Note?
    @Binding var confirmingDelete: Bool
    @Binding var showingMembers: Bool

    var body: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button { showingMembers = true } label: {
                Image(systemName: "person.2").font(.system(size: 15)).foregroundColor(Theme.muted)
            }
        }
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                Button { Task { await store.togglePin(noteId) } } label: { Label(note?.pinned == true ? "Unpin" : "Pin", systemImage: note?.pinned == true ? "pin.slash" : "pin") }
                Button { Task { await store.duplicate(noteId) } } label: { Label("Duplicate", systemImage: "doc.on.doc") }
                Divider()
                Button(role: .destructive) { confirmingDelete = true } label: { Label("Delete", systemImage: "trash") }
            } label: {
                Image(systemName: "ellipsis").font(.system(size: 15)).foregroundColor(Theme.muted)
            }
        }
    }
}
