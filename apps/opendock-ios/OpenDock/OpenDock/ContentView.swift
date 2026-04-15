import SwiftUI

struct ContentView: View {
    @EnvironmentObject var store: NotesStore
    @State private var path = NavigationPath()
    @State private var showNewNote = false

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                Theme.bg.ignoresSafeArea()
                NoteListView(path: $path, showNewNote: $showNewNote)
            }
            .navigationDestination(for: UUID.self) { id in
                ZStack {
                    Theme.bg.ignoresSafeArea()
                    NoteEditorView(noteId: id)
                }
            }
        }
        .tint(Theme.muted)
        .sheet(isPresented: $showNewNote) {
            NewNoteSheet(path: $path)
        }
        .onAppear { setupAppearance() }
    }

    private func setupAppearance() {
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor(Theme.bg)
        navAppearance.titleTextAttributes = [.foregroundColor: UIColor(Theme.active)]
        navAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor(Theme.active)]
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance

        UITableView.appearance().backgroundColor = UIColor(Theme.bg)
        UITableViewCell.appearance().backgroundColor = UIColor(Theme.bg)

        let searchBarAppearance = UITextField.appearance(whenContainedInInstancesOf: [UISearchBar.self])
        searchBarAppearance.backgroundColor = UIColor(Theme.input)
        searchBarAppearance.textColor = UIColor(Theme.text)
    }
}
