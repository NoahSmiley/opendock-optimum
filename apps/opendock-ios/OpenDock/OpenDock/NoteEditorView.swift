import SwiftUI

struct NoteEditorView: View {
    @EnvironmentObject var store: NotesStore
    @Environment(\.dismiss) var dismiss
    let noteId: UUID
    @State private var title = ""
    @State private var content = ""
    @State private var dirty = false
    @State private var confirmingDelete = false
    @State private var saveTask: Task<Void, Never>?

    private var note: Note? { store.notes.first { $0.id == noteId } }

    var body: some View {
        VStack(spacing: 0) {
            TextField("Untitled", text: $title)
                .font(.custom(Theme.fontSemibold, size: 24)).foregroundColor(Theme.active)
                .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 2)
                .onChange(of: title) { _, v in schedulePatch(title: v, content: nil) }

            let tags = NoteFormat.tags(content)
            if !tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) { ForEach(tags, id: \.self) { Text($0).font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.faint) } }
                    .padding(.horizontal, 20)
                }.padding(.vertical, 4)
            }

            Rectangle().fill(Theme.border).frame(height: 0.5).padding(.horizontal, 20).padding(.top, 8)

            TextEditor(text: $content)
                .font(.custom(Theme.fontMono, size: 14)).foregroundColor(Theme.text)
                .scrollContentBackground(.hidden).padding(.horizontal, 16).padding(.top, 8)
                .onChange(of: content) { _, v in schedulePatch(title: nil, content: v) }

            HStack(spacing: 8) {
                Text("\(NoteFormat.wordCount(content)) words"); Text("·"); Text(dirty ? "editing" : "saved"); Spacer()
            }
            .font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.ghost)
            .padding(.horizontal, 20).padding(.vertical, 10)
        }
        .background(Theme.bg).navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.bg, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button { Task { await store.togglePin(noteId) } } label: { Label(note?.pinned == true ? "Unpin" : "Pin", systemImage: note?.pinned == true ? "pin.slash" : "pin") }
                    Button { Task { await store.duplicate(noteId) } } label: { Label("Duplicate", systemImage: "doc.on.doc") }
                    Divider()
                    Button(role: .destructive) { confirmingDelete = true } label: { Label("Delete", systemImage: "trash") }
                } label: { Image(systemName: "ellipsis").font(.system(size: 14)).foregroundColor(Theme.muted) }
            }
        }
        .onAppear { if let note { title = note.title; content = note.content } }
        .alert("Delete note?", isPresented: $confirmingDelete) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) { Task { await store.delete(noteId); dismiss() } }
        } message: { Text("\"\(note?.title.isEmpty == false ? note!.title : "Untitled")\" will be permanently deleted.") }
    }

    private func schedulePatch(title: String?, content: String?) {
        dirty = true
        saveTask?.cancel()
        saveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 400_000_000)
            if Task.isCancelled { return }
            await store.update(noteId, title: title, content: content)
            dirty = false
        }
    }
}
