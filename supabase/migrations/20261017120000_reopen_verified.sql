-- Reopening a verified row (docs/date-check.md → Fixing a verified row). The protect_verified trigger still refuses
-- any change to a verified row; reopen_verified_row is the one way around it. It sets a deadline, checklist or
-- checklist step back to unverified and logs who did it, when and why. The corrected file is then imported and
-- the row verified again, the same as a new one. Only the service role can call it.

create table reopen_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id uuid not null,
  -- What the row was, as the dry run showed it
  record text not null,
  reopened_by text not null check (length(trim(reopened_by)) > 0),
  reason text not null check (length(trim(reason)) > 0),
  -- When the row had been verified, before this reopened it
  was_verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table reopen_log enable row level security;
revoke all on reopen_log from anon, authenticated;

-- A dry run only finds the row and says what would happen
create function reopen_verified_row(p_id uuid, p_by text, p_reason text, p_dry_run boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_table text;
  v_record text;
  v_status verification_status;
  v_verified_at timestamptz;
begin
  if coalesce(trim(p_by), '') = '' or coalesce(trim(p_reason), '') = '' then
    raise exception 'say who is reopening the row and why';
  end if;

  select 'deadlines', d.slug, d.verification_status, d.verified_at into v_table, v_record, v_status, v_verified_at
    from deadlines d where d.id = p_id;
  if not found then
    select 'checklists', c.slug, c.verification_status, c.verified_at into v_table, v_record, v_status, v_verified_at
      from checklists c where c.id = p_id;
  end if;
  if not found then
    select 'checklist_steps', c.slug || ' step ' || s.position || ': ' || s.title, s.verification_status, s.verified_at
      into v_table, v_record, v_status, v_verified_at
      from checklist_steps s join checklists c on c.id = s.checklist_id where s.id = p_id;
  end if;
  if not found then
    raise exception 'no deadline, checklist or checklist step has id %', p_id;
  end if;
  if v_status <> 'verified' then
    raise exception '% row % (%) isn''t verified, so it can be fixed in the file and imported as it is', v_table, p_id, v_record;
  end if;

  if p_dry_run then
    return jsonb_build_object('status', 'dry_run', 'table', v_table, 'id', p_id, 'record', v_record, 'verified_at', v_verified_at);
  end if;

  -- On for this one update only, then off again
  perform set_config('stackd.allow_verified_change', 'on', true);
  execute format('update %I set verification_status = ''unverified'', verified_at = null where id = $1', v_table) using p_id;
  perform set_config('stackd.allow_verified_change', 'off', true);

  insert into reopen_log (table_name, row_id, record, reopened_by, reason, was_verified_at)
  values (v_table, p_id, v_record, trim(p_by), trim(p_reason), v_verified_at);
  return jsonb_build_object('status', 'reopened', 'table', v_table, 'id', p_id, 'record', v_record, 'verified_at', v_verified_at);
end $$;

revoke all on function reopen_verified_row(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function reopen_verified_row(uuid, text, text, boolean) to service_role;
