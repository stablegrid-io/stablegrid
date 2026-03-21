create table if not exists public.project_spending (
  id          uuid        primary key default gen_random_uuid(),
  date        date        not null,
  category    text        not null check (category in (
                'Hosting',
                'AI / APIs',
                'Subscriptions',
                'Design',
                'Development',
                'Marketing',
                'Miscellaneous'
              )),
  amount      numeric(10, 2) not null check (amount > 0),
  description text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_project_spending_date
  on public.project_spending (date desc);

alter table public.project_spending enable row level security;
-- Accessible only via service role (admin API routes) — no public policies needed.
