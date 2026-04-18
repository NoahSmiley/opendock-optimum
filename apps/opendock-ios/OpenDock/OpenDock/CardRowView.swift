import SwiftUI

struct CardRowView: View {
    @EnvironmentObject var coord: DragCoordinator
    let card: Card
    let columnId: UUID
    let members: [BoardMember]
    let onOpen: (UUID) -> Void

    var body: some View {
        let beingDragged = coord.active?.cardId == card.id
        HStack(spacing: 8) {
            Text(card.title).font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text).multilineTextAlignment(.leading)
            Spacer()
            if let a = card.assigneeId, let m = members.first(where: { $0.userId == a }) {
                AssigneeBadge(label: (m.displayName ?? m.email).prefix(1).uppercased())
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.borderStrong, lineWidth: 0.5))
        .frame(height: beingDragged ? 0 : nil, alignment: .top)
        .opacity(beingDragged ? 0 : 1)
        .clipped()
        .background(GeometryReader { geo in
            Color.clear
                .preference(key: CardFramesKey.self, value: [card.id: geo.frame(in: .named("board"))])
                .onAppear { coord.cardColumn[card.id] = columnId }
                .onChange(of: columnId) { _, new in coord.cardColumn[card.id] = new }
        })
        .contentShape(Rectangle())
        .onTapGesture { if coord.active == nil { onOpen(card.id) } }
        .gesture(dragGesture())
    }

    private func dragGesture() -> some Gesture {
        LongPressGesture(minimumDuration: 0.22)
            .sequenced(before: DragGesture(minimumDistance: 0, coordinateSpace: .named("board")))
            .onChanged { value in
                switch value {
                case .second(true, let drag?):
                    if coord.active == nil {
                        let frame = coord.cardFrames[card.id] ?? .zero
                        coord.start(card: card.id, title: card.title, fromColumn: columnId,
                                    at: drag.location, width: max(frame.width, 240))
                    } else {
                        coord.update(location: drag.location)
                    }
                default: break
                }
            }
            .onEnded { _ in commitDrop() }
    }

    private func commitDrop() {
        guard let result = coord.end() else { return }
        NotificationCenter.default.post(name: .opendockCardDrop, object: nil, userInfo: [
            "cardId": result.card, "columnId": result.column, "beforeId": result.before as Any
        ])
    }
}

extension Notification.Name { static let opendockCardDrop = Notification.Name("opendock.card.drop") }
