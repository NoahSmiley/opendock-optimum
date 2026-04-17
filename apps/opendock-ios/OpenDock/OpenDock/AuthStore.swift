import Foundation

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
                apply(token: saved, id: me.id, email: me.email, displayName: me.displayName)
            } catch {
                KeychainService.clear(); clear()
            }
        }
        loading = false
    }

    func login(email: String, password: String) async {
        pending = true; error = nil
        do {
            let resp = try await AuthService.login(email: email, password: password)
            KeychainService.store(resp.token)
            apply(token: resp.token, id: resp.user.id, email: resp.user.email, displayName: resp.user.displayName)
        } catch let e as APIError { self.error = e.message }
        catch { self.error = error.localizedDescription }
        pending = false
    }

    func logout() { KeychainService.clear(); clear() }

    private func apply(token: String, id: UUID, email: String, displayName: String?) {
        self.token = token; self.userId = id; self.email = email; self.displayName = displayName
    }
    private func clear() { token = nil; userId = nil; email = nil; displayName = nil }
}
