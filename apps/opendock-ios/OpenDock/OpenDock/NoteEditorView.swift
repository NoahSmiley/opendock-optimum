import SwiftUI

struct NoteEditorView: View {
    @EnvironmentObject var store: NotesStore
    @EnvironmentObject var auth: AuthStore
    @Environment(\.dismiss) var dismiss
    let noteId: UUID
    @State private var title = ""
    @State private var content = ""
    @State private var dirty = false
    @State private var confirmingDelete = false
    @State private var showingMembers = false
    @State private var saveTask: Task<Void, Never>?
    @State private var socket: LiveSocket?

    private var note: Note? { store.notes.first { $0.id == noteId } }

    var body: some View {
        VStack(spacing: 0) {
            TextField("Untitled", text: $title)
                .font(.custom(Theme.fontSemibold, size: 24)).foregroundColor(Theme.active)
                .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 2)
                .onChange(of: title) { _, _ in schedulePatch() }

            Rectangle().fill(Theme.border).frame(height: 0.5).padding(.horizontal, 20).padding(.top, 8)

            TextEditor(text: $content)
                .font(.custom(Theme.fontMono, size: 14)).foregroundColor(Theme.text)
                .scrollContentBackground(.hidden).padding(.horizontal, 16).padding(.top, 8)
                .onChange(of: content) { _, _ in schedulePatch() }

            HStack(spacing: 8) {
                Text("\(NoteFormat.wordCount(content)) words"); Text("·"); Text(dirty ? "editing" : "saved"); Spacer()
            }
            .font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.ghost)
            .padding(.horizontal, 20).padding(.vertical, 10)
        }
        .background(Theme.bg).navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.bg, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .toolbar { NoteEditorToolbar(noteId: noteId, note: note, confirmingDelete: $confirmingDelete, showingMembers: $showingMembers) }
        .onAppear { sync(); startSocket() }
        .onDisappear { flushPending(); socket?.stop(); socket = nil }
        .onChange(of: note) { _, _ in applyRemoteIfNotDirty() }
        .alert("Delete note?", isPresented: $confirmingDelete) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) { Task { await store.delete(noteId); dismiss() } }
        } message: { Text("\"\(note?.title.isEmpty == false ? note!.title : "Untitled")\" will be permanently deleted.") }
        .sheet(isPresented: $showingMembers) {
            if let n = note { MembersSheet(noteId: noteId, ownerId: n.ownerId).environmentObject(auth) }
        }
    }

    private func sync() { if let n = note { title = n.title; content = n.content } }

    private func applyRemoteIfNotDirty() {
        guard !dirty, let n = note else { return }
        if n.title != title { title = n.title }
        if n.content != content { content = n.content }
    }

    private func startSocket() {
        guard let token = auth.token, socket == nil else { return }
        socket = LiveSocket(scope: .note, id: noteId, token: token) { [store] ev in
            store.apply(event: ev)
        }
        socket?.start()
    }

    private func schedulePatch() {
        dirty = true
        saveTask?.cancel()
        saveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 400_000_000)
            if Task.isCancelled { return }
            await store.update(noteId, title: title, content: content)
            dirty = false
        }
    }

    private func flushPending() {
        guard dirty else { return }
        saveTask?.cancel()
        Task { await store.update(noteId, title: title, content: content) }
    }
}
