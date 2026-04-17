import SwiftUI

struct NoteRow: View {
    let note: Note

    var body: some View {
        let preview = NoteFormat.preview(note.content)
        return VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                if note.pinned {
                    Image(systemName: "pin.fill").font(.system(size: 8)).foregroundColor(Theme.faint)
                }
                Text(note.title.isEmpty ? "Untitled" : note.title)
                    .font(.custom(Theme.fontMedium, size: 16)).foregroundColor(Theme.text).lineLimit(1)
            }
            HStack(spacing: 8) {
                Text(NoteFormat.timeAgo(note.updatedAt)); Text("\(NoteFormat.wordCount(note.content))w")
            }
            .font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.faint)

            if !preview.isEmpty {
                Text(preview).font(.custom(Theme.fontName, size: 13)).foregroundColor(Theme.faint).lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20).padding(.vertical, 14)
    }
}
