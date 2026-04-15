import SwiftUI

enum Tool: String, CaseIterable {
    case notes = "Notes"
    case boards = "Boards"
    case calendar = "Calendar"

    var icon: String {
        switch self {
        case .notes: return "doc.text"
        case .boards: return "square.grid.2x2"
        case .calendar: return "calendar"
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var store: NotesStore
    @State private var selectedTool: Tool = .notes
    @State private var notesPath = NavigationPath()
    @State private var showNewNote = false
    @State private var pendingNoteId: UUID?

    var body: some View {
        TabView(selection: $selectedTool) {
            NavigationStack(path: $notesPath) {
                ZStack {
                    Theme.bg.ignoresSafeArea()
                    NoteListView(path: $notesPath, showNewNote: $showNewNote)
                }
                .navigationDestination(for: UUID.self) { id in
                    ZStack {
                        Theme.bg.ignoresSafeArea()
                        NoteEditorView(noteId: id)
                    }
                }
            }
            .tag(Tool.notes)
            .tabItem {
                Label(Tool.notes.rawValue, systemImage: Tool.notes.icon)
            }

            PlaceholderView(tool: .boards)
                .tag(Tool.boards)
                .tabItem {
                    Label(Tool.boards.rawValue, systemImage: Tool.boards.icon)
                }

            PlaceholderView(tool: .calendar)
                .tag(Tool.calendar)
                .tabItem {
                    Label(Tool.calendar.rawValue, systemImage: Tool.calendar.icon)
                }
        }
        .tint(Theme.active)
        .sheet(isPresented: $showNewNote, onDismiss: {
            // Navigate to new note after sheet dismisses
            if let id = pendingNoteId {
                notesPath.append(id)
                pendingNoteId = nil
            }
        }) {
            NewNoteSheet(onCreated: { id in
                pendingNoteId = id
            })
        }
        .onAppear { setupAppearance() }
    }

    private func setupAppearance() {
        // Tab bar
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = UIColor(Theme.bg)
        tabAppearance.stackedLayoutAppearance.normal.iconColor = UIColor(Theme.ghost)
        tabAppearance.stackedLayoutAppearance.normal.titleTextAttributes = [.foregroundColor: UIColor(Theme.ghost)]
        tabAppearance.stackedLayoutAppearance.selected.iconColor = UIColor(Theme.active)
        tabAppearance.stackedLayoutAppearance.selected.titleTextAttributes = [.foregroundColor: UIColor(Theme.active)]
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance

        // Nav bar
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor(Theme.bg)
        navAppearance.shadowColor = .clear
        navAppearance.backButtonAppearance.normal.titleTextAttributes = [.foregroundColor: UIColor(Theme.muted)]
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        UINavigationBar.appearance().tintColor = UIColor(Theme.muted)

        // TextEditor cursor
        UITextView.appearance().tintColor = UIColor(Theme.text)

        // Window bg
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .forEach { $0.backgroundColor = UIColor(Theme.bg) }
    }
}

struct PlaceholderView: View {
    let tool: Tool
    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            VStack(spacing: 8) {
                Text(tool.rawValue)
                    .font(.custom(Theme.fontSemibold, size: 16))
                    .foregroundColor(Theme.faint)
                Text("Coming soon")
                    .font(.custom(Theme.fontName, size: 13))
                    .foregroundColor(Theme.ghost)
            }
        }
    }
}
