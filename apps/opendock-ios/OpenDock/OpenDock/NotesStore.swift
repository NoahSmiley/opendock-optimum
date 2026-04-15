import Foundation

@MainActor
class NotesStore: ObservableObject {
    @Published var notes: [Note] = []
    @Published var selectedId: UUID?
    @Published var searchQuery = ""

    private let key = "opendock-notes"

    init() {
        load()
        // Seed sample notes if empty
        if notes.isEmpty {
            notes = [
                Note(title: "Getting Started", content: "Welcome to OpenDock Notes.\n\nThis is a plain text editor with #markdown support.\n\nFeatures:\n- Pin notes to the top\n- Search across all notes\n- Tags via #hashtags\n- Word count\n- Auto-save", pinned: true),
                Note(title: "Meeting Notes", content: "Project sync — April 15\n\n- Review Q2 roadmap\n- Discuss hiring timeline\n- Ship v0.2 by end of month\n\n#work #meeting"),
                Note(title: "Ideas", content: "Things to explore:\n\n- Self-hosted git forge\n- Desktop + mobile sync\n- Markdown preview\n- Keyboard shortcuts\n\n#ideas"),
            ]
            save()
        }
    }

    var filtered: [Note] {
        let sorted = notes.sorted {
            if $0.pinned != $1.pinned { return $0.pinned }
            return $0.updatedAt > $1.updatedAt
        }
        guard !searchQuery.isEmpty else { return sorted }
        let q = searchQuery.lowercased()
        return sorted.filter {
            $0.title.lowercased().contains(q) || $0.content.lowercased().contains(q)
        }
    }

    var selected: Note? {
        notes.first { $0.id == selectedId }
    }

    func create(title: String) {
        let note = Note(title: title)
        notes.insert(note, at: 0)
        selectedId = note.id
        save()
    }

    func update(_ id: UUID, title: String? = nil, content: String? = nil) {
        guard let i = notes.firstIndex(where: { $0.id == id }) else { return }
        if let t = title { notes[i].title = t }
        if let c = content { notes[i].content = c }
        notes[i].updatedAt = Date()
        save()
    }

    func delete(_ id: UUID) {
        notes.removeAll { $0.id == id }
        if selectedId == id { selectedId = nil }
        save()
    }

    func togglePin(_ id: UUID) {
        guard let i = notes.firstIndex(where: { $0.id == id }) else { return }
        notes[i].pinned.toggle()
        save()
    }

    func duplicate(_ id: UUID) {
        guard let note = notes.first(where: { $0.id == id }) else { return }
        let copy = Note(title: "\(note.title) (copy)", content: note.content)
        notes.insert(copy, at: 0)
        selectedId = copy.id
        save()
    }

    private func save() {
        if let data = try? JSONEncoder().encode(notes) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode([Note].self, from: data)
        else { return }
        notes = decoded
    }
}
