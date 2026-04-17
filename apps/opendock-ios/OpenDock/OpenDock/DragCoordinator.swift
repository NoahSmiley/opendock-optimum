import SwiftUI

@MainActor
final class DragCoordinator: ObservableObject {
    struct Active { let cardId: UUID; let title: String; let fromColumn: UUID; let width: CGFloat }
    @Published var active: Active?
    @Published var location: CGPoint = .zero
    @Published var targetColumn: UUID?
    @Published var targetBefore: UUID?
    var cardFrames: [UUID: CGRect] = [:]
    var columnFrames: [UUID: CGRect] = [:]
    var cardColumn: [UUID: UUID] = [:]

    func start(card: UUID, title: String, fromColumn: UUID, at point: CGPoint, width: CGFloat) {
        active = Active(cardId: card, title: title, fromColumn: fromColumn, width: width)
        location = point
        recomputeTarget()
    }

    func update(location point: CGPoint) {
        location = point
        recomputeTarget()
    }

    func end() -> (card: UUID, column: UUID, before: UUID?)? {
        guard let a = active, let col = targetColumn else { active = nil; targetColumn = nil; targetBefore = nil; return nil }
        let result = (card: a.cardId, column: col, before: targetBefore)
        active = nil; targetColumn = nil; targetBefore = nil
        return result
    }

    func cancel() { active = nil; targetColumn = nil; targetBefore = nil }

    private func recomputeTarget() {
        guard let a = active else { targetColumn = nil; targetBefore = nil; return }
        let col = columnFrames.first { $0.value.contains(location) }?.key
        targetColumn = col
        guard let col else { targetBefore = nil; return }
        let siblings = cardFrames.filter { cardColumn[$0.key] == col && $0.key != a.cardId }
        let before = siblings.first { $0.value.midY > location.y && location.y < $0.value.minY + $0.value.height / 2 + 20 }?.key
            ?? siblings.filter { location.y < $0.value.midY }.min(by: { $0.value.minY < $1.value.minY })?.key
        targetBefore = before
    }
}
