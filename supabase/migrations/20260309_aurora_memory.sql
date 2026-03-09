create extension if not exists vector;

create table if not exists knowledge_documents (
  id bigserial primary key,
  source text not null,
  title text not null,
  url text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_documents_source_idx
  on knowledge_documents(source);

create index if not exists knowledge_documents_updated_at_idx
  on knowledge_documents(updated_at desc);
