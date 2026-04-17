import SwiftUI
import UniformTypeIdentifiers

struct ColumnView: View {
    @EnvironmentObject var store: BoardsStore
    let col: BoardColumn
    let cards: [Card]
    let boardId: UUID
    let adding: Bool
    @Binding var newCardTitle: String
    let onAdd: () -> Void
    let onSubmit: () -> Void
    let onCancel: () -> Void
    let onOpen: (UUID) -> Void
    @State private var isTargeted = false
    @State private var hoverBeforeId: UUID?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) { header; cardsList }
            .frame(width: 288).frame(maxHeight: .infinity, alignment: .top)
            .background(RoundedRectangle(cornerRadius: 12).fill(isTargeted ? Theme.input : Theme.elevated))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.borderStrong, lineWidth: 0.5))
            .padding(.horizontal, 6).padding(.vertical, 12)
    }

    private var header: some View {
        HStack(spacing: 8) {
            Text(col.title.uppercased()).font(.custom(Theme.fontSemibold, size: 11)).foregroundColor(Theme.muted).tracking(0.6)
            Text("\(cards.count)").font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.ghost)
            Spacer()
            Button(action: onAdd) { Image(systemName: "plus").font(.system(size: 13, weight: .light)).foregroundColor(Theme.faint) }
        }
        .padding(.horizontal, 16).padding(.vertical, 14)
    }

    private var cardsList: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 6) {
                if adding { newCardField }
                ForEach(Array(cards.enumerated()), id: \.element.id) { idx, card in cardRow(idx: idx, card: card) }
                if cards.isEmpty && !adding { emptyState }
                Color.clear.frame(minHeight: 60)
            }
            .padding(.horizontal, 12).padding(.top, 12).padding(.bottom, 16)
            .frame(maxWidth: .infinity, minHeight: 400, alignment: .top)
        }
        .dropDestination(for: String.self, action: handleColumnDrop, isTargeted: handleColumnTarget)
    }

    private func cardRow(idx: Int, card: Card) -> some View {
        CardRowView(card: card, members: store.detail?.members ?? [], onOpen: onOpen)
            .offset(y: shiftOffset(for: idx))
            .dropDestination(for: String.self, action: { ids, _ in handleCardDrop(ids: ids, beforeId: card.id) }, isTargeted: { hovering in
                if hovering { withAnimation(.easeOut(duration: 0.18)) { hoverBeforeId = card.id } }
            })
    }

    private var newCardField: some View {
        TextField("New card", text: $newCardTitle).font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text)
            .padding(12).background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.borderStrong, lineWidth: 0.5))
            .onSubmit(onSubmit).submitLabel(.done)
            .toolbar { ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("Cancel", action: onCancel); Button("Add", action: onSubmit).bold() } }
    }

    private var emptyState: some View {
        Rectangle().fill(Color.clear).frame(height: 100).overlay(
            Text("Drop here").font(.custom(Theme.fontName, size: 12)).foregroundColor(isTargeted ? Theme.muted : Theme.ghost)
        )
    }

    private func handleColumnDrop(ids: [String], _ point: CGPoint) -> Bool {
        withAnimation(.easeOut(duration: 0.18)) { hoverBeforeId = nil }
        guard let s = ids.first, let cid = UUID(uuidString: s) else { return false }
        Task { await store.reorderCard(boardId: boardId, cardId: cid, to: col.id, before: nil) }
        return true
    }

    private func handleColumnTarget(_ hovering: Bool) {
        isTargeted = hovering
        if !hovering { withAnimation(.easeOut(duration: 0.18)) { hoverBeforeId = nil } }
    }

    private func handleCardDrop(ids: [String], beforeId: UUID) -> Bool {
        withAnimation(.easeOut(duration: 0.18)) { hoverBeforeId = nil }
        guard let s = ids.first, let cid = UUID(uuidString: s) else { return false }
        Task { await store.reorderCard(boardId: boardId, cardId: cid, to: col.id, before: beforeId) }
        return true
    }

    private func shiftOffset(for idx: Int) -> CGFloat {
        guard let beforeId = hoverBeforeId, let hoverIdx = cards.firstIndex(where: { $0.id == beforeId }) else { return 0 }
        return idx > hoverIdx ? 48 : 0
    }
}
