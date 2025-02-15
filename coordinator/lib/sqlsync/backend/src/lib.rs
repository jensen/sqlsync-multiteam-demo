use coordinator::Coordinator;
use coordinator::CoordinatorTask;
use js_sys::{ArrayBuffer, Reflect, Uint8Array};
use sqlsync::JournalId;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::{spawn_local, JsFuture};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;
use cookie::Cookie;
use worker::*;
use wasm_bindgen::prelude::*;

mod coordinator;
mod persistence;

pub const DURABLE_OBJECT_NAME: &str = "COORDINATOR";
pub const REDUCER_BUCKET: &str = "SQLSYNC_REDUCERS";

#[durable_object]
pub struct DocumentCoordinator {
    state: State,
    env: Env,
    coordinator: Option<Coordinator>,
}

#[durable_object]
impl DurableObject for DocumentCoordinator {
    fn new(state: State, env: Env) -> Self {
        console_error_panic_hook::set_once();
        Self { state, env, coordinator: None }
    }

    async fn fetch(&mut self, mut req: Request) -> Result<Response> {
        let is_upgrade_req = req.headers().get("Upgrade")?.unwrap_or("".into()) == "websocket";

        if !is_upgrade_req {
            let body: serde_json::Value = serde_json::from_str(&req.text().await?)?;
            if let Some(tag) = body.get("tag") {
                if tag == "AddUser" {
                    let url = req.url()?;
                    let reducer_digest = match url.query_pairs().find(|(k, _)| k == "reducer") {
                        Some((_, v)) => v,
                        None => return Response::error("Bad Request", 400),
                    };
                    let bucket = self.env.bucket(REDUCER_BUCKET)?;
                    let objects = bucket.list().execute().await?;
                    let objects = objects.objects();

                    let latest_object = objects.last().ok_or_else(|| Error::RustError("No objects found in bucket".to_string()))?;
                    let object = bucket
                        .get(latest_object.key())
                        .execute()
                        .await?;
                    let reducer_bytes = match object {
                        Some(object) => {
                            object
                                .body()
                                .ok_or_else(|| Error::RustError("reducer not found in bucket".to_string()))?
                                .bytes()
                                .await?
                        }
                        None => {
                            return Response::error(
                                format!("reducer {} not found in bucket", reducer_digest),
                                404,
                            )
                        }
                    };

                    let (coordinator, mut task) = Coordinator::init(&self.state, reducer_bytes).await?;
                    self.coordinator = Some(coordinator);

                    task.mutate(body);
                    spawn_local(task.into_task());

                    return Response::ok("User added successfully");
                }
            }

            return Response::error("Bad Request", 400);
        }

        // initialize the coordinator if it hasn't been initialized yet
        if self.coordinator.is_none() {
            // retrieve the reducer digest from the request url
            let url = req.url()?;
            let reducer_digest = match url.query_pairs().find(|(k, _)| k == "reducer") {
                Some((_, v)) => v,
                None => return Response::error("Bad Request", 400),
            };
            let bucket = self.env.bucket(REDUCER_BUCKET)?;
            let object = bucket
                .get(format!("{}.wasm", reducer_digest))
                .execute()
                .await?;
            let reducer_bytes = match object {
                Some(object) => {
                    object
                        .body()
                        .ok_or_else(|| Error::RustError("reducer not found in bucket".to_string()))?
                        .bytes()
                        .await?
                }
                None => {
                    return Response::error(
                        format!("reducer {} not found in bucket", reducer_digest),
                        404,
                    )
                }
            };

            let (coordinator, task) = Coordinator::init(&self.state, reducer_bytes).await?;
            spawn_local(task.into_task());
            self.coordinator = Some(coordinator);
        }
        let coordinator = self.coordinator.as_mut().unwrap();

        let pair = WebSocketPair::new()?;
        let ws = pair.server;
        ws.accept()?;

        if let Err(e) = coordinator
            .accept(ws.as_ref().clone().try_into().unwrap())
            .await
        {
            // the only case we get an error here is if the coordinator task has
            // somehow crashed and thus the Sender is disconnected
            panic!("failed to accept websocket: {:?}", e);
        }

        Response::from_websocket(pair.client)
    }
}

#[derive(Deserialize, Serialize, Debug)]
struct User {
    id: String,
    email: String,
    name: String,
    created_at: String,
}

#[derive(Deserialize, Serialize, Debug)]
struct RecordWithId {
    id: String,
}

