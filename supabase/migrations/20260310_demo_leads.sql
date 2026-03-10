create table if not exists demo_leads (
  id            bigserial primary key,
  decision_id   text        not null,
  decision_hash text        not null,
  timestamp     timestamptz not null default now(),
  input         text        not null,
  forma         text,
  exposicion    text,
  presion       text,
  posicion      text,
  ventana       text,
  name          text        not null,
  email         text        not null,
  company       text,
  email_domain  text,
  created_at    timestamptz not null default now()
);

create index if not exists demo_leads_email_idx
  on demo_leads(email);

create index if not exists demo_leads_created_at_idx
  on demo_leads(created_at desc);

create index if not exists demo_leads_decision_hash_idx
  on demo_leads(decision_hash);
