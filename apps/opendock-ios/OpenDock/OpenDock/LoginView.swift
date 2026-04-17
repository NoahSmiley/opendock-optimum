import SwiftUI

struct LoginView: View {
    @EnvironmentObject var auth: AuthStore

    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            Text("OpenDock").font(.custom(Theme.fontSemibold, size: 22)).foregroundColor(Theme.active)
            Text(auth.pending ? "Waiting for you to sign in at athion.me..." : "Sign in with your Athion account to continue.")
                .font(.custom(Theme.fontName, size: 13))
                .foregroundColor(Theme.muted)
                .multilineTextAlignment(.center)
                .padding(.top, 8).padding(.horizontal, 32)
            if let e = auth.error {
                Text(e).font(.custom(Theme.fontName, size: 12)).foregroundColor(Theme.error).padding(.top, 12)
            }
            Button(action: { Task { await auth.startLogin() } }) {
                Text(auth.pending ? "Waiting..." : "Sign in")
                    .font(.custom(Theme.fontSemibold, size: 13))
                    .foregroundColor(auth.pending ? Theme.faint : Theme.active)
                    .frame(width: 220).padding(.vertical, 10)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.borderStrong, lineWidth: 0.5))
            }
            .disabled(auth.pending)
            .padding(.top, 20)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.bg).ignoresSafeArea()
    }
}
