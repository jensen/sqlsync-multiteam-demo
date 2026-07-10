use serde::{Deserialize, Serialize};
#[cfg(not(test))]
use sqlsync_reducer::execute;
use sqlsync_reducer::{init_reducer, types::ReducerError};
use log;

#[cfg(test)]
macro_rules! execute {
    ($sql:expr $(, $arg:expr)*) => {
        async {
            $crate::MOCK_EXECUTES.with(|v| {
                v.borrow_mut().push($sql.to_string());
            });
            Ok::<_, sqlsync_reducer::types::ReducerError>(sqlsync_reducer::types::ExecResponse { changes: 1 })
        }
    };
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "tag")]
enum Mutation {
    InitSchema,
    AddUser {
        id: String,
        email: String,
        name: String,
    },
    AddProject {
        id: String,
        name: String,
        created_by: String,
    },
    RemoveProject {
        id: String,
    },
    AddIssue {
        id: String,
        title: String,
        body: String,
        project_id: Option<String>,
        created_by: String,
        assigned_to: Option<String>,
        status: String,
        priority: i32
    },
    AssignIssue {
        id: String,
        to: Option<String>,
    },
    UpdateIssue {
        id: String,
        status: Option<String>,
        priority: Option<String>,
    },
    ArchiveIssues {
        ids: Vec<String>,
    },
    RestoreIssues {
        ids: Vec<String>,
    },
    MoveIssues {
        ids: Vec<String>,
        project_id: Option<String>
    },
    AddComment {
        id: String,
        issue_id: String,
        body: String,
        created_by: String,
    },
    UpdateComment {
        id: String,
        body: String,
    },
    DeleteComment {
        id: String,
    },
    AddActivity {
        id: String,
        issue_id: String,
        actor_id: String,
        action: String,
        details: Option<String>,
    }
}

