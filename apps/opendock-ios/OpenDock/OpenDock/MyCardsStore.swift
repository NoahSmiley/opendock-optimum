import Foundation

struct MyCard: Decodable, Identifiable {
    let id: UUID
    let boardId: UUID
    let boardName: String
    let columnTitle: String
    let title: String
}

@MainActor
final class MyCardsStore: ObservableObject {
    @Published private(set) var cards: [MyCard] = []
    @Published private(set) var loaded = false

    /// Fetch once on demand.
    func ensure() async {
        if loaded { return }
        await refresh()
    }

    /// Force-refetch — e.g. after a remote card upsert/delete.
    func refresh() async {
        do { cards = try await APIClient.shared.get("me/cards"); loaded = true }
        catch { /* leave previous cards in place */ }
    }

    func apply(event: LiveEvent) {
        switch event {
        case .cardUpserted, .cardDeleted: Task { await refresh() }
        default: break
        }
    }

    func clear() { cards = []; loaded = false }
}