#[derive(Deserialize, Serialize, Debug)]
struct Organization {
    id: String,
    name: String,
    document: String,
    created_at: String
}

#[derive(Deserialize, Serialize, Debug)]
struct AuthenticatedUser {
    id: String,
    email: String,
    name: String,
    organizations: String
}

#[derive(Deserialize, Serialize, Debug)]
struct AuthenticatedUserWithOrganizations {
    id: String,
    email: String,
    name: String,
    organizations: Vec<Organization>
}

fn get_authenticated_user(req: &Request) -> Result<AuthenticatedUserWithOrganizations> {
    let headers = req.headers();
    let cookie = headers.get("Cookie")?;

    if cookie.is_none() {
        return Err(Error::from("No cookie found"));
    }

    let session = Cookie::parse(cookie.unwrap()).unwrap();
    let (_, value) = session.name_value();
    serde_json::from_str(value).map_err(|e| e.into())
}

#[event(fetch)]
async fn main(req: Request, env: Env, _ctx: Context) -> Result<Response> {

    let domain = match env.var("ENVIRONMENT")?.to_string().as_str() {
        "development" => "localhost",
        _ => "sqlsync.firstlocal.org",
    };

    let origin = match env.var("ENVIRONMENT")?.to_string().as_str() {
        "development" => "http://localhost:5173",
        _ => "https://sqlsync.firstlocal.org",
    };

    let api = match env.var("ENVIRONMENT")?.to_string().as_str() {
        "development" => "http://localhost:8787",
        _ => "https://api.sqlsync.firstlocal.org",
    };

    console_error_panic_hook::set_once();
    let cors = Cors::default().with_origins(vec![origin]).with_credentials(true);

    let router = Router::new();

    router
        .post_async("/auth/register", |mut req, ctx| async move {
            let form = match req.form_data().await {
                Ok(form) => form,
                Err(_) => return Response::error("Bad Request", 400),
            };

            let email = match form.get("email") {
                Some(FormEntry::Field(email)) if !email.trim().is_empty() => email,
                _ => return Response::error("Bad Request: Email is required", 400),
            };

            let name = match form.get("name") {
                Some(FormEntry::Field(name)) if !name.trim().is_empty() => name,
                _ => return Response::error("Bad Request: Name is required", 400),
            };

            let d1 = match ctx.env.d1("DB") {
                Ok(d1) => d1,
                Err(_) => return Response::error("Internal Server Error", 500),
            };

            let existing = match d1.prepare("select id from users where email = ?1")
                .bind(&[email.to_string().into()])?
                .first::<RecordWithId>(None)
                .await {
                    Ok(result) => result,
                    Err(e) => {
                        console_error!("Database select error: {:?}", e);
                        return Response::error("Internal Server Error", 500);
                    }
                };

            if existing.is_some() {
                return Response::error("Bad Request", 400);
            };

            let id = Uuid::new_v4().hyphenated();

            let inserted = d1.prepare("
                  insert into users (
                    id,
                    email,
                    name,
                    created_at
                  ) values (?1, ?2, ?3, datetime('now')) returning id, email, name, created_at
                ")
                .bind(&[id.to_string().into(), email.to_string().into(), name.to_string().into()])?
                .first::<User>(None)
                .await;

            let user = match inserted {
                Ok(Some(user)) => user,
                Ok(None) => return Response::error("Bad Request", 400),
                Err(e) => {
                    console_error!("Database insert error: {:?}", e);
                    return Response::error("Internal Server Error", 500);
                }
            };

            let authenticated = AuthenticatedUserWithOrganizations {
                id: user.id,
                email: user.email,
                name: user.name,
                organizations: serde_json::from_str("[]")?,
            };

            let cookie = serde_json::to_string(&authenticated)?;

            let mut headers = Headers::new();
            headers.set("Set-Cookie", &format!("sqlsync-auth={}; HttpOnly; Path=/", cookie))?;

            return Ok(Response::ok("")?.with_headers(headers));
        })
        .post_async("/auth/login", |mut req, ctx| async move {
            let form = match req.form_data().await {
                Ok(form) => form,
                Err(_) => return Response::error("Bad Request", 400),
            };

            let email = match form.get("email") {
                Some(FormEntry::Field(email)) => email,
                _ => return Response::error("Bad Request", 400),
            };

            let d1 = match ctx.env.d1("DB") {
                Ok(d1) => d1,
                Err(_) => return Response::error("Internal Server Error", 500),
            };
            let existing = match d1.prepare("
                select users.id, users.email, users.name,
                    case
                        when count(organizations.id) = 0 then '[]'
                        else json_group_array(
                            json_object(
                                'id', organizations.id,
                                'name', organizations.name,
                                'document', organizations.document,
                                'created_at', organizations.created_at
                            )
                        )
                    end as organizations
                from users
                left join memberships on memberships.user_id = users.id
                left join organizations on organizations.id = memberships.organization_id
                where users.email = ?1
                group by users.id
                ")
                .bind(&[email.to_string().into()])?
                .first::<AuthenticatedUser>(None)
                .await {
                    Ok(result) => result,
                    Err(e) => {
                        console_error!("Database select error: {:?}", e);
                        return Response::error("Internal Server Error", 500);
                    }
                };

            if let Some(user) = existing {
                let authenticated = AuthenticatedUserWithOrganizations {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    organizations: serde_json::from_str(&user.organizations)?,
                };

                let cookie = serde_json::to_string(&authenticated)?;

                let mut headers = Headers::new();
                headers.set("Set-Cookie", &format!("sqlsync-auth={}; HttpOnly; Path=/", cookie))?;

                return Ok(Response::ok("")?.with_headers(headers));
            } else {
                Response::error("Unauthorized", 401)
            }
        })
        .post_async("/auth/logout", |req, ctx| async move {
            let mut headers = Headers::new();
            headers.set("Set-Cookie", "sqlsync-auth=; HttpOnly; Path=/; Max-Age=0")?;

            return Ok(Response::ok("")?.with_headers(headers));
        })
        .on_async("/auth/refresh", |req, ctx| async move {
            return match get_authenticated_user(&req) {
                Ok(user) => Response::from_json(&user),
                Err(_) => return Response::error("Unauthorized", 401),
            };
        })
        .post_async("/doc/new", |mut req, ctx| async move {
            let user = match get_authenticated_user(&req) {
                Ok(user) => user,
                Err(_) => return Response::error("Unauthorized", 401),
            };

            let form = match req.form_data().await {
                Ok(form) => form,
                Err(_) => return Response::error("Bad Request", 400),
            };

            let name = match form.get("name") {
                Some(FormEntry::Field(name)) => name,
                _ => return Response::error("Bad Request", 400),
            };

            let namespace = ctx.durable_object(DURABLE_OBJECT_NAME)?;
            let document = object_id_to_journal_id(namespace.unique_id()?)?;

            let d1 = match ctx.env.d1("DB") {
                Ok(d1) => d1,
                Err(_) => return Response::error("Internal Server Error", 500),
            };

            let id = Uuid::new_v4().hyphenated();

            let organization = d1.prepare("
                insert into organizations (
                    id,
                    name,
                    document,
                    created_at
                ) values (?1, ?2, ?3, datetime('now'))
                returning id
            ")
            .bind(&[
                id.to_string().into(),
                name.to_string().into(),
                document.to_base58().into()
            ])?
            .first::<RecordWithId>(None)
            .await;

            match organization {
                Ok(result) => result,
                Err(e) => {
                    console_error!("Database select error: {:?}", e);
                    return Response::error("Internal Server Error", 500);
                }
            };

            let membership = d1.prepare("
                insert into memberships (
                    id,
                    organization_id,
                    user_id,
                    created_at,
                    status
                ) values (?1, ?2, ?3, datetime('now'), 'accepted')
                returning id
            ").bind(&[
                Uuid::new_v4().hyphenated().to_string().into(),
                id.to_string().into(),
                user.id.clone().into()
            ])?
            .first::<RecordWithId>(None)
            .await;

            match membership {
                Ok(result) => result,
                Err(e) => {
                    console_error!("Database insert error: {:?}", e);
                    return Response::error("Internal Server Error", 500);
                }
            };

            let journal_id = match namespace.id_from_string(&document.to_hex()) {
                Ok(id) => id,
                Err(e) => {
                    return Response::error(format!("Invalid Durable Object ID: {}", e), 400)
                }
            };

            let stub = journal_id.get_stub()?;
            let url = Url::parse(&format!("http://do?reducer={}", document.to_base58()))?;
            let body = json!({
                "tag": "AddUser",
                "id": user.id,
                "email": user.email,
                "name": user.name
            });
            let mut request = Request::new_with_init(
                &url.to_string(),
                RequestInit::new()
                    .with_method(Method::Post)
                    .with_body(Some(wasm_bindgen::JsValue::from_str(&body.to_string())))
            )?;
            request.headers_mut()?.set("Content-Type", "application/json")?;
            stub.fetch_with_request(request).await?;

            let existing = match d1.prepare("
                select users.id, users.email, users.name,
                    case
                        when count(organizations.id) = 0 then '[]'
                        else json_group_array(
                            json_object(
                                'id', organizations.id,
                                'name', organizations.name,
                                'document', organizations.document,
                                'created_at', organizations.created_at
                            )
                        )
                    end as organizations
                from users
                left join memberships on memberships.user_id = users.id
                left join organizations on organizations.id = memberships.organization_id
                where users.email = ?1
                group by users.id
                ")
                .bind(&[user.email.to_string().into()])?
                .first::<AuthenticatedUser>(None)
                .await {
                    Ok(result) => result,
                    Err(e) => {
                        console_error!("Database select error: {:?}", e);
                        return Response::error("Internal Server Error", 500);
                    }
                };

            if let Some(user) = existing {
                let authenticated = AuthenticatedUserWithOrganizations {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    organizations: serde_json::from_str(&user.organizations)?,
                };

                let cookie = serde_json::to_string(&authenticated)?;

                let mut headers = Headers::new();
                headers.set("Set-Cookie", &format!("sqlsync-auth={}; HttpOnly; Path=/", cookie))?;

                return Ok(Response::from_json(&json!({ "id": id.to_string() }))?.with_headers(headers));
            } else {
                Response::error("Unauthorized", 401)
            }
        })
        .post_async("/doc/:id/accept", |mut req, ctx| async move {
            let user = match get_authenticated_user(&req) {
                Ok(user) => user,
                Err(_) => return Response::error("Unauthorized", 401),
            };

            let d1 = match ctx.env.d1("DB") {
                Ok(d1) => d1,
                Err(_) => return Response::error("Internal Server Error", 500),
            };

            let body = req.text().await?;

            if let Some(id) = ctx.param("id") {
                let organization = d1.prepare("
                    select id from organizations where document = ?1
                ")
                .bind(&[id.to_string().into()])?
                .first::<RecordWithId>(None)
                .await;

                let org_id = match organization {
                    Ok(Some(record)) => record.id,
                    Ok(None) => return Response::error("Organization not found", 404),
                    Err(e) => {
                        console_error!("Database select error: {:?}", e);
                        return Response::error("Internal Server Error", 500);
                    }
                };

                let membership = d1.prepare("
                    insert into memberships (
                        id,
                        organization_id,
                        user_id,
                        created_at
                    ) values (?1, ?2, ?3, datetime('now'))
                    returning id
                ").bind(&[
                    Uuid::new_v4().hyphenated().to_string().into(),
                    org_id.into(),
                    user.id.clone().into()
                ])?
                .first::<RecordWithId>(None)
                .await;

                match membership {
                    Ok(result) => result,
                    Err(e) => {
                        console_error!("Database insert error: {:?}", e);
                        return Response::error("Internal Server Error", 500);
                    }
                };

                let namespace = ctx.durable_object(DURABLE_OBJECT_NAME)?;
                let journal_id = JournalId::from_base58(id).map_err(|e| Error::RustError(e.to_string()))?;
                let journal_id = match namespace.id_from_string(&journal_id.to_hex()) {
                    Ok(id) => id,
                    Err(e) => {
                        return Response::error(format!("Invalid Durable Object ID: {}", e), 400)
                    }
                };

                let stub = journal_id.get_stub()?;
                let url = Url::parse(&format!("http://do?reducer={}", id))?;
                let body = json!({
                    "tag": "AddUser",
                    "id": user.id,
                    "email": user.email,
                    "name": user.name
                });
                let mut request = Request::new_with_init(
                    &url.to_string(),
                    RequestInit::new()
                        .with_method(Method::Post)
                        .with_body(Some(wasm_bindgen::JsValue::from_str(&body.to_string())))
                )?;

                request.headers_mut()?.set("Content-Type", "application/json")?;

                let mut response = match stub.fetch_with_request(request).await {
                    Ok(response) => {
                        console_log!("Received response from Durable Object");
                        response
                    },
                    Err(e) => {
                        console_error!("Error fetching from Durable Object: {:?}", e);
                        return Response::error("Internal Server Error", 500);
                    }
                };
            }

            let existing = match d1.prepare("
                select users.id, users.email, users.name,
                    case
                        when count(organizations.id) = 0 then '[]'
                        else json_group_array(
                            json_object(
                                'id', organizations.id,
                                'name', organizations.name,
                                'document', organizations.document,
                                'created_at', organizations.created_at
                            )
                        )
                    end as organizations
                from users
                left join memberships on memberships.user_id = users.id
                left join organizations on organizations.id = memberships.organization_id
                where users.email = ?1
                group by users.id
                ")
                .bind(&[user.email.to_string().into()])?
                .first::<AuthenticatedUser>(None)
                .await {
                    Ok(result) => result,
                    Err(e) => {
                        console_error!("Database select error: {:?}", e);
                        return Response::error("Internal Server Error", 500);
                    }
                };

            if let Some(user) = existing {
                let authenticated = AuthenticatedUserWithOrganizations {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    organizations: serde_json::from_str(&user.organizations)?,
                };

                let cookie = serde_json::to_string(&authenticated)?;

                let mut headers = Headers::new();
                headers.set("Set-Cookie", &format!("sqlsync-auth={}; HttpOnly; Path=/", cookie))?;

                Ok(Response::ok("")?.with_headers(headers))
            } else {
                Response::error("Unauthorized", 401)
            }
        })
        .on_async("/doc/:id", |mut req, ctx| async move {
            let user = match get_authenticated_user(&req) {
                Ok(user) => user,
                Err(_) => return Response::error("Unauthorized", 401),
            };
            let body = req.text().await?;

            if let Some(id) = ctx.param("id") {
                let namespace = ctx.durable_object(DURABLE_OBJECT_NAME)?;
                let id = JournalId::from_base58(id).map_err(|e| Error::RustError(e.to_string()))?;
                let id = match namespace.id_from_string(&id.to_hex()) {
                    Ok(id) => id,
                    Err(e) => {
                        return Response::error(format!("Invalid Durable Object ID: {}", e), 400)
                    }
                };
                let stub = id.get_stub()?;

                match stub.fetch_with_request(req).await {
                    Ok(response) => Ok(response),
                    Err(e) => {
                        console_error!("Error fetching from Durable Object: {:?}", e);
                        Response::error("Internal Server Error", 500)
                    }
                }
            } else {
                Response::error("Bad Request", 400)
            }
        })
        .put_async("/dev/reducer", |req, ctx| async move {
            // upload a reducer to the bucket
            let bucket = ctx.bucket(REDUCER_BUCKET)?;

            let data_len: u64 = match req.headers().get("Content-Length")?.map(|s| s.parse()) {
                Some(Ok(len)) => len,
                _ => return Response::error("Bad Request", 400),
            };
            if data_len > 10 * 1024 * 1024 {
                return Response::error("Payload Too Large", 413);
            }

            // let mut data = req.bytes().await?;
            let data = JsFuture::from(req.inner().array_buffer()?)
                .await?
                .dyn_into::<ArrayBuffer>()
                .expect("expected ArrayBuffer");

            let global = js_sys::global()
                .dyn_into::<js_sys::Object>()
                .expect("global not found");
            let subtle = Reflect::get(&global, &"crypto".into())?
                .dyn_into::<web_sys::Crypto>()
                .expect("crypto not found")
                .subtle();

            // sha256 sum the data and convert to bs58
            let digest =
                JsFuture::from(subtle.digest_with_str_and_buffer_source("SHA-256", &data)?).await?;

            // convert digest to base58
            let digest = bs58::encode(Uint8Array::new(&digest).to_vec())
                .with_alphabet(bs58::Alphabet::BITCOIN)
                .into_string();
            let name = format!("{}.wasm", digest);

            console_log!(
                "uploading reducer (size: {} MB) to {}",
                data_len / 1024 / 1024,
                name
            );

            // read data into Vec<u8>
            let data = Uint8Array::new(&data).to_vec();

            bucket.put(&name, data).execute().await?;
            Response::ok(name)
        })
        .run(req, env)
        .await?
        .with_cors(&cors)
}

pub fn object_id_to_journal_id(id: ObjectId) -> Result<JournalId> {
    JournalId::from_hex(&id.to_string()).map_err(|e| e.to_string().into())
}
