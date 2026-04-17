import Foundation

@MainActor
class NotesStore: ObservableObject {
    @Published private(set) var notes: [Note] = [] { didSet { recompute() } }
    @Published var searchQuery = "" { didSet { recompute() } }
    @Published private(set) var filtered: [Note] = []
    @Published var selectedId: UUID?
    private let key = "opendock-notes"
    private var saveTask: Task<Void, Never>?

    init() {
        if let data = UserDefaults.standard.data(forKey: key),
           let decoded = try? JSONDecoder().decode([Note].self, from: data) { notes = decoded }
        if notes.isEmpty { seedSampleNotes() } else { recompute() }
        selectedId = filtered.first?.id
    }

    private func recompute() {
        let sorted = notes.sorted { ($0.pinned ? 1 : 0, $0.updatedAt) > ($1.pinned ? 1 : 0, $1.updatedAt) }
        if searchQuery.isEmpty { filtered = sorted; return }
        let q = searchQuery.lowercased()
        filtered = sorted.filter { $0.title.lowercased().contains(q) || $0.content.lowercased().contains(q) }
    }

    func create(title: String) { let n = Note(title: title); notes.insert(n, at: 0); selectedId = n.id; save() }

    func update(_ id: UUID, title: String? = nil, content: String? = nil) {
        guard let i = notes.firstIndex(where: { $0.id == id }) else { return }
        if let t = title { notes[i].title = t }
        if let c = content { notes[i].content = c }
        notes[i].updatedAt = Date(); save()
    }

    func delete(_ id: UUID) { notes.removeAll { $0.id == id }; if selectedId == id { selectedId = nil }; save() }
    func togglePin(_ id: UUID) { guard let i = notes.firstIndex(where: { $0.id == id }) else { return }; notes[i].pinned.toggle(); save() }

    func duplicate(_ id: UUID) {
        guard let n = notes.first(where: { $0.id == id }) else { return }
        let copy = Note(title: "\(n.title) (copy)", content: n.content); notes.insert(copy, at: 0); selectedId = copy.id; save()
    }

    private func save() {
        saveTask?.cancel()
        let snapshot = notes
        saveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 150_000_000)
            if Task.isCancelled { return }
            if let data = try? JSONEncoder().encode(snapshot) { UserDefaults.standard.set(data, forKey: key) }
        }
    }

    private func seedSampleNotes() {
        let now = Date()
        func aged(_ n: Note, _ seconds: TimeInterval) -> Note { var c = n; c.updatedAt = now.addingTimeInterval(-seconds); return c }
        notes = [
            aged(Note(title: "Getting Started", content: "Welcome to OpenDock Notes.\n\nPlain text editor with #markdown support.\n- Pin notes to the top\n- Search across all notes\n- Tags via #hashtags\n- Auto-save", pinned: true), 2 * 3600),
            aged(Note(title: "Meeting Notes", content: "Project sync\n\n- Review Q2 roadmap\n- Discuss hiring timeline\n- Ship v0.2 by end of month\n\n#work #meeting"), 5 * 3600),
            aged(Note(title: "Ideas", content: "Things to explore:\n\n- Self-hosted git forge\n- Desktop + mobile sync\n- Markdown preview\n\n#ideas"), 2 * 86400),
        ]
        save()
    }
}
