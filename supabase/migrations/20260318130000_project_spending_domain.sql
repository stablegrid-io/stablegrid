alter table public.project_spending
  add column if not exists domain text not null default 'General'
    check (domain in (
      'Infrastructure',
      'Product',
      'AI / ML',
      'Marketing',
      'Operations',
      'Content',
      'General'
    ));
