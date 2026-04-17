import SwiftUI

struct MembersSheet: View {
    let noteId: UUID
    let ownerId: UUID
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var auth: AuthStore
    @State private var members: [NoteMember] = []
    @State private var email = ""
    @State private var results: [UserSummary] = []
    @State private var error: String?
    @State private var searched = false
    @State private var searchTask: Task<Void, Never>?

    private var isOwner: Bool { auth.userId == ownerId }
    private var memberIds: Set<UUID> { Set(members.map { $0.userId }) }
    private var filteredResults: [UserSummary] { results.filter { !memberIds.contains($0.id) } }
    private var looksLikeEmail: Bool { email.contains("@") && email.contains(".") }
    private var showInviteHint: Bool { searched && filteredResults.isEmpty && looksLikeEmail }

    var body: some View {
        NavigationStack {
            List {
                if isOwner { addSection }
                Section("Members") {
                    ForEach(members) { m in MemberRow(member: m, canRemove: isOwner && m.userId != ownerId) {
                        Task { await remove(userId: m.userId) }
                    } }
                }.listRowBackground(Theme.bg)
            }
            .listStyle(.insetGrouped).scrollContentBackground(.hidden).background(Theme.bg)
            .navigationTitle("Sharing").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() }.foregroundColor(Theme.active) } }
        }
        .task { await load() }
        .alert("Error", isPresented: Binding(get: { error != nil }, set: { if !$0 { error = nil } })) {
            Button("OK", role: .cancel) { error = nil }
        } message: { Text(error ?? "") }
    }

    private var addSection: some View {
        Section {
            TextField("Add by email", text: $email)
                .font(.custom(Theme.fontName, size: 15)).foregroundColor(Theme.text)
                .textInputAutocapitalization(.never).autocorrectionDisabled()
                .onChange(of: email) { _, v in schedule(query: v) }
                .listRowBackground(Theme.input)
            ForEach(filteredResults) { u in
                Button { Task { await add(email: u.email) } } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(u.displayName ?? u.email).font(.custom(Theme.fontMedium, size: 14)).foregroundColor(Theme.text)
                        if u.displayName != nil { Text(u.email).font(.custom(Theme.fontName, size: 12)).foregroundColor(Theme.faint) }
                    }
                }.listRowBackground(Theme.bg)
            }
            if showInviteHint {
                Text("No match. They need to sign in at athion.me first, then try again.")
                    .font(.custom(Theme.fontName, size: 12)).foregroundColor(Theme.faint)
                    .listRowBackground(Theme.bg)
            }
        }
    }

    private func load() async { do { members = try await NotesAPI.members(noteId) } catch { self.error = "\(error)" } }

    private func schedule(query: String) {
        searchTask?.cancel()
        let q = query.trimmingCharacters(in: .whitespaces)
        guard q.count >= 2 else { results = []; searched = false; return }
        searchTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 250_000_000)
            if Task.isCancelled { return }
            do { results = try await UsersAPI.search(q); searched = true } catch { /* silent */ }
        }
    }

    private func add(email: String) async {
        do { try await NotesAPI.addMember(noteId, email: email); self.email = ""; results = []; searched = false; await load() }
        catch { self.error = "\(error)" }
    }

    private func remove(userId: UUID) async {
        do { try await NotesAPI.removeMember(noteId, userId: userId); await load() }
        catch { self.error = "\(error)" }
    }
}

private struct MemberRow: View {
    let member: NoteMember
    let canRemove: Bool
    let onRemove: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(member.displayName ?? member.email).font(.custom(Theme.fontMedium, size: 14)).foregroundColor(Theme.text)
                Text("\(member.email) · \(member.role)").font(.custom(Theme.fontName, size: 12)).foregroundColor(Theme.faint)
            }
            Spacer()
            if canRemove { Button { onRemove() } label: { Image(systemName: "xmark.circle.fill").foregroundColor(Theme.muted) }.buttonStyle(.plain) }
        }
    }
}
