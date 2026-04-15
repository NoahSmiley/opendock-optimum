import SwiftUI

struct ContentView: View {
    @EnvironmentObject var notesStore: NotesStore
    @EnvironmentObject var boardsStore: BoardsStore
    @State private var notesPath = NavigationPath()
    @State private var boardsPath = NavigationPath()
    @State private var showNewNote = false
    @State private var pendingNoteId: UUID?

    var body: some View {
        TabView {
            NavigationStack(path: $notesPath) {
                NoteListView(path: $notesPath, showNewNote: $showNewNote)
                    .background(Theme.bg).navigationDestination(for: UUID.self) { id in
                        NoteEditorView(noteId: id).background(Theme.bg)
                    }
            }
            .tabItem { Label("Notes", systemImage: "doc.text") }

            NavigationStack(path: $boardsPath) {
                BoardsListView(path: $boardsPath)
                    .background(Theme.bg).navigationDestination(for: UUID.self) { id in
                        BoardDetailView(boardId: id).background(Theme.bg)
                    }
            }
            .tabItem { Label("Boards", systemImage: "square.grid.2x2") }

            Placeholder("Calendar").tabItem { Label("Calendar", systemImage: "calendar") }
        }
        .tint(Theme.active)
        .sheet(isPresented: $showNewNote, onDismiss: {
            if let id = pendingNoteId { notesPath.append(id); pendingNoteId = nil }
        }) { NewNoteSheet { pendingNoteId = $0 } }
        .onAppear { Theme.setupGlobal() }
    }
}

private struct Placeholder: View {
    let name: String
    init(_ name: String) { self.name = name }
    var body: some View {
        ZStack { Theme.bg.ignoresSafeArea(); Text("\(name) — coming soon").font(.custom(Theme.fontName, size: 13)).foregroundColor(Theme.ghost) }
    }
}
