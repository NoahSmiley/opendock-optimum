import SwiftUI

struct ColumnView: View {
    @EnvironmentObject var store: BoardsStore
    @EnvironmentObject var coord: DragCoordinator
    let col: BoardColumn
    let cards: [Card]
    let boardId: UUID
    let adding: Bool
    @Binding var newCardTitle: String
    let onAdd: () -> Void
    let onSubmit: () -> Void
    let onCancel: () -> Void
    let onOpen: (UUID) -> Void

    var isTargeted: Bool { coord.targetColumn == col.id && coord.active != nil }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) { header; cardsList }
            .frame(width: 288).frame(maxHeight: .infinity, alignment: .top)
            .background(GeometryReader { geo in
                Color.clear.preference(key: ColumnFramesKey.self, value: [col.id: geo.frame(in: .named("board"))])
            })
            .background(RoundedRectangle(cornerRadius: 12).fill(isTargeted ? Theme.elevated.opacity(0.7) : Theme.elevated))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(isTargeted ? Theme.active.opacity(0.3) : Theme.borderStrong, lineWidth: isTargeted ? 1 : 0.5))
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
                ForEach(Array(cards.enumerated()), id: \.element.id) { idx, card in
                    CardRowView(card: card, columnId: col.id, members: store.detail?.members ?? [], onOpen: onOpen)
                        .offset(y: shiftOffset(for: idx))
                }
                if cards.isEmpty { emptyState }
                Color.clear.frame(minHeight: 60)
            }
            .padding(.horizontal, 12).padding(.top, 12).padding(.bottom, 16)
            .frame(maxWidth: .infinity, minHeight: 400, alignment: .top)
            .animation(coord.active != nil ? .easeOut(duration: 0.18) : nil, value: coord.targetBefore)
            .animation(coord.active != nil ? .easeOut(duration: 0.18) : nil, value: coord.targetColumn)
            .animation(.spring(response: 0.3, dampingFraction: 0.85), value: cards.map(\.id))
        }
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

    private func shiftOffset(for idx: Int) -> CGFloat {
        guard coord.active != nil, coord.targetColumn == col.id, let beforeId = coord.targetBefore,
              let hoverIdx = cards.firstIndex(where: { $0.id == beforeId }) else { return 0 }
        return idx >= hoverIdx ? 52 : 0
    }
}
