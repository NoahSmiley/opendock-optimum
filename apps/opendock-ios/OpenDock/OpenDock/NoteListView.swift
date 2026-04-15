import SwiftUI

struct NoteListView: View {
    @EnvironmentObject var store: NotesStore
    @Binding var path: NavigationPath
    @Binding var showNewNote: Bool

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("OpenDock")
                        .font(.custom(Theme.fontMedium, size: 13))
                        .foregroundColor(Theme.faint)
                        .tracking(0.5)
                    Text("Notes")
                        .font(.custom(Theme.fontSemibold, size: 28))
                        .foregroundColor(Theme.active)
                }
                Spacer()
                Button { showNewNote = true } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 22, weight: .light))
                        .foregroundColor(Theme.muted)
                }
                .padding(.bottom, 4)
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 16)

            // Search
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 14))
                    .foregroundColor(Theme.ghost)
                TextField("Search", text: $store.searchQuery)
                    .font(.custom(Theme.fontName, size: 15))
                    .foregroundColor(Theme.text)
                if !store.searchQuery.isEmpty {
                    Button { store.searchQuery = "" } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 14))
                            .foregroundColor(Theme.ghost)
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(Theme.input)
            .cornerRadius(10)
            .padding(.horizontal, 16)
            .padding(.bottom, 12)

            // Divider
            Rectangle().fill(Theme.border).frame(height: 0.5)

            // Notes list
            if store.filtered.isEmpty {
                Spacer()
                VStack(spacing: 8) {
                    Text("No notes")
                        .font(.custom(Theme.fontMedium, size: 15))
                        .foregroundColor(Theme.faint)
                    Text("Tap + to create one")
                        .font(.custom(Theme.fontName, size: 13))
                        .foregroundColor(Theme.ghost)
                }
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(store.filtered) { note in
                            Button {
                                store.selectedId = note.id
                                path.append(note.id)
                            } label: {
                                NoteRow(note: note)
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

                            Rectangle().fill(Theme.border).frame(height: 0.5)
                                .padding(.horizontal, 20)
                        }
                    }
                }
            }
        }
        .background(Theme.bg)
        .navigationBarHidden(true)
    }
}

struct NoteRow: View {
    let note: Note

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                if note.pinned {
                    Image(systemName: "pin.fill")
                        .font(.system(size: 8))
                        .foregroundColor(Theme.faint)
                }
                Text(note.title.isEmpty ? "Untitled" : note.title)
                    .font(.custom(Theme.fontMedium, size: 16))
                    .foregroundColor(Theme.text)
                    .lineLimit(1)
            }

            HStack(spacing: 8) {
                Text(note.timeAgo)
                Text("\(note.wordCount)w")
            }
            .font(.custom(Theme.fontName, size: 11))
            .foregroundColor(Theme.faint)

            if !note.preview.isEmpty {
                Text(note.preview)
                    .font(.custom(Theme.fontName, size: 13))
                    .foregroundColor(Theme.faint)
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
    }
}
