import SwiftUI

@main
struct OpenDockApp: App {
    @StateObject private var notesStore = NotesStore()
    @StateObject private var boardsStore = BoardsStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(notesStore)
                .environmentObject(boardsStore)
                .preferredColorScheme(.dark)
        }
    }
}
