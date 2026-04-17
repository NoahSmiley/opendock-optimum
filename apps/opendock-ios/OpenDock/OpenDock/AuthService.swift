import Foundation

enum AuthEndpoints {
    static let athion = URL(string: "https://www.athion.me")!
    static let api = URL(string: "https://opendock-api.athion.me")!
}

struct InitiateResponse: Decodable { let code: String }
struct PollResponse: Decodable { let status: String; let token: String? }
struct MeResponse: Decodable { let id: UUID; let email: String; let displayName: String? }

enum AuthService {
    static func initiate() async throws -> (code: String, url: URL) {
        let url = AuthEndpoints.athion.appendingPathComponent("api/auth/ide/initiate")
        var req = URLRequest(url: url); req.httpMethod = "POST"
        let (data, _) = try await URLSession.shared.data(for: req)
        let body = try decoder().decode(InitiateResponse.self, from: data)
        let loginURL = AuthEndpoints.athion.appendingPathComponent("auth/ide-login")
        var comps = URLComponents(url: loginURL, resolvingAgainstBaseURL: false)!
        comps.queryItems = [URLQueryItem(name: "code", value: body.code), URLQueryItem(name: "app", value: "opendock")]
        return (body.code, comps.url!)
    }

    static func poll(code: String) async throws -> PollResponse {
        let url = AuthEndpoints.athion.appendingPathComponent("api/auth/ide/poll")
        var req = URLRequest(url: url); req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["code": code])
        let (data, resp) = try await URLSession.shared.data(for: req)
        if let http = resp as? HTTPURLResponse, http.statusCode == 410 {
            return PollResponse(status: "expired", token: nil)
        }
        return try decoder().decode(PollResponse.self, from: data)
    }

    static func fetchMe(token: String) async throws -> MeResponse {
        let url = AuthEndpoints.api.appendingPathComponent("me")
        var req = URLRequest(url: url)
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (data, _) = try await URLSession.shared.data(for: req)
        return try decoder().decode(MeResponse.self, from: data)
    }

    static func decoder() -> JSONDecoder {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        return d
    }
}
