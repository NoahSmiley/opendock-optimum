import SwiftUI

struct LinkedEntitiesSection: View {
    @EnvironmentObject var links: LinksStore
    let anchor: EntityRef
    let label: String
    let pickKind: EntityKind
    @State private var picking = false
    @State private var expanded = false
    @State private var error: String?

    var body: some View {
        let rows = links.links(for: anchor.kind, id: anchor.id)
        VStack(alignment: .leading, spacing: 0) {
            Rectangle().fill(Theme.border).frame(height: 0.5)
            HStack(spacing: 6) {
                Button { expanded.toggle() } label: {
                    HStack(spacing: 6) {
                        Image(systemName: expanded ? "chevron.down" : "chevron.right")
                            .font(.system(size: 9)).foregroundColor(Theme.ghost)
                            .frame(width: 10)
                        Text(label.uppercased())
                            .font(.custom(Theme.fontSemibold, size: 10)).tracking(0.5)
                            .foregroundColor(Theme.muted)
                        Text("(\(rows.count))")
                            .font(.custom(Theme.fontName, size: 10)).foregroundColor(Theme.ghost)
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }.buttonStyle(.plain)
                Button { picking = true } label: {
                    Label("Link", systemImage: "plus").font(.system(size: 11))
                        .foregroundColor(Theme.ghost).labelStyle(.titleAndIcon)
                }
            }
            .padding(.vertical, 4)
            if expanded && !rows.isEmpty {
                VStack(spacing: 3) {
                    ForEach(rows) { row in LinkedRow(anchor: anchor, link: row) }
                }.padding(.bottom, 6)
            }
            if let e = error {
                Text(e).font(.custom(Theme.fontName, size: 11)).foregroundColor(.red).padding(.bottom, 6)
            }
        }
        .padding(.horizontal, 20)
        .task(id: anchor.id) {
            await links.ensure(anchor.kind, anchor.id)
            await links.refresh(anchor.kind, anchor.id)
        }
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
