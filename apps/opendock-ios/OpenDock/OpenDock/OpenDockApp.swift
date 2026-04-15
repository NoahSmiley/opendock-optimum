import SwiftUI

@main
struct OpenDockApp: App {
    @StateObject private var store = NotesStore()

    init() {
        // Debug: verify custom fonts are available
        #if DEBUG
        for family in UIFont.familyNames.sorted() {
            for name in UIFont.fontNames(forFamilyName: family) {
                if name.contains("OpenAI") {
                    print("✓ Font available: \(name)")
                }
            }
        }
        #endif
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .preferredColorScheme(.dark)
        }
    }
}
