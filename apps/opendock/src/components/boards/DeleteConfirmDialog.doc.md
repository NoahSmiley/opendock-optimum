# DeleteConfirmDialog

Confirmation dialog overlay for destructive actions. Renders a centered modal with a warning icon, a message containing the item title, and Cancel/Delete buttons. Generic enough to be reused for any delete confirmation.

## Props
- `title` — Name of the item being deleted (shown in the confirmation message)
- `onConfirm` — Callback when the user confirms deletion
- `onCancel` — Callback to dismiss the dialog

## Used by
- `TicketDetail.tsx`