init_reducer!(reducer);
async fn reducer(mutation: Vec<u8>) -> Result<(), ReducerError> {
    let mutation: Mutation = serde_json::from_slice(&mutation[..])?;

    match mutation {
        Mutation::InitSchema => {
            execute!(
                "
                create table if not exists users (
                    id text primary key,
                    email text not null,
                    name text not null,
                    created_at text not null
                )
                "
            )
            .await?;

            execute!(
                "
                create table if not exists projects (
                    id text primary key,
                    name text not null,
                    created_at text not null,
                    created_by text not null,
                    foreign key (created_by) references users(id)
                )
                "
            )
            .await?;

            execute!(
                "
                create table if not exists issues (
                    id text primary key,
                    title text not null,
                    body text not null,
                    project_id text,
                    created_by text not null,
                    assigned_to text,
                    status text check(status in ('backlog', 'todo', 'inprogress', 'done', 'blocked', 'canceled')) not null default 'backlog',
                    priority integer check(priority < 4) not null default 0,
                    created_at text not null,
                    updated_at text not null,
                    archived_at text,
                    foreign key (project_id) references projects(id),
                    foreign key (created_by) references users(id),
                    foreign key (assigned_to) references users(id)
                )
                "
            )
            .await?;

            execute!(
                "
                create table if not exists comments (
                    id text primary key,
                    issue_id text not null,
                    body text not null,
                    created_by text not null,
                    created_at text not null,
                    foreign key (issue_id) references issues(id),
                    foreign key (created_by) references users(id)
                )
                "
            )
            .await?;

            execute!(
                "
                create table if not exists activities (
                    id text primary key,
                    issue_id text not null,
                    actor_id text not null,
                    action text not null,
                    details text,
                    created_at text not null,
                    foreign key (issue_id) references issues(id),
                    foreign key (actor_id) references users(id)
                )
                "
            )
            .await?;
        }

        Mutation::AddUser { id, email, name } => {
            execute!(
                "insert into users (id, email, name, created_at) values (?, ?, ?, datetime('now'))",
                id,
                email,
                name
            )
            .await?;
        }

        Mutation::AddProject {
            id,
            name,
            created_by,
        } => {
            execute!(
                "insert into projects (id, name, created_at, created_by) values (?, ?, datetime('now'), ?)",
                id,
                name,
                created_by
            )
            .await?;
        }

        Mutation::RemoveProject {
            id
        } => {
            execute!(
                "delete from projects where id = ?", id
            )
            .await?;
        }

        Mutation::AddIssue {
            id,
            title,
            body,
            project_id,
            created_by,
            assigned_to,
            status,
            priority
        } => {
            execute!(
                "
                insert into issues (
                  id,
                  title,
                  body,
                  project_id,
                  created_by,
                  created_at,
                  updated_at,
                  assigned_to,
                  status,
                  priority
                ) values (
                  ?, ?, ?, ?, ?,
                  datetime('now'),
                  datetime('now'),
                  ?, ?, ?
                )
                ",
                id,
                title,
                body,
                project_id,
                created_by,
                assigned_to,
                status,
                priority
            )
            .await?;
        }

        Mutation::AssignIssue {
            id,
            to,
        } => {
            let issue_id = id.clone();
            let assignee_str = to.clone().map(|s| s.to_string()).unwrap_or_default();
            execute!("update issues set assigned_to = ? where id = ?", to, id).await?;

            // Auto-generate activity log entry for assignment change
            let activity_id = format!("act_{}_assigned", issue_id);
            let details = if assignee_str.is_empty() {
                "unassigned".to_string()
            } else {
                format!("assigned to {}", assignee_str)
            };
            execute!(
                "insert into activities (id, issue_id, actor_id, action, details, created_at) values (?, ?, ?, 'assigned', ?, datetime('now'))",
                activity_id,
                issue_id,
                "system",
                details
            )
            .await?;
        }

        Mutation::UpdateIssue {
            id,
            status,
            priority
        } => {
            let status_val = status.clone();
            let priority_val = priority.clone();
            let issue_id = id.clone();
            execute!(
                "
                update issues set
                  status = ifnull(?, status),
                  priority = ifnull(?, priority),
                  updated_at = datetime('now')
                where id = ?
                ",
                status,
                priority,
                id
            )
            .await?;

            // Auto-generate activity log entries for status and priority changes
            if let Some(ref s) = status_val {
                let activity_id = format!("act_{}_status", issue_id);
                let details = format!("status changed to {}", s);
                execute!(
                    "insert into activities (id, issue_id, actor_id, action, details, created_at) values (?, ?, ?, 'status_changed', ?, datetime('now'))",
                    activity_id,
                    issue_id.clone(),
                    "system",
                    details
                )
                .await?;
            }
            if let Some(ref p) = priority_val {
                let activity_id = format!("act_{}_priority", issue_id);
                let details = format!("priority changed to {}", p);
                execute!(
                    "insert into activities (id, issue_id, actor_id, action, details, created_at) values (?, ?, ?, 'priority_changed', ?, datetime('now'))",
                    activity_id,
                    issue_id.clone(),
                    "system",
                    details
                )
                .await?;
            }
        }

        Mutation::ArchiveIssues {
            ids,
        } => {
            execute!(format!("update issues set archived_at = datetime('now') where id in ('{}')", ids.join("','"))).await?;

            // Auto-generate activity log entries for each archived issue
            for issue_id in &ids {
                let activity_id = format!("act_{}_archived", issue_id);
                execute!(
                    "insert into activities (id, issue_id, actor_id, action, details, created_at) values (?, ?, ?, 'archived', ?, datetime('now'))",
                    activity_id,
                    issue_id.clone(),
                    "system",
                    "issue archived"
                )
                .await?;
            }
        }

        Mutation::RestoreIssues {
            ids,
        } => {
            execute!(format!("update issues set archived_at = null where id in ('{}')", ids.join("','"))).await?;

            // Auto-generate activity log entries for each restored issue
            for issue_id in &ids {
                let activity_id = format!("act_{}_restored", issue_id);
                execute!(
                    "insert into activities (id, issue_id, actor_id, action, details, created_at) values (?, ?, ?, 'restored', ?, datetime('now'))",
                    activity_id,
                    issue_id.clone(),
                    "system",
                    "issue restored"
                )
                .await?;
            }
        }

        Mutation::MoveIssues {
            ids,
            project_id
        } => {
            let project_id_clone = project_id.clone();
            if project_id.is_none() {
                execute!(format!("update issues set project_id = null where id in ('{}')", ids.join("','"))).await?;
            } else {
                execute!(format!("update issues set project_id = ? where id in ('{}')", ids.join("','")), project_id).await?;
            }

            // Auto-generate activity log entries for each moved issue
            for issue_id in &ids {
                let activity_id = format!("act_{}_moved", issue_id);
                let details = match &project_id_clone {
                    Some(pid) => format!("moved to project {}", pid),
                    None => "removed from project".to_string(),
                };
                execute!(
                    "insert into activities (id, issue_id, actor_id, action, details, created_at) values (?, ?, ?, 'moved', ?, datetime('now'))",
                    activity_id,
                    issue_id.clone(),
                    "system",
                    details
                )
                .await?;
            }
        }

        Mutation::AddComment {
            id,
            issue_id,
            body,
            created_by,
        } => {
            let comment_id = id.clone();
            let issue_id_clone = issue_id.clone();
            let created_by_clone = created_by.clone();
            execute!(
                "insert into comments (id, issue_id, body, created_by, created_at) values (?, ?, ?, ?, datetime('now'))",
                id,
                issue_id,
                body,
                created_by
            )
            .await?;

            // Auto-generate activity log entry for new comment
            let activity_id = format!("act_{}_comment", comment_id);
            execute!(
                "insert into activities (id, issue_id, actor_id, action, details, created_at) values (?, ?, ?, 'commented', ?, datetime('now'))",
                activity_id,
                issue_id_clone,
                created_by_clone,
                "added a comment"
            )
            .await?;
        }

        Mutation::UpdateComment {
            id,
            body,
        } => {
            execute!(
                "update comments set body = ? where id = ?",
                body,
                id
            )
            .await?;
        }

        Mutation::DeleteComment {
            id,
        } => {
            execute!(
                "delete from comments where id = ?",
                id
            )
            .await?;
        }

        Mutation::AddActivity {
            id,
            issue_id,
            actor_id,
            action,
            details,
        } => {
            execute!(
                "insert into activities (id, issue_id, actor_id, action, details, created_at) values (?, ?, ?, ?, ?, datetime('now'))",
                id,
                issue_id,
                actor_id,
                action,
                details
            )
            .await?;
        }
    }

    Ok(())
}

