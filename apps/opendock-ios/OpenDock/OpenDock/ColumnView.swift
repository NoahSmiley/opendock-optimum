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

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                Text(col.title.uppercased()).font(.custom(Theme.fontSemibold, size: 11)).foregroundColor(Theme.muted).tracking(0.6)
                Text("\(cards.count)").font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.ghost)
                Spacer()
                Button(action: onAdd) { Image(systemName: "plus").font(.system(size: 13, weight: .light)).foregroundColor(Theme.faint) }
            }
            .padding(.horizontal, 16).padding(.vertical, 14)
            Rectangle().fill(Theme.border).frame(height: 0.5)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 6) {
                    if adding {
                        TextField("New card", text: $newCardTitle).font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text)
                            .padding(12).background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.borderStrong, lineWidth: 0.5))
                            .onSubmit(onSubmit).submitLabel(.done)
                            .toolbar { ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("Cancel", action: onCancel); Button("Add", action: onSubmit).bold() } }
                    }
                    ForEach(cards) { card in
                        HStack { Text(card.title).font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text).multilineTextAlignment(.leading); Spacer() }
                            .padding(.horizontal, 14).padding(.vertical, 12)
                            .background(RoundedRectangle(cornerRadius: 8).fill(Theme.elevated))
                            .contentShape(Rectangle()).onTapGesture { onOpen(card.id) }
                            .draggable(card.id.uuidString) {
                                Text(card.title).font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text)
                                    .padding(.horizontal, 14).padding(.vertical, 12)
                                    .background(RoundedRectangle(cornerRadius: 8).fill(Theme.elevated))
                                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.borderStrong, lineWidth: 0.5))
                            }
                    }
                    if cards.isEmpty && !adding {
                        Rectangle().fill(Color.clear).frame(height: 100).overlay(
                            Text("Drop here").font(.custom(Theme.fontName, size: 12))
                                .foregroundColor(isTargeted ? Theme.muted : Theme.ghost)
                        )
                    }
                    Color.clear.frame(minHeight: 60)
                }
                .padding(.horizontal, 12).padding(.top, 12).padding(.bottom, 16)
                .frame(maxWidth: .infinity, minHeight: 400, alignment: .top)
            }
            .dropDestination(for: String.self) { ids, _ in
                guard let s = ids.first, let cid = UUID(uuidString: s) else { return false }
                Task { await store.moveCard(boardId: boardId, cardId: cid, to: col.id) }; return true
            } isTargeted: { isTargeted = $0 }
        }
        .frame(width: 300).frame(maxHeight: .infinity, alignment: .top)
        .background(isTargeted ? Theme.elevated : Color.clear)
        .overlay(Rectangle().frame(width: 0.5).foregroundColor(Theme.border), alignment: .trailing)
    }
}
