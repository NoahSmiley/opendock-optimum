import SwiftUI

@main
struct OpenDockApp: App {
    @StateObject private var store = NotesStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .preferredColorScheme(.dark)
                .onAppear {
                    // Force dark background for launch screen
                    UIApplication.shared.connectedScenes
                        .compactMap { $0 as? UIWindowScene }
                        .flatMap { $0.windows }
                        .forEach { $0.backgroundColor = UIColor(red: 0.024, green: 0.024, blue: 0.024, alpha: 1) }
                }
        }
    }
}
