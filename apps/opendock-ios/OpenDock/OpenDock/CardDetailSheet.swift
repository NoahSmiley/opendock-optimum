import SwiftUI

struct CardDetailSheet: View {
    @EnvironmentObject var store: BoardsStore
    @Environment(\.dismiss) private var dismiss
    let boardId: UUID
    let cardId: UUID
    @State private var title = ""
    @State private var description = ""
    @State private var confirmingDelete = false
    @State private var saveTask: Task<Void, Never>?

    private var card: Card? { store.detail?.cards.first { $0.id == cardId } }
    private var members: [BoardMember] { store.detail?.board.id == boardId ? (store.detail?.members ?? []) : [] }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                TextField("Card title", text: $title)
                    .font(.custom(Theme.fontSemibold, size: 20)).foregroundColor(Theme.active)
                    .padding(.horizontal, 20).padding(.top, 20).padding(.bottom, 8)
                    .onChange(of: title) { _, _ in schedule() }
                AssigneeRow(members: members, assignee: card?.assigneeId) { newId in
                    Task { await store.assignCard(boardId: boardId, cardId: cardId, to: newId) }
                }
                Rectangle().fill(Theme.border).frame(height: 0.5).padding(.horizontal, 20)
                TextEditor(text: $description)
                    .font(.custom(Theme.fontName, size: 15)).foregroundColor(Theme.text)
                    .scrollContentBackground(.hidden).background(Theme.bg)
                    .padding(.horizontal, 16).padding(.top, 8)
                    .onChange(of: description) { _, _ in schedule() }
                LinkedEntitiesSection(anchor: EntityRef(kind: .card, id: cardId), label: "Linked notes", pickKind: .note)
                if let c = card {
                    Text("Updated \(c.updatedAt.formatted(date: .abbreviated, time: .shortened))")
                        .font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.ghost)
                        .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 20).padding(.vertical, 10)
                }
            }
            .background(Theme.bg)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("Done") { flushAndDismiss() }.foregroundColor(Theme.active) }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(role: .destructive) { confirmingDelete = true } label: { Image(systemName: "trash") }
                }
            }
            .toolbarBackground(Theme.bg, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
            .alert("Delete card?", isPresented: $confirmingDelete) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) { Task { await store.deleteCard(boardId: boardId, cardId: cardId); dismiss() } }
            } message: { Text("\"\(card?.title ?? "")\" will be permanently deleted.") }
        }
        .onAppear { if let c = card { title = c.title; description = c.description } }
    }

    private func schedule() {
        saveTask?.cancel()
        saveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 400_000_000)
            if Task.isCancelled { return }
            await store.updateCard(boardId: boardId, cardId: cardId, title: title, description: description)
        }
    }

    private func flushAndDismiss() {
        saveTask?.cancel()
        if let c = card, c.title != title || c.description != description {
            Task { await store.updateCard(boardId: boardId, cardId: cardId, title: title, description: description) }
        }
        dismiss()
    }
}

private struct AssigneeRow: View {
    let members: [BoardMember]
    let assignee: UUID?
    let onPick: (UUID?) -> Void

    private var current: BoardMember? { members.first { $0.userId == assignee } }
    private var label: String { current.map { $0.displayName ?? $0.email } ?? "Unassigned" }

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "person.circle").font(.system(size: 13)).foregroundColor(Theme.faint)
            Menu {
                Button("Unassigned") { onPick(nil) }
                Divider()
                ForEach(members) { m in
                    Button(m.displayName ?? m.email) { onPick(m.userId) }
                }
            } label: {
                HStack(spacing: 4) {
                    Text(label).font(.custom(Theme.fontName, size: 13)).foregroundColor(assignee == nil ? Theme.faint : Theme.text)
                    Image(systemName: "chevron.down").font(.system(size: 9)).foregroundColor(Theme.ghost)
                }
            }
            Spacer()
        }
        .padding(.horizontal, 20).padding(.bottom, 10)
    }
}
