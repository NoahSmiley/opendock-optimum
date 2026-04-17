import SwiftUI

@main
struct OpenDockApp: App {
    @StateObject private var auth = AuthStore()
    @StateObject private var notesStore = NotesStore()
    @StateObject private var boardsStore = BoardsStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(auth)
                .environmentObject(notesStore)
                .environmentObject(boardsStore)
                .preferredColorScheme(.dark)
                .task {
                    APIClient.shared.auth = auth
                    await auth.refresh()
                }
        }
    }
}

struct RootView: View {
    @EnvironmentObject var auth: AuthStore
    @EnvironmentObject var notes: NotesStore
    @EnvironmentObject var boards: BoardsStore

    var body: some View {
        Group {
            if auth.loading { Theme.bg.ignoresSafeArea() }
            else if auth.isAuthed { ContentView() }
            else { LoginView() }
        }
        .onChange(of: auth.isAuthed) { _, authed in
            if authed {
                Task { await notes.load(); await boards.loadBoards() }
            } else { notes.reset(); boards.reset() }
        }
    }
}
