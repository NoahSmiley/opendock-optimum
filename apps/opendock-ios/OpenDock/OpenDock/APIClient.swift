import Foundation

struct APIError: Error { let message: String; let status: Int }

nonisolated(unsafe) private let iso = ISO8601DateFormatter.opendock()

@MainActor
final class APIClient {
    static let shared = APIClient()
    weak var auth: AuthStore?

    private let base = AuthEndpoints.api
    private let decoder: JSONDecoder = {
        let d = JSONDecoder(); d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .custom { decoder in
            let s = try decoder.singleValueContainer().decode(String.self)
            if let date = iso.date(from: s) { return date }
            throw DecodingError.dataCorruptedError(in: try decoder.singleValueContainer(), debugDescription: "bad date \(s)")
        }
        return d
    }()
    private let encoder: JSONEncoder = {
        let e = JSONEncoder(); e.keyEncodingStrategy = .convertToSnakeCase; return e
    }()

    private func request<B: Encodable>(_ method: String, _ path: String, body: B?) async throws -> Data {
        guard let token = auth?.token else { throw APIError(message: "not authenticated", status: 401) }
        var req = URLRequest(url: base.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try encoder.encode(body)
        }
        let (data, resp) = try await URLSession.shared.data(for: req)
        let status = (resp as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            throw APIError(message: String(data: data, encoding: .utf8) ?? "", status: status)
        }
        return data
    }

    func get<T: Decodable>(_ path: String) async throws -> T {
        try decoder.decode(T.self, from: await request("GET", path, body: Optional<Int>.none))
    }
    func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        try decoder.decode(T.self, from: await request("POST", path, body: body))
    }
    func patch<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        try decoder.decode(T.self, from: await request("PATCH", path, body: body))
    }
    func delete(_ path: String) async throws { _ = try await request("DELETE", path, body: Optional<Int>.none) }
}

extension ISO8601DateFormatter {
    static func opendock() -> ISO8601DateFormatter {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }
}
