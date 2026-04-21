import SwiftUI

/// Overlay popover anchored to the caret rect. Shows link candidates
/// (notes + cards) filtered by the current @query.
struct MentionPopoverView: View {
    @EnvironmentObject var notes: NotesStore
    @EnvironmentObject var myCards: MyCardsStore
    let query: String
    let anchorRect: CGRect
    let excludeId: UUID?
    let onPick: (EntityKind, UUID, String) -> Void

    private struct Row: Identifiable { let id: String; let kind: EntityKind; let targetId: UUID; let title: String; let context: String? }

    private var rows: [Row] {
        let q = query.lowercased()
        var all: [Row] = notes.notes
            .filter { $0.id != excludeId }
            .map { Row(id: "note:\($0.id)", kind: .note, targetId: $0.id, title: $0.title.isEmpty ? "Untitled" : $0.title, context: nil) }
        all += myCards.cards
            .filter { $0.id != excludeId }
            .map { Row(id: "card:\($0.id)", kind: .card, targetId: $0.id, title: $0.title, context: "\($0.boardName) / \($0.columnTitle)") }
        if q.isEmpty { return Array(all.prefix(6)) }
        return all.filter { $0.title.lowercased().contains(q) || ($0.context?.lowercased().contains(q) ?? false) }.prefix(6).map { $0 }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if rows.isEmpty {
                Text("No matches").font(.custom(Theme.fontName, size: 12)).foregroundColor(Theme.ghost).padding(10)
            } else {
                ForEach(rows) { r in
                    Button { onPick(r.kind, r.targetId, r.title) } label: {
                        HStack(spacing: 6) {
                            Text(r.kind == .note ? "NOTE" : "CARD")
                                .font(.custom(Theme.fontSemibold, size: 9)).tracking(0.4)
                                .foregroundColor(Theme.ghost)
                                .padding(.horizontal, 5).padding(.vertical, 1)
                                .overlay(RoundedRectangle(cornerRadius: 3).stroke(Theme.border, lineWidth: 0.5))
                            Text(r.title).font(.custom(Theme.fontName, size: 13)).foregroundColor(Theme.text)
                                .lineLimit(1)
                            if let c = r.context {
                                Spacer()
                                Text(c).font(.custom(Theme.fontName, size: 10)).foregroundColor(Theme.ghost).lineLimit(1)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 10).padding(.vertical, 6)
                    }.buttonStyle(.plain)
                }
            }
        }
        .frame(width: 260)
        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.elevated))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 0.5))
        .shadow(color: .black.opacity(0.25), radius: 8, y: 4)
        .position(x: anchorRect.midX, y: anchorRect.maxY + 60)
    }
}
