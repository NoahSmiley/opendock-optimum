# BoardHeader

Top header bar for the active board view. Shows board name, ticket count, search input, and add column button.

## Props
- `boardName` — Board title
- `description` — Optional board description
- `ticketCount` — Total ticket count
- `search`, `onSearchChange` — Search input state
- `onBack` — Navigate back to board list
- `onAddColumn` — Creates a new column

## Used by
- `BoardsPage.tsx`
