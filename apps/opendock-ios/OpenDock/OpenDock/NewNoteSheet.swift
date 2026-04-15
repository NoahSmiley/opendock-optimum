import SwiftUI

struct NewNoteSheet: View {
    @EnvironmentObject var store: NotesStore
    @Environment(\.dismiss) var dismiss
    var onCreated: (UUID) -> Void
    @State private var title = ""
    @FocusState private var focused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                TextField("Note title", text: $title)
                    .font(.custom(Theme.fontName, size: 18))
                    .foregroundColor(Theme.active)
                    .focused($focused)
                    .padding(.horizontal, 20)
                    .padding(.top, 24)
                    .onSubmit { create() }

                Rectangle().fill(Theme.border).frame(height: 0.5)
                    .padding(.horizontal, 20)
                    .padding(.top, 16)

                Spacer()
            }
            .background(Theme.elevated)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .font(.custom(Theme.fontName, size: 15))
                        .foregroundColor(Theme.muted)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") { create() }
                        .font(.custom(Theme.fontSemibold, size: 15))
                        .foregroundColor(title.trimmingCharacters(in: .whitespaces).isEmpty ? Theme.ghost : Theme.active)
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .toolbarBackground(Theme.elevated, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
        .presentationDetents([.height(180)])
        .presentationDragIndicator(.visible)
        .presentationBackground(Theme.elevated)
        .onAppear { focused = true }
    }

    private func create() {
        let trimmed = title.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        store.create(title: trimmed)
        if let id = store.selectedId {
            onCreated(id)
        }
        dismiss()
    }
}
