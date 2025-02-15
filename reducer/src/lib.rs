use serde::Deserialize;
use sqlsync_reducer::{execute, init_reducer, types::ReducerError};
use log;

#[derive(Deserialize, Debug)]
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
            execute!("update issues set assigned_to = ? where id = ?", to, id).await?;
        }

        Mutation::UpdateIssue {
            id,
            status,
            priority
        } => {
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
        }

        Mutation::ArchiveIssues {
            ids,
        } => {
            execute!(format!("update issues set archived_at = datetime('now') where id in ('{}')", ids.join("','"))).await?;
        }

        Mutation::RestoreIssues {
            ids,
        } => {
            execute!(format!("update issues set archived_at = null where id in ('{}')", ids.join("','"))).await?;
        }

        Mutation::MoveIssues {
            ids,
            project_id
        } => {
            if project_id.is_none() {
                execute!(format!("update issues set project_id = null where id in ('{}')", ids.join("','"))).await?;
            } else {
                execute!(format!("update issues set project_id = ? where id in ('{}')", ids.join("','")), project_id).await?;
            }
        }
    }

    Ok(())
}
