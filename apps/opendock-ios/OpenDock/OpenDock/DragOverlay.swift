import SwiftUI

struct DragOverlay: View {
    @ObservedObject var coord: DragCoordinator
    var body: some View {
        if let a = coord.active {
            HStack(spacing: 8) {
                Text(a.title).font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text).multilineTextAlignment(.leading)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 14).padding(.vertical, 12)
            .frame(width: a.width)
            .background(RoundedRectangle(cornerRadius: 8).fill(Theme.elevated))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.active.opacity(0.5), lineWidth: 1))
            .shadow(color: .black.opacity(0.7), radius: 14, x: 0, y: 6)
            .scaleEffect(1.03)
            .position(x: coord.location.x, y: coord.location.y)
            .allowsHitTesting(false)
            .transition(.scale(scale: 0.9).combined(with: .opacity))
        }
    }
}
