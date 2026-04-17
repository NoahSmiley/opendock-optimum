import SwiftUI

struct BoardRow: View {
    let board: Board
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 6) {
                if board.pinned { Image(systemName: "pin.fill").font(.system(size: 10)).foregroundColor(Theme.faint) }
                Text(board.name).font(.custom(Theme.fontMedium, size: 16)).foregroundColor(Theme.text).lineLimit(1)
                Spacer()
            }
            .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 20).padding(.vertical, 16)
            .contentShape(Rectangle())
        }.buttonStyle(.plain)
    }
}
