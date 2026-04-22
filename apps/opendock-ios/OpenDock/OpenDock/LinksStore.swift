import Foundation

@MainActor
final class LinksStore: ObservableObject {
    @Published private(set) var cache: [EntityRef: [LinkedEntity]] = [:]
    /// Anchors we've confirmed a successful fetch for. Kept separate from
    /// `cache` so that a failed first fetch (network error, auth race)
    /// doesn't poison the cache with `[]` and short-circuit future attempts.
    private var loaded: Set<EntityRef> = []

    func links(for kind: EntityKind, id: UUID) -> [LinkedEntity] {
        cache[EntityRef(kind: kind, id: id)] ?? []
    }

    func ensure(_ kind: EntityKind, _ id: UUID) async {
        let ref = EntityRef(kind: kind, id: id)
        if loaded.contains(ref) { return }
        do { cache[ref] = try await LinksAPI.list(kind, id); loaded.insert(ref) }
        catch { /* try again next time */ }
    }

    func refresh(_ kind: EntityKind, _ id: UUID) async {
        let ref = EntityRef(kind: kind, id: id)
        do { cache[ref] = try await LinksAPI.list(kind, id); loaded.insert(ref) }
        catch { /* leave stale */ }
    }

    func attach(_ a: EntityRef, _ b: EntityRef) async throws {
        try await LinksAPI.attach(a, b)
        await refresh(a.kind, a.id)
        await refresh(b.kind, b.id)
    }

    func detach(_ anchor: EntityRef, _ other: LinkedEntity) async throws {
        let b = EntityRef(kind: other.kind, id: other.id)
        try await LinksAPI.detach(anchor, b)
        await refresh(anchor.kind, anchor.id)
        await refresh(b.kind, b.id)
    }

    func apply(event: LiveEvent) {
        if case .entityLinkChanged(let a, let b, _, _) = event {
            Task { await refresh(a.kind, a.id); await refresh(b.kind, b.id) }
        }
    }

    func clear() { cache = [:]; loaded = [] }
}
