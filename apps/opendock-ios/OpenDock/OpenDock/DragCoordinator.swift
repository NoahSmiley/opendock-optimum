import SwiftUI
import Combine

@MainActor
final class DragCoordinator: ObservableObject {
    struct Active: Equatable { let cardId: UUID; let title: String; let fromColumn: UUID; let width: CGFloat }
    @Published var active: Active?
    @Published var targetColumn: UUID?
    @Published var targetBefore: UUID?
    let locationSubject = CurrentValueSubject<CGPoint, Never>(.zero)
    var cardFrames: [UUID: CGRect] = [:]
    var columnFrames: [UUID: CGRect] = [:]
    var cardColumn: [UUID: UUID] = [:]
    private var location: CGPoint { locationSubject.value }

    func start(card: UUID, title: String, fromColumn: UUID, at point: CGPoint, width: CGFloat) {
        locationSubject.send(point)
        active = Active(cardId: card, title: title, fromColumn: fromColumn, width: width)
        recomputeTarget()
    }

    func update(location point: CGPoint) {
        locationSubject.send(point)
        let oldCol = targetColumn, oldBefore = targetBefore
        recomputeTarget()
        if oldCol == targetColumn && oldBefore == targetBefore { return }
    }

    func end() -> (card: UUID, column: UUID, before: UUID?)? {
        guard let a = active, let col = targetColumn else { cancel(); return nil }
        return (card: a.cardId, column: col, before: targetBefore)
    }

    func finish() { active = nil; targetColumn = nil; targetBefore = nil }
    func cancel() { finish() }

    private func recomputeTarget() {
        guard let a = active else { targetColumn = nil; targetBefore = nil; return }
        let col = columnFrames.first { $0.value.contains(location) }?.key
        let siblings = col.map { c in cardFrames.filter { cardColumn[$0.key] == c && $0.key != a.cardId }.sorted { $0.value.minY < $1.value.minY } } ?? []
        let before = siblings.first { location.y < $0.value.midY }?.key
        if targetColumn != col { targetColumn = col }
        if targetBefore != before { targetBefore = before }
    }
}
