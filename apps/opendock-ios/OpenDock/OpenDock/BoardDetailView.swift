import SwiftUI

struct BoardDetailView: View {
    @EnvironmentObject var store: BoardsStore
    @EnvironmentObject var auth: AuthStore
    @EnvironmentObject var links: LinksStore
    let boardId: UUID
    @StateObject private var coord = DragCoordinator()
    @State private var newCardTitle = ""
    @State private var adding = false
    @State private var addingCol: UUID?
    @State private var openCardId: UUID?
    @State private var addingColumn = false
    @State private var newColumnTitle = ""
    @State private var showingMembers = false
    @State private var socket: LiveSocket?

    var body: some View {
        ZStack(alignment: .topLeading) {
            ScrollView(.horizontal, showsIndicators: false) { columns }
                .scrollDisabled(coord.active != nil)
                .onPreferenceChange(CardFramesKey.self) { coord.cardFrames = $0 }
                .onPreferenceChange(ColumnFramesKey.self) { coord.columnFrames = $0 }
            DragOverlay(coord: coord)
        }
        .coordinateSpace(name: "board")
        .environmentObject(coord)
        .background(Theme.bg).navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.bg, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .toolbar { toolbarContent }
        .task(id: boardId) { await store.loadDetail(boardId); startSocket() }
        .onDisappear { socket?.stop(); socket = nil }
        .onReceive(NotificationCenter.default.publisher(for: .opendockCardDrop), perform: handleDrop)
        .sheet(item: Binding(get: { openCardId.map { IDWrap(id: $0) } }, set: { openCardId = $0?.id })) { w in
            CardDetailSheet(boardId: boardId, cardId: w.id).environmentObject(store)
        }
        .sheet(isPresented: $showingMembers) {
            if let d = store.detail, d.board.id == boardId {
                BoardMembersSheet(boardId: boardId, ownerId: d.board.ownerId).environmentObject(store)
            }
        }
        .alert("New column", isPresented: $addingColumn) {
            TextField("Column title", text: $newColumnTitle)
            Button("Cancel", role: .cancel) { newColumnTitle = "" }
            Button("Add") { submitColumn() }
        }
    }

    private var columns: some View {
        HStack(alignment: .top, spacing: 0) {
            if let d = store.detail, d.board.id == boardId {
                let ordered = d.columns.sorted { $0.position < $1.position }
                ForEach(Array(ordered.enumerated()), id: \.element.id) { idx, col in
                    ColumnView(col: col, cards: store.cardsByColumn[col.id] ?? [], boardId: boardId,
                        adding: adding && addingCol == col.id, newCardTitle: $newCardTitle,
                        onAdd: { addingCol = col.id; adding = true }, onSubmit: { submit(colId: col.id) },
                        onCancel: { adding = false; newCardTitle = "" }, onOpen: { openCardId = $0 },
                        onMoveLeft: { Task { await store.reorderColumn(boardId: boardId, columnId: col.id, toPosition: idx - 1) } },
                        onMoveRight: { Task { await store.reorderColumn(boardId: boardId, columnId: col.id, toPosition: idx + 1) } },
                        canMoveLeft: idx > 0, canMoveRight: idx < ordered.count - 1)
                }
            }
        }
    }

    @ToolbarContentBuilder private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .principal) { Text(store.detail?.board.name ?? "Board").font(.custom(Theme.fontSemibold, size: 17)).foregroundColor(Theme.active) }
        ToolbarItem(placement: .topBarTrailing) { Button { showingMembers = true } label: { Image(systemName: "person.2").font(.system(size: 15)).foregroundColor(Theme.muted) } }
        ToolbarItem(placement: .topBarTrailing) { Button { addingColumn = true } label: { Image(systemName: "plus.rectangle.on.rectangle").font(.system(size: 15)).foregroundColor(Theme.muted) } }
    }

    private func submit(colId: UUID) {
        guard !newCardTitle.isEmpty else { return }
        let t = newCardTitle; newCardTitle = ""; adding = false
        Task { await store.addCard(boardId: boardId, columnId: colId, title: t) }
    }

    private func handleDrop(_ note: Notification) {
        guard let i = note.userInfo, let c = i["cardId"] as? UUID, let col = i["columnId"] as? UUID else { coord.finish(); return }
        let b = i["beforeId"] as? UUID
        _ = store.applyReorderLocally(cardId: c, to: col, before: b); coord.finish()
        Task { await store.reorderCard(boardId: boardId, cardId: c, to: col, before: b) }
    }

    private func submitColumn() {
        let t = newColumnTitle.trimmingCharacters(in: .whitespaces); newColumnTitle = ""
        guard !t.isEmpty else { return }
        Task { await store.addColumn(boardId: boardId, title: t) }
    }

    private func startSocket() {
        guard let token = auth.token, socket == nil else { return }
        socket = LiveSocket(scope: .board, id: boardId, token: token) { [store, links, uid = auth.userId] ev in
            if case .cardUpserted(_, let actor, _) = ev, actor == uid { return }
            if case .cardDeleted(_, _, let actor) = ev, actor == uid { return }
            store.apply(event: ev)
            links.apply(event: ev)
        }
        socket?.start()
    }
}
