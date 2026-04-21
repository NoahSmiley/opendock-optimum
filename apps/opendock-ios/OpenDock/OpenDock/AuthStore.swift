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
        #if DEBUG
        if let bypassId = devBypassUserId() {
            let token = "dev:\(bypassId.uuidString.lowercased())"
            do {
                let me = try await AuthService.fetchMe(token: token)
                apply(token: token, id: me.id, email: me.email, displayName: me.displayName)
                loading = false
                return
            } catch {
                // fall through to normal flow
            }
        }
        #endif
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

    #if DEBUG
    /// Debug builds authenticate as this test user automatically, skipping
    /// the login screen. Release builds strip this entirely via #if DEBUG.
    private func devBypassUserId() -> UUID? {
        UUID(uuidString: "11111111-1111-1111-1111-111111111111")
    }
    #endif

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
