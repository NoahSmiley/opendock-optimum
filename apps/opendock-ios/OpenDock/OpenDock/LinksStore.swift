import Foundation

@MainActor
final class LinksStore: ObservableObject {
    @Published private(set) var cache: [EntityRef: [LinkedEntity]] = [:]

    func links(for kind: EntityKind, id: UUID) -> [LinkedEntity] {
        cache[EntityRef(kind: kind, id: id)] ?? []
    }

    func ensure(_ kind: EntityKind, _ id: UUID) async {
        let ref = EntityRef(kind: kind, id: id)
        if cache[ref] != nil { return }
        do { cache[ref] = try await LinksAPI.list(kind, id) }
        catch { cache[ref] = [] }
    }

    func refresh(_ kind: EntityKind, _ id: UUID) async {
        let ref = EntityRef(kind: kind, id: id)
        guard cache[ref] != nil else { return }
        do { cache[ref] = try await LinksAPI.list(kind, id) }
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

    func clear() { cache = [:] }
}
