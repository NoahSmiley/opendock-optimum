import SwiftUI

struct NoteListView: View {
    @EnvironmentObject var store: NotesStore
    @Binding var path: NavigationPath
    @Binding var showNewNote: Bool

    var body: some View {
        VStack(spacing: 0) {
            // Custom header
            HStack {
                Text("Notes")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(Theme.active)
                Spacer()
                Text("\(store.filtered.count)")
                    .font(.system(size: 13))
                    .foregroundColor(Theme.ghost)
                Button { showNewNote = true } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 18))
                        .foregroundColor(Theme.muted)
                }
                .padding(.leading, 8)
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 12)

            // Search
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 14))
                    .foregroundColor(Theme.ghost)
                TextField("Search", text: $store.searchQuery)
                    .font(.system(size: 15))
                    .foregroundColor(Theme.text)
                if !store.searchQuery.isEmpty {
                    Button { store.searchQuery = "" } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 14))
                            .foregroundColor(Theme.ghost)
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Theme.input)
            .cornerRadius(10)
            .padding(.horizontal, 16)
            .padding(.bottom, 8)

            // Notes list
            if store.filtered.isEmpty {
                Spacer()
                VStack(spacing: 8) {
                    Text("No notes")
                        .font(.system(size: 15))
                        .foregroundColor(Theme.faint)
                    Text("Tap + to create one")
                        .font(.system(size: 13))
                        .foregroundColor(Theme.ghost)
                }
                Spacer()
            } else {
                List {
                    ForEach(store.filtered) { note in
                        Button {
                            store.selectedId = note.id
                            path.append(note.id)
                        } label: {
                            NoteRow(note: note)
                        }
                        .listRowBackground(Theme.bg)
                        .listRowSeparatorTint(Theme.border)
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) { store.delete(note.id) } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                        .swipeActions(edge: .leading) {
                            Button { store.togglePin(note.id) } label: {
                                Label(note.pinned ? "Unpin" : "Pin", systemImage: note.pinned ? "pin.slash" : "pin")
                            }
                            .tint(Theme.faint)
                        }
                        .contextMenu {
                            Button { store.togglePin(note.id) } label: {
                                Label(note.pinned ? "Unpin" : "Pin", systemImage: note.pinned ? "pin.slash" : "pin")
                            }
                            Button { store.duplicate(note.id) } label: {
                                Label("Duplicate", systemImage: "doc.on.doc")
                            }
                            Divider()
                            Button(role: .destructive) { store.delete(note.id) } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .background(Theme.bg)
        .navigationBarHidden(true)
    }
}

struct NoteRow: View {
    let note: Note

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 6) {
                if note.pinned {
                    Image(systemName: "pin.fill")
                        .font(.system(size: 8))
                        .foregroundColor(Theme.faint)
                }
                Text(note.title.isEmpty ? "Untitled" : note.title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(Theme.text)
                    .lineLimit(1)
            }

            HStack(spacing: 8) {
                Text(note.timeAgo)
                Text("\(note.wordCount)w")
            }
            .font(.system(size: 12))
            .foregroundColor(Theme.faint)

            if !note.preview.isEmpty {
                Text(note.preview)
                    .font(.system(size: 13))
                    .foregroundColor(Theme.faint)
                    .lineLimit(1)
            }
        }
        .padding(.vertical, 6)
    }
}
