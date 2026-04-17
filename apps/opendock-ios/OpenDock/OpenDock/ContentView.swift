import SwiftUI

struct ContentView: View {
    @EnvironmentObject var notesStore: NotesStore
    @EnvironmentObject var boardsStore: BoardsStore
    @State private var tab = 0
    @State private var notesPath = NavigationPath()
    @State private var boardsPath = NavigationPath()

    var tabSelection: Binding<Int> {
        Binding(get: { tab }, set: { new in
            if new == tab {
                if new == 0 { notesPath = NavigationPath() }
                if new == 1 { boardsPath = NavigationPath() }
            }
            tab = new
        })
    }

    var body: some View {
        TabView(selection: tabSelection) {
            NavigationStack(path: $notesPath) {
                NoteListView(path: $notesPath, onCreateNew: createBlankNote)
                    .background(Theme.bg).navigationDestination(for: UUID.self) { id in
                        NoteEditorView(noteId: id).background(Theme.bg)
                    }
            }
            .tabItem { Label("Notes", systemImage: "doc.text") }.tag(0)

            NavigationStack(path: $boardsPath) {
                BoardsListView(path: $boardsPath)
                    .background(Theme.bg).navigationDestination(for: UUID.self) { id in
                        BoardDetailView(boardId: id).background(Theme.bg)
                    }
            }
            .tabItem { Label("Boards", systemImage: "square.grid.2x2") }.tag(1)

            ProfileView().tabItem { Label("Profile", systemImage: "person.crop.circle") }.tag(2)
        }
        .tint(Theme.active)
        .onAppear { Theme.setupGlobal() }
    }

    private func createBlankNote() {
        Task {
            await notesStore.create(title: "")
            if let id = notesStore.selectedId { notesPath.append(id) }
        }
    }
}
