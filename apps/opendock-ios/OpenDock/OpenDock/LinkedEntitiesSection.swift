import SwiftUI

struct LinkedEntitiesSection: View {
    @EnvironmentObject var links: LinksStore
    let anchor: EntityRef
    let label: String
    let pickKind: EntityKind
    @State private var picking = false
    @State private var error: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label.uppercased())
                    .font(.custom(Theme.fontSemibold, size: 11)).tracking(0.5)
                    .foregroundColor(Theme.muted)
                Spacer()
                Button { picking = true } label: {
                    Label("Link", systemImage: "plus").font(.system(size: 12))
                        .foregroundColor(Theme.ghost).labelStyle(.titleAndIcon)
                }
            }
            let rows = links.links(for: anchor.kind, id: anchor.id)
            if rows.isEmpty {
                Text("None linked yet.").font(.custom(Theme.fontName, size: 12)).foregroundColor(Theme.ghost)
            } else {
                VStack(spacing: 4) {
                    ForEach(rows) { row in LinkedRow(anchor: anchor, link: row) }
                }
            }
            if let e = error {
                Text(e).font(.custom(Theme.fontName, size: 11)).foregroundColor(.red)
            }
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 0.5))
        .padding(.horizontal, 16).padding(.vertical, 8)
        .task(id: anchor.id) { await links.ensure(anchor.kind, anchor.id) }
        .sheet(isPresented: $picking) {
            LinkPickerSheet(anchor: anchor, pickKind: pickKind,
                existing: Set(links.links(for: anchor.kind, id: anchor.id).map { $0.id })) { other in
                Task {
                    do { try await links.attach(anchor, other); picking = false }
                    catch let err { error = "\(err)"; picking = false }
                }
            }
        }
    }
}

private struct LinkedRow: View {
    @EnvironmentObject var links: LinksStore
    let anchor: EntityRef
    let link: LinkedEntity

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: link.kind == .note ? "note.text" : "rectangle.on.rectangle")
                .font(.system(size: 11)).foregroundColor(Theme.ghost)
            Text(link.title.isEmpty ? "Untitled" : link.title)
                .font(.custom(Theme.fontName, size: 13)).foregroundColor(Theme.text)
                .lineLimit(1)
            if let ctx = link.context {
                Text(ctx).font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.ghost)
                    .lineLimit(1)
            }
            Spacer()
            Button {
                Task { try? await links.detach(anchor, link) }
            } label: { Image(systemName: "xmark").font(.system(size: 11)).foregroundColor(Theme.ghost) }
        }
        .padding(.horizontal, 8).padding(.vertical, 6)
        .background(RoundedRectangle(cornerRadius: 6).fill(Theme.elevated))
    }
}
