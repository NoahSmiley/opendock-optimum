import Foundation

enum LiveScope: String { case note, board }

@MainActor
final class LiveSocket {
    private let scope: LiveScope
    private let id: UUID
    private let token: String
    private let onEvent: (LiveEvent) -> Void
    private var task: URLSessionWebSocketTask?
    private var attempt = 0
    private var stopped = false

    init(scope: LiveScope, id: UUID, token: String, onEvent: @escaping (LiveEvent) -> Void) {
        self.scope = scope; self.id = id; self.token = token; self.onEvent = onEvent
    }

    func start() { stopped = false; connect() }
    func stop() { stopped = true; task?.cancel(with: .goingAway, reason: nil); task = nil }

    private func connect() {
        guard !stopped else { return }
        var comps = URLComponents(url: AuthEndpoints.api.appendingPathComponent("ws"), resolvingAgainstBaseURL: false)!
        comps.scheme = comps.scheme == "https" ? "wss" : "ws"
        comps.queryItems = [
            URLQueryItem(name: "token", value: token),
            URLQueryItem(name: "scope", value: scope.rawValue),
            URLQueryItem(name: "id", value: id.uuidString.lowercased()),
        ]
        guard let url = comps.url else { return }
        task = URLSession.shared.webSocketTask(with: url)
        task?.resume()
        receive()
    }

    private func receive() {
        task?.receive { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                switch result {
                case .success(.string(let txt)):
                    self.attempt = 0
                    if let data = txt.data(using: .utf8), let ev = try? LiveEvent.decode(from: data) { self.onEvent(ev) }
                    self.receive()
                case .success: self.receive()
                case .failure: self.reconnect()
                }
            }
        }
    }

    private func reconnect() {
        guard !stopped else { return }
        task = nil
        attempt = min(attempt + 1, 6)
        let delay = pow(2.0, Double(attempt)) * 0.5
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            self.connect()
        }
    }
}
