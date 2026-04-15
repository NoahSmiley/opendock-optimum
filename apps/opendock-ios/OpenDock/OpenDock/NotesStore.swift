import Foundation

@MainActor
class NotesStore: ObservableObject {
    @Published var notes: [Note] = []
    @Published var selectedId: UUID?
    @Published var searchQuery = ""
    private let key = "opendock-notes"

    init() {
        if let data = UserDefaults.standard.data(forKey: key),
           let decoded = try? JSONDecoder().decode([Note].self, from: data) { notes = decoded }
        if notes.isEmpty { seedSampleNotes() }
    }

    var filtered: [Note] {
        let sorted = notes.sorted { ($0.pinned ? 1 : 0, $0.updatedAt) > ($1.pinned ? 1 : 0, $1.updatedAt) }
        guard !searchQuery.isEmpty else { return sorted }
        let q = searchQuery.lowercased()
        return sorted.filter { $0.title.lowercased().contains(q) || $0.content.lowercased().contains(q) }
    }

    func create(title: String) { let n = Note(title: title); notes.insert(n, at: 0); selectedId = n.id; save() }
    func update(_ id: UUID, title: String? = nil, content: String? = nil) {
        guard let i = notes.firstIndex(where: { $0.id == id }) else { return }
        if let t = title { notes[i].title = t }; if let c = content { notes[i].content = c }
        notes[i].updatedAt = Date(); save()
    }
    func delete(_ id: UUID) { notes.removeAll { $0.id == id }; if selectedId == id { selectedId = nil }; save() }
    func togglePin(_ id: UUID) { guard let i = notes.firstIndex(where: { $0.id == id }) else { return }; notes[i].pinned.toggle(); save() }
    func duplicate(_ id: UUID) {
        guard let n = notes.first(where: { $0.id == id }) else { return }
        let copy = Note(title: "\(n.title) (copy)", content: n.content); notes.insert(copy, at: 0); selectedId = copy.id; save()
    }

    private func save() { if let data = try? JSONEncoder().encode(notes) { UserDefaults.standard.set(data, forKey: key) } }

    private func seedSampleNotes() {
        notes = [
            Note(title: "Getting Started", content: "Welcome to OpenDock Notes.\n\nPlain text editor with #markdown support.\n- Pin notes to the top\n- Search across all notes\n- Tags via #hashtags\n- Auto-save", pinned: true),
            Note(title: "Meeting Notes", content: "Project sync\n\n- Review Q2 roadmap\n- Discuss hiring timeline\n- Ship v0.2 by end of month\n\n#work #meeting"),
            Note(title: "Ideas", content: "Things to explore:\n\n- Self-hosted git forge\n- Desktop + mobile sync\n- Markdown preview\n\n#ideas"),
        ]
        save()
    }
}
