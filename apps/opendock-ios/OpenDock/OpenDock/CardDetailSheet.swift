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

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                TextField("Card title", text: $title)
                    .font(.custom(Theme.fontSemibold, size: 20)).foregroundColor(Theme.active)
                    .padding(.horizontal, 20).padding(.top, 20).padding(.bottom, 8)
                    .onChange(of: title) { _, v in schedule(title: v, description: nil) }
                TextEditor(text: $description)
                    .font(.custom(Theme.fontName, size: 15)).foregroundColor(Theme.text)
                    .scrollContentBackground(.hidden).background(Theme.bg)
                    .padding(.horizontal, 16)
                    .onChange(of: description) { _, v in schedule(title: nil, description: v) }
                if let c = card {
                    Text("Updated \(c.updatedAt.formatted(date: .abbreviated, time: .shortened))")
                        .font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.ghost)
                        .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 20).padding(.vertical, 10)
                }
            }
            .background(Theme.bg)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("Done") { dismiss() }.foregroundColor(Theme.active) }
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

    private func schedule(title: String?, description: String?) {
        saveTask?.cancel()
        saveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 400_000_000)
            if Task.isCancelled { return }
            await store.updateCard(boardId: boardId, cardId: cardId, title: title, description: description)
        }
    }
}