#[cfg(test)]
thread_local! {
    static MOCK_EXECUTES: std::cell::RefCell<Vec<String>> = std::cell::RefCell::new(Vec::new());
}

#[cfg(test)]
mod tests {
    use super::*;

    fn block_on<F: std::future::Future>(f: F) -> F::Output {
        use std::task::{Context, Poll, Waker, RawWaker, RawWakerVTable};

        fn noop_clone(_: *const ()) -> RawWaker { dummy_raw_waker() }
        fn noop(_: *const ()) {}

        fn dummy_raw_waker() -> RawWaker {
            RawWaker::new(std::ptr::null(), &VTABLE)
        }

        static VTABLE: RawWakerVTable = RawWakerVTable::new(noop_clone, noop, noop, noop);

        let waker = unsafe { Waker::from_raw(dummy_raw_waker()) };
        let mut ctx = Context::from_waker(&waker);
        let mut fut = Box::pin(f);

        loop {
            match fut.as_mut().poll(&mut ctx) {
                Poll::Ready(val) => return val,
                Poll::Pending => panic!("future unexpectedly pending"),
            }
        }
    }

    fn clear_mock_executes() {
        MOCK_EXECUTES.with(|v| v.borrow_mut().clear());
    }

    fn get_mock_executes() -> Vec<String> {
        MOCK_EXECUTES.with(|v| v.borrow().clone())
    }

    #[test]
    fn test_init_schema_creates_comments_table() {
        clear_mock_executes();
        let result = block_on(reducer(serde_json::to_vec(&Mutation::InitSchema).unwrap()));
        assert!(result.is_ok(), "InitSchema should succeed: {:?}", result);
        let executes = get_mock_executes();
        assert!(
            executes.iter().any(|sql| sql.to_lowercase().contains("create table if not exists comments")),
            "InitSchema should create comments table. Executed SQL: {:?}",
            executes
        );
    }

    #[test]
    fn test_init_schema_creates_activities_table() {
        clear_mock_executes();
        let result = block_on(reducer(serde_json::to_vec(&Mutation::InitSchema).unwrap()));
        assert!(result.is_ok(), "InitSchema should succeed: {:?}", result);
        let executes = get_mock_executes();
        assert!(
            executes.iter().any(|sql| sql.to_lowercase().contains("create table if not exists activities")),
            "InitSchema should create activities table. Executed SQL: {:?}",
            executes
        );
    }

    #[test]
    fn test_add_comment_mutation_works() {
        let mutation = Mutation::AddComment {
            id: "c1".to_string(),
            issue_id: "i1".to_string(),
            body: "test comment body".to_string(),
            created_by: "u1".to_string(),
        };
        let result = block_on(reducer(serde_json::to_vec(&mutation).unwrap()));
        assert!(result.is_ok(), "AddComment should succeed: {:?}", result);
    }

    #[test]
    fn test_update_comment_mutation_works() {
        let mutation = Mutation::UpdateComment {
            id: "c1".to_string(),
            body: "updated comment body".to_string(),
        };
        let result = block_on(reducer(serde_json::to_vec(&mutation).unwrap()));
        assert!(result.is_ok(), "UpdateComment should succeed: {:?}", result);
    }

    #[test]
    fn test_delete_comment_mutation_works() {
        let mutation = Mutation::DeleteComment {
            id: "c1".to_string(),
        };
        let result = block_on(reducer(serde_json::to_vec(&mutation).unwrap()));
        assert!(result.is_ok(), "DeleteComment should succeed: {:?}", result);
    }

