import SwiftUI

struct LinkPickerSheet: View {
    @EnvironmentObject var notes: NotesStore
    @EnvironmentObject var boards: BoardsStore
    @Environment(\.dismiss) private var dismiss
    let anchor: EntityRef
    let pickKind: EntityKind
    let existing: Set<UUID>
    let onPick: (EntityRef) -> Void
    @State private var query = ""

    private struct Candidate: Identifiable { let id: UUID; let title: String; let context: String? }

    private var candidates: [Candidate] {
        switch pickKind {
        case .note:
            return notes.notes
                .filter { !(anchor.kind == .note && anchor.id == $0.id) }
                .filter { !existing.contains($0.id) }
                .map { Candidate(id: $0.id, title: $0.title.isEmpty ? "Untitled" : $0.title, context: nil) }
        case .card:
            let cards = boards.detail?.cards ?? []
            let columns = boards.detail?.columns ?? []
            let boardName = boards.detail?.board.name ?? ""
            return cards
                .filter { !(anchor.kind == .card && anchor.id == $0.id) }
                .filter { !existing.contains($0.id) }
                .map { card in
                    let col = columns.first { $0.id == card.columnId }?.title ?? ""
                    return Candidate(id: card.id, title: card.title, context: "\(boardName) / \(col)")
                }
        }
    }

    private var filtered: [Candidate] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        if q.isEmpty { return Array(candidates.prefix(50)) }
        return candidates.filter {
            $0.title.lowercased().contains(q) || ($0.context?.lowercased().contains(q) ?? false)
        }.prefix(50).map { $0 }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                TextField(pickKind == .note ? "Search notes…" : "Search cards…", text: $query)
                    .font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text)
                    .padding(10).background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
                    .padding(.horizontal, 16).padding(.top, 12)
                ScrollView {
                    if filtered.isEmpty {
                        Text("No matches.")
                            .font(.custom(Theme.fontName, size: 13)).foregroundColor(Theme.ghost)
                            .frame(maxWidth: .infinity).padding(20)
                    } else {
                        VStack(spacing: 0) {
                            ForEach(filtered) { c in
                                Button {
                                    onPick(EntityRef(kind: pickKind, id: c.id))
                                } label: {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(c.title).font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text)
                                        if let ctx = c.context {
                                            Text(ctx).font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.ghost)
                                        }
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.horizontal, 16).padding(.vertical, 10)
                                }.buttonStyle(.plain)
                                Rectangle().fill(Theme.border).frame(height: 0.5).padding(.leading, 16)
                            }
                        }.padding(.top, 8)
                    }
                }
            }
            .background(Theme.bg)
            .navigationTitle(pickKind == .note ? "Link note" : "Link card")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Theme.bg, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { Button("Cancel") { dismiss() }.foregroundColor(Theme.active) }
            }
        }
    }
}
