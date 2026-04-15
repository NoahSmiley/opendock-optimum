import SwiftUI

struct BoardsListView: View {
    @EnvironmentObject var store: BoardsStore
    @Binding var path: NavigationPath
    @State private var adding = false
    @State private var name = ""

    var body: some View {
        VStack(spacing: 0) {
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("OpenDock").font(.custom(Theme.fontMedium, size: 13)).foregroundColor(Theme.faint).tracking(0.5)
                    Text("Boards").font(.custom(Theme.fontSemibold, size: 28)).foregroundColor(Theme.active)
                }
                Spacer()
                Button { adding = true } label: { Image(systemName: "plus").font(.system(size: 22, weight: .light)).foregroundColor(Theme.muted) }.padding(.bottom, 4)
            }
            .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 16)

            Rectangle().fill(Theme.border).frame(height: 0.5)

            if store.boards.isEmpty && !adding {
                Spacer()
                VStack(spacing: 8) {
                    Text("No boards").font(.custom(Theme.fontMedium, size: 15)).foregroundColor(Theme.faint)
                    Text("Tap + to create one").font(.custom(Theme.fontName, size: 13)).foregroundColor(Theme.ghost)
                }
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        if adding {
                            TextField("Board name", text: $name).font(.custom(Theme.fontName, size: 16)).foregroundColor(Theme.active)
                                .padding(.horizontal, 20).padding(.vertical, 14)
                                .onSubmit { if !name.isEmpty { store.createBoard(name: name); name = ""; adding = false; if let id = store.selectedId { path.append(id) } } }
                        }
                        ForEach(store.boards) { board in
                            Button { store.selectedId = board.id; path.append(board.id) } label: {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(board.name).font(.custom(Theme.fontMedium, size: 16)).foregroundColor(Theme.text).lineLimit(1)
                                    Text("\(board.cards.count) cards").font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.faint)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 20).padding(.vertical, 14)
                            }
                            .contextMenu {
                                Button(role: .destructive) { store.deleteBoard(board.id) } label: { Label("Delete", systemImage: "trash") }
                            }
                            Rectangle().fill(Theme.border).frame(height: 0.5).padding(.horizontal, 20)
                        }
                    }
                }
            }
        }
        .background(Theme.bg).navigationBarHidden(true)
    }
}
