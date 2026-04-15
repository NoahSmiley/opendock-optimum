import SwiftUI

struct NoteEditorView: View {
    @EnvironmentObject var store: NotesStore
    @Environment(\.dismiss) var dismiss
    let noteId: UUID

    @State private var title = ""
    @State private var content = ""
    @FocusState private var editorFocused: Bool

    private var note: Note? { store.notes.first { $0.id == noteId } }

    var body: some View {
        VStack(spacing: 0) {
            // Title
            TextField("Untitled", text: $title)
                .font(.custom(Theme.fontSemibold, size: 24))
                .foregroundColor(Theme.active)
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 2)
                .onChange(of: title) { _, val in store.update(noteId, title: val) }

            // Tags
            if let note, !note.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(note.tags, id: \.self) { tag in
                            Text(tag)
                                .font(.custom(Theme.fontName, size: 11))
                                .foregroundColor(Theme.faint)
                        }
                    }
                    .padding(.horizontal, 20)
                }
                .padding(.vertical, 4)
            }

            // Divider
            Rectangle().fill(Theme.border).frame(height: 0.5)
                .padding(.horizontal, 20)
                .padding(.top, 8)

            // Editor
            TextEditor(text: $content)
                .font(.custom("Menlo", size: 14))
                .foregroundColor(Theme.text)
                .scrollContentBackground(.hidden)
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .focused($editorFocused)
                .onChange(of: content) { _, val in store.update(noteId, content: val) }

            // Footer
            HStack(spacing: 8) {
                Text("\(note?.wordCount ?? 0) words")
                Text("·")
                Text("saved")
                Spacer()
            }
            .font(.custom(Theme.fontName, size: 11))
            .foregroundColor(Theme.ghost)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
        }
        .background(Theme.bg)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.bg, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button { store.togglePin(noteId) } label: {
                        Label(note?.pinned == true ? "Unpin" : "Pin", systemImage: note?.pinned == true ? "pin.slash" : "pin")
                    }
                    Button { store.duplicate(noteId) } label: {
                        Label("Duplicate", systemImage: "doc.on.doc")
                    }
                    Divider()
                    Button(role: .destructive) {
                        store.delete(noteId)
                        dismiss()
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 14))
                        .foregroundColor(Theme.muted)
                }
            }
        }
        .onAppear {
            if let note {
                title = note.title
                content = note.content
            }
        }
    }
}
