import SwiftUI

struct Placeholder: View {
    let name: String
    init(_ name: String) { self.name = name }
    var body: some View {
        ZStack { Theme.bg.ignoresSafeArea(); Text("\(name) — coming soon").font(.custom(Theme.fontName, size: 13)).foregroundColor(Theme.ghost) }
    }
}
