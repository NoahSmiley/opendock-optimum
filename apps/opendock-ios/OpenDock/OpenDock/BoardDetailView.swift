import SwiftUI
import UniformTypeIdentifiers

struct BoardDetailView: View {
    @EnvironmentObject var store: BoardsStore
    let boardId: UUID
    @State private var newCardTitle = ""
    @State private var adding = false
    @State private var addingCol: UUID?
    @State private var openCardId: UUID?
    @State private var addingColumn = false
    @State private var newColumnTitle = ""

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
            ToolbarItem(placement: .topBarTrailing) {
                Button { addingColumn = true } label: {
                    Image(systemName: "plus.rectangle.on.rectangle").font(.system(size: 14)).foregroundColor(Theme.muted)
                }
            }
        }
        .task(id: boardId) { await store.loadDetail(boardId) }
        .sheet(item: Binding(get: { openCardId.map { IDWrap(id: $0) } }, set: { openCardId = $0?.id })) { w in
            CardDetailSheet(boardId: boardId, cardId: w.id).environmentObject(store)
        }
        .alert("New column", isPresented: $addingColumn) {
            TextField("Column title", text: $newColumnTitle)
            Button("Cancel", role: .cancel) { newColumnTitle = "" }
            Button("Add") { submitColumn() }
        }
    }

    private func submit(colId: UUID) {
        guard !newCardTitle.isEmpty else { return }
        let t = newCardTitle; newCardTitle = ""; adding = false
        Task { await store.addCard(boardId: boardId, columnId: colId, title: t) }
    }

    private func submitColumn() {
        let t = newColumnTitle.trimmingCharacters(in: .whitespaces)
        newColumnTitle = ""
        guard !t.isEmpty else { return }
        Task { await store.addColumn(boardId: boardId, title: t) }
    }
}
