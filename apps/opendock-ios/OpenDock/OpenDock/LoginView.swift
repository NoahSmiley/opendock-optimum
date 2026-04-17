import SwiftUI

struct LoginView: View {
    @EnvironmentObject var auth: AuthStore
    @State private var email = ""
    @State private var password = ""

    var canSubmit: Bool { !email.trimmingCharacters(in: .whitespaces).isEmpty && !password.isEmpty && !auth.pending }

    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            Text("OpenDock").font(.custom(Theme.fontSemibold, size: 22)).foregroundColor(Theme.active)
            Text("Sign in with your Athion account.")
                .font(.custom(Theme.fontName, size: 13)).foregroundColor(Theme.muted)
                .padding(.top, 8).padding(.bottom, 24)

            VStack(spacing: 10) {
                TextField("", text: $email, prompt: Text("Email").foregroundColor(Theme.ghost))
                    .textContentType(.emailAddress).keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never).autocorrectionDisabled()
                    .font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text)
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.borderStrong, lineWidth: 0.5))

                SecureField("", text: $password, prompt: Text("Password").foregroundColor(Theme.ghost))
                    .textContentType(.password)
                    .font(.custom(Theme.fontName, size: 14)).foregroundColor(Theme.text)
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.borderStrong, lineWidth: 0.5))
            }
            .frame(maxWidth: 320).padding(.horizontal, 32)

            if let e = auth.error {
                Text(e).font(.custom(Theme.fontName, size: 12)).foregroundColor(Theme.error).padding(.top, 12).padding(.horizontal, 32).multilineTextAlignment(.center)
            }

            Button(action: { Task { await auth.login(email: email.trimmingCharacters(in: .whitespaces), password: password) } }) {
                Text(auth.pending ? "Signing in..." : "Sign in")
                    .font(.custom(Theme.fontSemibold, size: 13))
                    .foregroundColor(canSubmit ? Theme.active : Theme.faint)
                    .frame(maxWidth: 320).padding(.vertical, 12)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Theme.input))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.borderStrong, lineWidth: 0.5))
            }
            .disabled(!canSubmit).padding(.horizontal, 32).padding(.top, 16)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.bg).ignoresSafeArea(.container, edges: .bottom)
    }
}
