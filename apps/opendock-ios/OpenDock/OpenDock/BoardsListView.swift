import SwiftUI

struct BoardsListView: View {
    @EnvironmentObject var store: BoardsStore
    @Binding var path: NavigationPath
    @State private var adding = false
    @State private var name = ""
    @State private var renaming: UUID?
    @State private var renameText = ""
    @State private var deleting: Board?

    var sortedBoards: [Board] {
        store.boards.sorted { a, b in
            if a.pinned != b.pinned { return a.pinned && !b.pinned }
            return a.name.localizedCaseInsensitiveCompare(b.name) == .orderedAscending
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            Rectangle().fill(Theme.border).frame(height: 0.5)
            if store.boards.isEmpty && !adding { emptyState } else { list }
        }
        .background(Theme.bg).navigationBarHidden(true)
        .alert("Rename board", isPresented: Binding(get: { renaming != nil }, set: { if !$0 { renaming = nil } })) {
            TextField("Name", text: $renameText)
            Button("Cancel", role: .cancel) { renaming = nil }
            Button("Save") { if let id = renaming, !renameText.isEmpty { Task { await store.renameBoard(id, name: renameText) } }; renaming = nil }
        }
        .alert("Delete board?", isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } })) {
            Button("Cancel", role: .cancel) { deleting = nil }
            Button("Delete", role: .destructive) { if let d = deleting { Task { await store.deleteBoard(d.id) } }; deleting = nil }
        } message: { Text("\"\(deleting?.name ?? "")\" will be permanently deleted.") }
    }

    private var header: some View {
        HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 4) {
                Text("OpenDock").font(.custom(Theme.fontMedium, size: 13)).foregroundColor(Theme.faint).tracking(0.5)
                Text("Boards").font(.custom(Theme.fontSemibold, size: 28)).foregroundColor(Theme.active)
            }
            Spacer()
            Button { adding = true } label: { Image(systemName: "plus").font(.system(size: 22, weight: .light)).foregroundColor(Theme.muted) }.padding(.bottom, 4)
        }
        .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 16)
    }

    private var emptyState: some View {
        VStack {
            Spacer()
            VStack(spacing: 8) {
                Text("No boards").font(.custom(Theme.fontMedium, size: 15)).foregroundColor(Theme.faint)
                Text("Tap + to create one").font(.custom(Theme.fontName, size: 13)).foregroundColor(Theme.ghost)
            }
            Spacer()
        }
    }

    private var list: some View {
        List {
            if adding {
                TextField("Board name", text: $name).font(.custom(Theme.fontName, size: 16)).foregroundColor(Theme.active)
                    .onSubmit { submit() }
                    .listRowBackground(Theme.bg).listRowSeparator(.hidden)
                    .listRowInsets(EdgeInsets(top: 14, leading: 20, bottom: 14, trailing: 20))
            }
            ForEach(sortedBoards) { board in
                BoardRow(board: board) { store.selectedId = board.id; path.append(board.id) }
                    .listRowBackground(Theme.bg).listRowSeparatorTint(Theme.border)
                    .listRowInsets(EdgeInsets(top: 0, leading: 20, bottom: 0, trailing: 0))
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) { deleting = board } label: { Label("Delete", systemImage: "trash") }
                        Button { renameText = board.name; renaming = board.id } label: { Label("Rename", systemImage: "pencil") }.tint(Theme.muted)
                    }
                    .swipeActions(edge: .leading) {
                        Button { Task { await store.togglePin(board.id) } } label: {
                            Label(board.pinned ? "Unpin" : "Pin", systemImage: board.pinned ? "pin.slash.fill" : "pin.fill")
                        }.tint(Theme.muted)
                    }
            }
        }
        .listStyle(.plain).scrollContentBackground(.hidden).background(Theme.bg)
    }

    private func submit() {
        guard !name.isEmpty else { return }
        let n = name; name = ""; adding = false
        Task { await store.createBoard(name: n); if let id = store.selectedId { path.append(id) } }
    }
}

private struct BoardRow: View {
    let board: Board
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 6) {
                if board.pinned { Image(systemName: "pin.fill").font(.system(size: 10)).foregroundColor(Theme.faint) }
                Text(board.name).font(.custom(Theme.fontMedium, size: 16)).foregroundColor(Theme.text).lineLimit(1)
                Spacer()
            }
            .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 20).padding(.vertical, 16)
            .contentShape(Rectangle())
        }.buttonStyle(.plain)
    }
}
