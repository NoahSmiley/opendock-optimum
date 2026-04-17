import SwiftUI

struct MemberRowView: View {
    let email: String
    let displayName: String?
    let role: String
    let canRemove: Bool
    let onRemove: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(displayName ?? email).font(.custom(Theme.fontMedium, size: 14)).foregroundColor(Theme.text)
                Text("\(email) · \(role)").font(.custom(Theme.fontName, size: 12)).foregroundColor(Theme.faint)
            }
            Spacer()
            if canRemove {
                Button { onRemove() } label: { Image(systemName: "xmark.circle.fill").foregroundColor(Theme.muted) }.buttonStyle(.plain)
            }
        }
    }
}
