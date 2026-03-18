# board_repair

Auto-repair logic for boards. Ensures the authenticated user is a kanban member,
seeds default labels, and generates a `project_key` when missing. Called from
`handlers::boards::get_board` and `handlers::boards::create_board`.
