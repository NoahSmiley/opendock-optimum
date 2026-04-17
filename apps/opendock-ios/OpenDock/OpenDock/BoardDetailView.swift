import SwiftUI
import UniformTypeIdentifiers

struct BoardDetailView: View {
    @EnvironmentObject var store: BoardsStore
    let boardId: UUID
    @State private var newCardTitle = ""
    @State private var adding = false
    @State private var addingCol: UUID?
    @State private var openCardId: UUID?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(alignment: .top, spacing: 0) {
                if let d = store.detail, d.board.id == boardId {
                    ForEach(d.columns.sorted { $0.position < $1.position }) { col in
                        ColumnView(col: col, cards: store.cardsByColumn[col.id] ?? [], boardId: boardId,
                            adding: adding && addingCol == col.id, newCardTitle: $newCardTitle,
                            onAdd: { addingCol = col.id; adding = true }, onSubmit: { submit(colId: col.id) },
                            onCancel: { adding = false; newCardTitle = "" }, onOpen: { openCardId = $0 })
                    }
                }
            }
        }
        .background(Theme.bg).navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.bg, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text(store.detail?.board.name ?? "Board").font(.custom(Theme.fontSemibold, size: 17)).foregroundColor(Theme.active)
            }
        }
        .task(id: boardId) { await store.loadDetail(boardId) }
        .sheet(item: Binding(get: { openCardId.map { IDWrap(id: $0) } }, set: { openCardId = $0?.id })) { w in
            CardDetailSheet(boardId: boardId, cardId: w.id).environmentObject(store)
        }
    }

    private func submit(colId: UUID) {
        guard !newCardTitle.isEmpty else { return }
        let t = newCardTitle; newCardTitle = ""; adding = false
        Task { await store.addCard(boardId: boardId, columnId: colId, title: t) }
    }
}
