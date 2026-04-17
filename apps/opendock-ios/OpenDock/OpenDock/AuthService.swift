import Foundation

enum AuthEndpoints {
    static let athion = URL(string: "https://www.athion.me")!
    static let api = URL(string: "https://opendock-api.athion.me")!
}

struct MeResponse: Decodable { let id: UUID; let email: String; let displayName: String? }
struct LoginUser: Decodable { let id: UUID; let email: String; let displayName: String? }
struct LoginResponse: Decodable { let token: String; let user: LoginUser }
struct ErrorResponse: Decodable { let error: String }

enum AuthService {
    static func login(email: String, password: String) async throws -> LoginResponse {
        let url = AuthEndpoints.athion.appendingPathComponent("api/auth/login")
        var req = URLRequest(url: url); req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["email": email, "password": password])
        let (data, resp) = try await URLSession.shared.data(for: req)
        let status = (resp as? HTTPURLResponse)?.statusCode ?? 0
        if !(200..<300).contains(status) {
            if let err = try? decoder().decode(ErrorResponse.self, from: data) { throw APIError(message: err.error, status: status) }
            throw APIError(message: "Login failed", status: status)
        }
        return try decoder().decode(LoginResponse.self, from: data)
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
