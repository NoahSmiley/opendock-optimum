import SwiftUI

struct BoardDetailView: View {
    @EnvironmentObject var store: BoardsStore
    let boardId: UUID
    @State private var selectedColumn: UUID?
    @State private var newCardTitle = ""

    private var board: Board? { store.boards.first { $0.id == boardId } }

    var body: some View {
        VStack(spacing: 0) {
            if let board {
                // Column picker
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 0) {
                        ForEach(board.columns) { col in
                            Button { selectedColumn = col.id } label: {
                                Text(col.title).font(.custom(active(col.id) ? Theme.fontSemibold : Theme.fontName, size: 14))
                                    .foregroundColor(active(col.id) ? Theme.active : Theme.faint)
                                    .padding(.horizontal, 16).padding(.vertical, 10)
                            }
                        }
                    }
                }
                .padding(.horizontal, 4)

                Rectangle().fill(Theme.border).frame(height: 0.5)

                // Add card
                HStack {
                    TextField("New card", text: $newCardTitle).font(.custom(Theme.fontName, size: 15)).foregroundColor(Theme.text)
                        .onSubmit { addCard() }
                    if !newCardTitle.isEmpty {
                        Button("Add") { addCard() }.font(.custom(Theme.fontSemibold, size: 13)).foregroundColor(Theme.active)
                    }
                }
                .padding(.horizontal, 20).padding(.vertical, 10)

                Rectangle().fill(Theme.border).frame(height: 0.5)

                // Cards in selected column
                let colId = selectedColumn ?? board.columns.first?.id ?? UUID()
                let cards = board.cardsIn(colId)

                if cards.isEmpty {
                    Spacer()
                    Text("No cards").font(.custom(Theme.fontName, size: 13)).foregroundColor(Theme.ghost)
                    Spacer()
                } else {
                    List {
                        ForEach(cards) { card in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(card.title).font(.custom(Theme.fontMedium, size: 15)).foregroundColor(Theme.text)
                            }
                            .listRowBackground(Theme.bg).listRowSeparatorTint(Theme.border)
                            .swipeActions(edge: .trailing) {
                                Button(role: .destructive) { store.deleteCard(boardId: boardId, cardId: card.id) } label: { Label("Delete", systemImage: "trash") }
                            }
                            .swipeActions(edge: .leading) {
                                ForEach(board.columns.filter { $0.id != colId }) { target in
                                    Button { store.moveCard(boardId: boardId, cardId: card.id, to: target.id) } label: { Text(target.title) }.tint(Theme.faint)
                                }
                            }
                        }
                    }
                    .listStyle(.plain).scrollContentBackground(.hidden)
                }
            }
        }
        .background(Theme.bg).navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.bg, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .principal) { Text(board?.name ?? "Board").font(.custom(Theme.fontSemibold, size: 17)).foregroundColor(Theme.active) }
        }
        .onAppear { if selectedColumn == nil { selectedColumn = board?.columns.first?.id } }
    }

    private func active(_ id: UUID) -> Bool { selectedColumn == id || (selectedColumn == nil && board?.columns.first?.id == id) }

    private func addCard() {
        guard !newCardTitle.isEmpty, let colId = selectedColumn ?? board?.columns.first?.id else { return }
        store.addCard(boardId: boardId, columnId: colId, title: newCardTitle); newCardTitle = ""
    }
}
