-- Explore: a TMC option may have no C-ID number. Templates list choices like "any course articulated for the major"
-- that have none. An option still needs a label and units, and any number it gives must still be well formed.
-- A missing key makes these tests NULL, which bool_and skips, so NULL counts as a failure.

create or replace function valid_pathway_options(opts jsonb) returns boolean language sql immutable as $$
  select jsonb_typeof(opts) = 'array' and coalesce((
    select bool_and(coalesce(
      jsonb_typeof(o) = 'object'
      and (o - 'label' - 'c_id' - 'units') = '{}'::jsonb
      and jsonb_typeof(o -> 'label') = 'string' and length(trim(o ->> 'label')) > 0
      and jsonb_typeof(o -> 'units') = 'number' and (o ->> 'units')::numeric > 0
      and jsonb_typeof(o -> 'c_id') = 'array'
      and coalesce((select bool_and(jsonb_typeof(c) = 'string' and (c #>> '{}') ~ '^[A-Z]{2,5} \d{3}[A-Z]?$')
        from jsonb_array_elements(case when jsonb_typeof(o -> 'c_id') = 'array' then o -> 'c_id' else '[]' end) c), true),
      false))
    from jsonb_array_elements(case when jsonb_typeof(opts) = 'array' then opts else '[]' end) o), true)
$$;
