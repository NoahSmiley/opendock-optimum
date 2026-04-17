import SwiftUI

struct NoteListView: View {
    @EnvironmentObject var store: NotesStore
    @Binding var path: NavigationPath
    let onCreateNew: () -> Void
    @State private var deleting: Note?

    var body: some View {
        VStack(spacing: 0) {
            header
            searchBar
            Rectangle().fill(Theme.border).frame(height: 0.5)
            if store.filtered.isEmpty { emptyState } else { list }
        }
        .background(Theme.bg).navigationBarHidden(true)
        .alert("Delete note?", isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } })) {
            Button("Cancel", role: .cancel) { deleting = nil }
            Button("Delete", role: .destructive) { if let d = deleting { Task { await store.delete(d.id) } }; deleting = nil }
        } message: { Text("\"\(deleting?.title.isEmpty == false ? deleting!.title : "Untitled")\" will be permanently deleted.") }
    }

    private var header: some View {
        HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 4) {
                Text("OpenDock").font(.custom(Theme.fontMedium, size: 13)).foregroundColor(Theme.faint).tracking(0.5)
                Text("Notes").font(.custom(Theme.fontSemibold, size: 28)).foregroundColor(Theme.active)
            }
            Spacer()
            Button { onCreateNew() } label: { Image(systemName: "plus").font(.system(size: 22, weight: .light)).foregroundColor(Theme.muted) }.padding(.bottom, 4)
        }
        .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 16)
    }

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").font(.system(size: 14)).foregroundColor(Theme.ghost)
            TextField("Search", text: $store.searchQuery).font(.custom(Theme.fontName, size: 15)).foregroundColor(Theme.text)
            if !store.searchQuery.isEmpty {
                Button { store.searchQuery = "" } label: { Image(systemName: "xmark.circle.fill").font(.system(size: 14)).foregroundColor(Theme.ghost) }
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 11).background(Theme.input).cornerRadius(10).padding(.horizontal, 16).padding(.bottom, 12)
    }

    private var emptyState: some View {
        VStack {
            Spacer()
            VStack(spacing: 8) {
                Text("No notes").font(.custom(Theme.fontMedium, size: 15)).foregroundColor(Theme.faint)
                Text("Tap + to create one").font(.custom(Theme.fontName, size: 13)).foregroundColor(Theme.ghost)
            }
            Spacer()
        }
    }

    private var list: some View {
        List {
            ForEach(store.filtered) { note in
                Button { store.selectedId = note.id; path.append(note.id) } label: { NoteRow(note: note) }
                    .buttonStyle(.plain)
                    .listRowBackground(Theme.bg).listRowSeparatorTint(Theme.border)
                    .listRowInsets(EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 0))
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) { deleting = note } label: { Label("Delete", systemImage: "trash") }
                        Button { Task { await store.duplicate(note.id) } } label: { Label("Duplicate", systemImage: "doc.on.doc") }.tint(Theme.muted)
                    }
                    .swipeActions(edge: .leading) {
                        Button { Task { await store.togglePin(note.id) } } label: {
                            Label(note.pinned ? "Unpin" : "Pin", systemImage: note.pinned ? "pin.slash.fill" : "pin.fill")
                        }.tint(Theme.muted)
                    }
            }
        }
        .listStyle(.plain).scrollContentBackground(.hidden).background(Theme.bg)
    }
}
