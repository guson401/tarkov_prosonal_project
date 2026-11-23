#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![tauri_plugin_sql::Migration {
        version: 1,
        description: "initial_schema",
        sql: include_str!("../../../../tarkov_companion_erd.sql"),
        kind: tauri_plugin_sql::MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:tarkov_companion.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("failed to run Tarkov Companion");
}