    #[test]
    fn test_add_activity_mutation_works() {
        let mutation = Mutation::AddActivity {
            id: "a1".to_string(),
            issue_id: "i1".to_string(),
            actor_id: "u1".to_string(),
            action: "status_changed".to_string(),
            details: Some("backlog -> done".to_string()),
        };
        let result = block_on(reducer(serde_json::to_vec(&mutation).unwrap()));
        assert!(result.is_ok(), "AddActivity should succeed: {:?}", result);
    }

    #[cfg(feature = "t2-tests")]
    #[test]
    fn test_update_issue_generates_activity() {
        clear_mock_executes();
        let mutation = Mutation::UpdateIssue {
            id: "i1".to_string(),
            status: Some("done".to_string()),
            priority: None,
        };
        let result = block_on(reducer(serde_json::to_vec(&mutation).unwrap()));
        assert!(result.is_ok(), "UpdateIssue should succeed: {:?}", result);
        let executes = get_mock_executes();
        assert!(
            executes.iter().any(|sql| sql.to_lowercase().contains("insert into activities")),
            "UpdateIssue should auto-generate an activity log entry. Executed SQL: {:?}",
            executes
        );
    }

    #[cfg(feature = "t2-tests")]
    #[test]
    fn test_assign_issue_generates_activity() {
        clear_mock_executes();
        let mutation = Mutation::AssignIssue {
            id: "i1".to_string(),
            to: Some("u2".to_string()),
        };
        let result = block_on(reducer(serde_json::to_vec(&mutation).unwrap()));
        assert!(result.is_ok(), "AssignIssue should succeed: {:?}", result);
        let executes = get_mock_executes();
        assert!(
            executes.iter().any(|sql| sql.to_lowercase().contains("insert into activities")),
            "AssignIssue should auto-generate an activity log entry. Executed SQL: {:?}",
            executes
        );
    }

    #[cfg(feature = "t2-tests")]
    #[test]
    fn test_archive_issues_generates_activities() {
        clear_mock_executes();
        let mutation = Mutation::ArchiveIssues {
            ids: vec!["i1".to_string(), "i2".to_string()],
        };
        let result = block_on(reducer(serde_json::to_vec(&mutation).unwrap()));
        assert!(result.is_ok(), "ArchiveIssues should succeed: {:?}", result);
        let executes = get_mock_executes();
        assert!(
            executes.iter().any(|sql| sql.to_lowercase().contains("insert into activities")),
            "ArchiveIssues should auto-generate activity log entries. Executed SQL: {:?}",
            executes
        );
    }

    #[cfg(feature = "t2-tests")]
    #[test]
    fn test_restore_issues_generates_activities() {
        clear_mock_executes();
        let mutation = Mutation::RestoreIssues {
            ids: vec!["i1".to_string()],
        };
        let result = block_on(reducer(serde_json::to_vec(&mutation).unwrap()));
        assert!(result.is_ok(), "RestoreIssues should succeed: {:?}", result);
        let executes = get_mock_executes();
        assert!(
            executes.iter().any(|sql| sql.to_lowercase().contains("insert into activities")),
            "RestoreIssues should auto-generate activity log entries. Executed SQL: {:?}",
            executes
        );
    }

    #[cfg(feature = "t2-tests")]
    #[test]
    fn test_move_issues_generates_activities() {
        clear_mock_executes();
        let mutation = Mutation::MoveIssues {
            ids: vec!["i1".to_string()],
            project_id: Some("p2".to_string()),
        };
        let result = block_on(reducer(serde_json::to_vec(&mutation).unwrap()));
        assert!(result.is_ok(), "MoveIssues should succeed: {:?}", result);
        let executes = get_mock_executes();
        assert!(
            executes.iter().any(|sql| sql.to_lowercase().contains("insert into activities")),
            "MoveIssues should auto-generate activity log entries. Executed SQL: {:?}",
            executes
        );
    }

    #[cfg(feature = "t2-tests")]
    #[test]
    fn test_add_comment_generates_activity() {
        clear_mock_executes();
        let mutation = Mutation::AddComment {
            id: "c1".to_string(),
            issue_id: "i1".to_string(),
            body: "test comment".to_string(),
            created_by: "u1".to_string(),
        };
        let result = block_on(reducer(serde_json::to_vec(&mutation).unwrap()));
        assert!(result.is_ok(), "AddComment should succeed: {:?}", result);
        let executes = get_mock_executes();
        assert!(
            executes.iter().any(|sql| sql.to_lowercase().contains("insert into activities")),
            "AddComment should auto-generate an activity log entry. Executed SQL: {:?}",
            executes
        );
    }

}
