create table if not exists organizations (
    id text primary key,
    name text not null,
    document text not null,
    created_at text not null
);

create table if not exists users (
    id text primary key,
    email text not null,
    name text not null,
    created_at text not null
);

create table if not exists memberships (
    id text primary key,
    organization_id text not null,
    user_id text not null,
    created_at text not null,
    status text check(status in ('pending', 'rejected', 'accepted')) not null default 'pending',
    foreign key (organization_id) references organizations(id),
    foreign key (user_id) references users(id)
);
