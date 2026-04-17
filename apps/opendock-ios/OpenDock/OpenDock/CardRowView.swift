import SwiftUI

struct CardRowView: View {
    let card: Card
    let members: [BoardMember]
    let onOpen: (UUID) -> Void

    var body: some View {
        HStack(spacing: 8) {
            Text(card.title).font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text).multilineTextAlignment(.leading)
            Spacer()
            if let a = card.assigneeId, let m = members.first(where: { $0.userId == a }) {
                AssigneeBadge(label: (m.displayName ?? m.email).prefix(1).uppercased())
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
        .contentShape(Rectangle()).onTapGesture { onOpen(card.id) }
        .draggable(card.id.uuidString) {
            Text(card.title).font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text)
                .padding(.horizontal, 14).padding(.vertical, 12)
                .background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.borderStrong, lineWidth: 0.5))
        }
    }
}
