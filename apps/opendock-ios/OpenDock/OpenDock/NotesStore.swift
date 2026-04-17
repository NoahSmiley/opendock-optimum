import Foundation

@MainActor
class NotesStore: ObservableObject {
    @Published private(set) var notes: [Note] = []
    @Published var searchQuery: String = ""
    @Published var selectedId: UUID?
    @Published private(set) var loading = false
    @Published var error: String?

    func load() async {
        loading = true
        do {
            notes = try await NotesAPI.list()
            if selectedId == nil { selectedId = filtered.first?.id }
        } catch { self.error = "\(error)" }
        loading = false
    }

    func note(_ id: UUID) -> Note? { notes.first { $0.id == id } }

    var filtered: [Note] {
        let sorted = notes.sorted { ($0.pinned ? 1 : 0, $0.updatedAt) > ($1.pinned ? 1 : 0, $1.updatedAt) }
        guard !searchQuery.isEmpty else { return sorted }
        let q = searchQuery.lowercased()
        return sorted.filter { $0.title.lowercased().contains(q) || $0.content.lowercased().contains(q) }
    }

    func create(title: String) async {
        do {
            let note = try await NotesAPI.create(CreateNoteBody(title: title, content: nil, pinned: false))
            notes.insert(note, at: 0); selectedId = note.id
        } catch { self.error = "\(error)" }
    }

    func update(_ id: UUID, title: String? = nil, content: String? = nil, pinned: Bool? = nil) async {
        do {
            let fresh = try await NotesAPI.update(id, UpdateNoteBody(title: title, content: content, pinned: pinned))
            if let i = notes.firstIndex(where: { $0.id == id }) { notes[i] = fresh }
        } catch { self.error = "\(error)" }
    }

    func delete(_ id: UUID) async {
        do { try await NotesAPI.delete(id); notes.removeAll { $0.id == id }; if selectedId == id { selectedId = nil } }
        catch { self.error = "\(error)" }
    }

    func togglePin(_ id: UUID) async {
        guard let n = note(id) else { return }
        await update(id, pinned: !n.pinned)
    }

    func duplicate(_ id: UUID) async {
        guard let n = note(id) else { return }
        do {
            let note = try await NotesAPI.create(CreateNoteBody(title: "\(n.title) (copy)", content: n.content, pinned: false))
            notes.insert(note, at: 0); selectedId = note.id
        } catch { self.error = "\(error)" }
    }

    func reset() { notes = []; searchQuery = ""; selectedId = nil; error = nil }

    func apply(event: LiveEvent) {
        switch event {
        case .noteUpdated(_, _, let patch):
            if let i = notes.firstIndex(where: { $0.id == patch.id }) { notes[i] = patch } else { notes.insert(patch, at: 0) }
        case .noteDeleted(let noteId, _):
            notes.removeAll { $0.id == noteId }; if selectedId == noteId { selectedId = nil }
        case .noteShareAdded, .noteShareRemoved:
            Task { await self.load() }
        default: break
        }
    }
}
