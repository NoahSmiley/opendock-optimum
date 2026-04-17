import SwiftUI

struct CardRowView: View {
    @EnvironmentObject var store: BoardsStore
    let card: Card
    let members: [BoardMember]
    let onOpen: (UUID) -> Void

    var body: some View {
        let dragging = store.draggingCardId == card.id
        HStack(spacing: 8) {
            Text(card.title).font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text).multilineTextAlignment(.leading)
            Spacer()
            if let a = card.assigneeId, let m = members.first(where: { $0.userId == a }) {
                AssigneeBadge(label: (m.displayName ?? m.email).prefix(1).uppercased())
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
        .opacity(dragging ? 0.35 : 1)
        .scaleEffect(dragging ? 0.97 : 1)
        .animation(.easeOut(duration: 0.15), value: dragging)
        .contentShape(Rectangle()).onTapGesture { onOpen(card.id) }
        .simultaneousGesture(LongPressGesture(minimumDuration: 0.18).onEnded { _ in
            withAnimation(.easeOut(duration: 0.15)) { store.draggingCardId = card.id }
            Task { try? await Task.sleep(nanoseconds: 4_000_000_000); await MainActor.run { if store.draggingCardId == card.id { withAnimation { store.draggingCardId = nil } } } }
        })
        .draggable(card.id.uuidString) {
            Text(card.title).font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text)
                .padding(.horizontal, 14).padding(.vertical, 12)
                .background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.borderStrong, lineWidth: 0.5))
        }
    }
}
