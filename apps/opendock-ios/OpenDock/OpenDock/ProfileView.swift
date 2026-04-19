import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var auth: AuthStore
    @State private var confirmingLogout = false

    var body: some View {
        let label = auth.displayName ?? auth.email ?? ""
        let initial = label.prefix(1).uppercased()
        VStack(spacing: 0) {
            Text("Profile").font(.custom(Theme.fontSemibold, size: 28)).foregroundColor(Theme.active)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 16)

            HStack(spacing: 14) {
                Text(initial).font(.custom(Theme.fontSemibold, size: 18)).foregroundColor(Theme.active)
                    .frame(width: 48, height: 48)
                    .background(Circle().fill(Theme.input))
                    .overlay(Circle().stroke(Theme.borderStrong, lineWidth: 0.5))
                VStack(alignment: .leading, spacing: 4) {
                    Text(auth.displayName ?? "—").font(.custom(Theme.fontMedium, size: 15)).foregroundColor(Theme.text)
                    if let email = auth.email { Text(email).font(.custom(Theme.fontName, size: 12)).foregroundColor(Theme.faint) }
                }
                Spacer()
            }
            .padding(.horizontal, 20).padding(.top, 16).padding(.bottom, 24)

            Button { confirmingLogout = true } label: {
                Text("Sign out").font(.custom(Theme.fontMedium, size: 14)).foregroundColor(Theme.error)
                    .frame(maxWidth: .infinity).padding(.vertical, 14)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Theme.elevated))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.borderStrong, lineWidth: 0.5))
            }
            .padding(.horizontal, 20)

            Spacer()
        }
        .background(Theme.bg).navigationBarHidden(true)
        .alert("Sign out?", isPresented: $confirmingLogout) {
            Button("Cancel", role: .cancel) {}
            Button("Sign out", role: .destructive) { auth.logout() }
        } message: { Text("You'll need to sign in with Athion again to access your data.") }
    }
}
