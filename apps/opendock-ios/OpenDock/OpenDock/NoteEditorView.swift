import SwiftUI
import UIKit

struct NoteEditorView: View {
    @EnvironmentObject var store: NotesStore
    @EnvironmentObject var auth: AuthStore
    @EnvironmentObject var links: LinksStore
    @EnvironmentObject var myCards: MyCardsStore
    @Environment(\.dismiss) var dismiss
    let noteId: UUID
    @State private var title = ""
    @State private var attributed = NSAttributedString()
    @State private var trigger: MentionTriggerState?
    @State private var dirty = false
    @State private var confirmingDelete = false
    @State private var showingMembers = false
    @State private var saveTask: Task<Void, Never>?
    @State private var socket: LiveSocket?
    @State private var loadedContentFor: UUID?
    @StateObject private var tvRef = TextViewRef()
    /// Bumped whenever the text view scrolls. CheckboxOverlay watches
    /// this to re-layout its buttons in sync.
    @State private var scrollRevision: Int = 0

    private var note: Note? { store.notes.first { $0.id == noteId } }

    var body: some View {
        ZStack(alignment: .topLeading) {
            VStack(spacing: 0) {
                TextField("Untitled", text: $title)
                    .font(.custom(Theme.fontSemibold, size: 24)).foregroundColor(Theme.active)
                    .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 2)
                    .onChange(of: title) { _, _ in schedulePatch() }
                Rectangle().fill(Theme.border).frame(height: 0.5).padding(.horizontal, 20).padding(.top, 8)
                ZStack(alignment: .topLeading) {
                    MentionTextView(
                        attributed: $attributed,
                        trigger: $trigger,
                        onChange: schedulePatch,
                        ref: tvRef,
                        onScroll: { scrollRevision &+= 1 }
                    )
                    .padding(.horizontal, 4).padding(.top, 4)
                    CheckboxOverlay(
                        textView: { tvRef.textView },
                        revision: attributed.hash,
                        scrollRevision: scrollRevision
                    )
                    .padding(.horizontal, 4).padding(.top, 4)
                    .allowsHitTesting(true)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                EditorToolbarView(textView: { tvRef.textView })
                LinkedEntitiesSection(anchor: EntityRef(kind: .note, id: noteId), label: "Linked cards", pickKind: .card)
                HStack(spacing: 8) {
                    Text("\(attributed.string.split(whereSeparator: { $0.isWhitespace || $0.isNewline }).count) words")
                    Text("·"); Text(dirty ? "editing" : "saved"); Spacer()
                }
                .font(.custom(Theme.fontName, size: 11)).foregroundColor(Theme.ghost)
                .padding(.horizontal, 20).padding(.vertical, 10)
            }
            if let t = trigger {
                MentionPopoverView(query: t.query, anchorRect: t.caretRect, excludeId: noteId) { kind, id, title in
                    pickMention(kind: kind, id: id, title: title)
                }
            }
        }
        .background(Theme.bg).navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.bg, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .toolbar { NoteEditorToolbar(noteId: noteId, note: note, confirmingDelete: $confirmingDelete, showingMembers: $showingMembers) }
        .onAppear { syncFromNote(); startSocket(); Task { await myCards.ensure() } }
        .onDisappear { flushPending(); socket?.stop(); socket = nil }
        .onChange(of: note) { _, _ in applyRemoteIfNotDirty() }
        .alert("Delete note?", isPresented: $confirmingDelete) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) { Task { await store.delete(noteId); dismiss() } }
        } message: { Text("\"\(note?.title.isEmpty == false ? note!.title : "Untitled")\" will be permanently deleted.") }
        .sheet(isPresented: $showingMembers) {
            if let n = note { MembersSheet(noteId: noteId, ownerId: n.ownerId).environmentObject(auth) }
        }
    }

    private func syncFromNote() {
        guard let n = note else { return }
        title = n.title
        if loadedContentFor != n.id {
            attributed = EditorDecode.decode(n.content)
            loadedContentFor = n.id
        }
    }

    private func applyRemoteIfNotDirty() {
        guard !dirty, let n = note else { return }
        if n.title != title { title = n.title }
        let incoming = EditorDecode.decode(n.content)
        if incoming.string != attributed.string { attributed = incoming }
    }

    private func startSocket() {
        guard let token = auth.token, socket == nil else { return }
        socket = LiveSocket(scope: .note, id: noteId, token: token) { [store, links] ev in
            store.apply(event: ev); links.apply(event: ev)
        }
        socket?.start()
    }

    private func pickMention(kind: EntityKind, id: UUID, title: String) {
        guard let tv = findFirstTextView() else { return }
        guard let t = trigger else { return }
        insertMention(into: tv, trigger: t, kind: kind, id: id, title: title)
        attributed = tv.attributedText
        trigger = nil
        schedulePatch()
    }

    private func findFirstTextView() -> UITextView? {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first else { return nil }
        return findTextView(in: window)
    }
    private func findTextView(in view: UIView) -> UITextView? {
        if let tv = view as? UITextView { return tv }
        for sub in view.subviews { if let found = findTextView(in: sub) { return found } }
        return nil
    }

    private func schedulePatch() {
        dirty = true
        saveTask?.cancel()
        saveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 400_000_000)
            if Task.isCancelled { return }
            await store.update(noteId, title: title, content: EditorEncode.encode(attributed))
            dirty = false
        }
    }

    private func flushPending() {
        guard dirty else { return }
        saveTask?.cancel()
        Task { await store.update(noteId, title: title, content: EditorEncode.encode(attributed)) }
    }
}
