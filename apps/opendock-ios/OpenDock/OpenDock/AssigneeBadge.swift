import SwiftUI

struct AssigneeBadge: View {
    let label: String

    var body: some View {
        Text(label)
            .font(.custom(Theme.fontSemibold, size: 10)).foregroundColor(Theme.text)
            .frame(width: 20, height: 20)
            .background(Circle().fill(Theme.input).overlay(Circle().stroke(Theme.borderStrong, lineWidth: 0.5)))
    }
}
