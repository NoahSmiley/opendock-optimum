import SwiftUI

@main
struct OpenDockApp: App {
    @StateObject private var auth = AuthStore()
    @StateObject private var notesStore = NotesStore()
    @StateObject private var boardsStore = BoardsStore()
    @StateObject private var linksStore = LinksStore()
    @StateObject private var myCardsStore = MyCardsStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(auth)
                .environmentObject(notesStore)
                .environmentObject(boardsStore)
                .environmentObject(linksStore)
                .environmentObject(myCardsStore)
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
    @EnvironmentObject var links: LinksStore
    @EnvironmentObject var myCards: MyCardsStore
    @State private var inbox: LiveSocket?

    var body: some View {
        Group {
            if auth.loading { Theme.bg.ignoresSafeArea() }
            else if auth.isAuthed { ContentView() }
            else { LoginView() }
        }
        .onChange(of: auth.isAuthed) { _, authed in
            if authed {
                Task { await notes.load(); await boards.loadBoards(); await myCards.ensure() }
                startInbox()
            } else {
                notes.reset(); boards.reset(); links.clear(); myCards.clear()
                inbox?.stop(); inbox = nil
            }
        }
    }

    private func startInbox() {
        guard let token = auth.token, let uid = auth.userId, inbox == nil else { return }
        inbox = LiveSocket(scope: .user, id: uid, token: token) { [notes, boards, links, myCards] ev in
            notes.apply(event: ev)
            boards.apply(event: ev)
            links.apply(event: ev)
            myCards.apply(event: ev)
        }
        inbox?.start()
    }
}
