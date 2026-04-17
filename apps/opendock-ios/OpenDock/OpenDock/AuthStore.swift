import Foundation
import UIKit

@MainActor
class AuthStore: ObservableObject {
    @Published private(set) var token: String?
    @Published private(set) var userId: UUID?
    @Published private(set) var email: String?
    @Published private(set) var displayName: String?
    @Published private(set) var loading = true
    @Published var pending = false
    @Published var error: String?

    var isAuthed: Bool { token != nil }

    func refresh() async {
        loading = true
        if let saved = KeychainService.load() {
            do {
                let me = try await AuthService.fetchMe(token: saved)
                apply(token: saved, me: me)
            } catch {
                KeychainService.clear(); clear()
            }
        }
        loading = false
    }

    func startLogin() async {
        pending = true; error = nil
        do {
            let (code, url) = try await AuthService.initiate()
            await MainActor.run { UIApplication.shared.open(url) }
            while pending {
                let result = try await AuthService.poll(code: code)
                if result.status == "complete", let token = result.token {
                    KeychainService.store(token)
                    let me = try await AuthService.fetchMe(token: token)
                    apply(token: token, me: me); pending = false; return
                }
                if result.status == "expired" { throw NSError(domain: "auth", code: 1, userInfo: [NSLocalizedDescriptionKey: "Login link expired"]) }
                try await Task.sleep(nanoseconds: 1_500_000_000)
            }
        } catch { self.error = error.localizedDescription; pending = false }
    }

    func logout() { KeychainService.clear(); clear() }

    private func apply(token: String, me: MeResponse) {
        self.token = token; self.userId = me.id; self.email = me.email; self.displayName = me.displayName
    }
    private func clear() { token = nil; userId = nil; email = nil; displayName = nil }
}
