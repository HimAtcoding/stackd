// Validate stage for a hand-written Explore file in data/raw/explore (21): one major's UC Transfer Pathway and its
// Transfer Model Curriculum (TMC), their requirements, and the UC campuses the pathway covers. Strict like the others:
// every problem is listed, and any problem stops the import before the database. Requirements and campuses take their
// pathway's source. A "todo" on any row is a fact a person still has to confirm, and stops the import until it's deleted.
import { EXPLORE_HOSTS } from "./config.mjs";
import { CYCLE, httpsProblem, PLACEHOLDER, SLUG } from "./deadlines.mjs";
import { academicYearProblem } from "./planning.mjs";

export const C_ID = /^[A-Z]{2,5} \d{3}[A-Z]?$/;
const KINDS = ["uc_pathway", "tmc"];
const PROVENANCE = ["source_name", "source_url", "academic_year", "retrieved_at"];
const PATHWAY_FIELDS = ["kind", "name", "code", "revision", "degree_name", "major_units", "total_units", "effective_term", ...PROVENANCE, "requirements", "campuses", "todo"];
const TMC_ONLY = ["code", "revision", "degree_name", "major_units", "total_units"];
const REQUIREMENT_FIELDS = ["code", "sort", "topic", "name", "description", "how_many", "units", "c_id", "options", "todo"];
const CAMPUS_FIELDS = ["institution", "major_names", "todo"];

const text = (v) => typeof v === "string" && v.trim() !== "";
const positive = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

// Returns { payload, problems }. payload holds pathways, pathway_requirements and pathway_campuses, flat, in the shape
// apply_explore_batch expects.
export function validateExploreFile(file) {
  const problems = [];
  const say = (where, msg) => problems.push(`${where}: ${msg}`);

  if (!file || typeof file !== "object" || Array.isArray(file)) return { payload: null, problems: ["the file must be a JSON object"] };
  for (const key of Object.keys(file)) {
    if (!["written_by", "notes", "slug", "pathways"].includes(key)) say(key, "isn't a section an Explore file can have (slug, pathways, written_by, notes)");
  }
  if (!text(file.written_by) || PLACEHOLDER.test(file.written_by)) say("written_by", "say who wrote this file");
  if (!text(file.slug) || !SLUG.test(file.slug)) say("slug", "must be the major's slug, lowercase letters, numbers and dashes (like computer-science)");
  if (!Array.isArray(file.pathways) || file.pathways.length === 0) {
    say("pathways", "must be a list with the UC pathway, the TMC, or both");
    return { payload: null, problems };
  }

  const payload = { pathways: [], pathway_requirements: [], pathway_campuses: [] };
  const kinds = new Set();

  // Every string in a row: no placeholders left
  const noPlaceholders = (where, row) => {
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === "string" && PLACEHOLDER.test(value)) say(where, `${key} still has a placeholder ("${value}")`);
    }
  };
  const fieldsOk = (where, row, allowed) => {
    for (const key of Object.keys(row)) {
      if (key === "verification_status" || key === "verified_at") say(where, `${key} can't be set by an import; rows start unverified and are verified with verify.mjs after a person checks them`);
      else if (!allowed.includes(key)) say(where, `${key} isn't a field this table takes`);
    }
    if (row.todo !== undefined) say(where, `still has a todo ("${row.todo}"). Confirm it against the source, then delete the todo`);
  };
  const cIdsOk = (where, ids, label) => {
    if (!Array.isArray(ids) || ids.some((c) => typeof c !== "string" || !C_ID.test(c))) say(where, `${label} must be a list of C-ID numbers written like COMP 122 or MATH 900S`);
  };

  file.pathways.forEach((p, i) => {
    const where = `pathways[${i}]${p?.kind ? ` (${p.kind})` : ""}`;
    if (!p || typeof p !== "object" || Array.isArray(p)) return say(where, "must be an object");
    fieldsOk(where, p, PATHWAY_FIELDS);
    noPlaceholders(where, p);

    if (!KINDS.includes(p.kind)) return say(where, "kind must be uc_pathway or tmc");
    if (kinds.has(p.kind)) say(where, `a major has one ${p.kind}; this file lists it twice`);
    kinds.add(p.kind);
    if (!text(p.name)) say(where, "name is missing");

    // Source
    for (const key of PROVENANCE) {
      if (key === "retrieved_at" && p[key] === "") say(where, "retrieved_at is empty: check this pathway, its requirements and campuses against source_url, then fill in the date you checked them (like 2026-10-31)");
      else if (!text(p[key])) say(where, `${key} is missing`);
    }
    if (text(p.academic_year) && !PLACEHOLDER.test(p.academic_year)) {
      const problem = academicYearProblem(p.academic_year);
      if (problem) say(where, `academic_year ${problem}`);
    }
    if (text(p.retrieved_at) && !PLACEHOLDER.test(p.retrieved_at)) {
      const t = Date.parse(p.retrieved_at);
      if (!/^\d{4}-\d{2}-\d{2}/.test(p.retrieved_at) || Number.isNaN(t)) say(where, "retrieved_at must be a date like 2026-10-31");
      else if (t > Date.now() + 86_400_000) say(where, "retrieved_at is in the future");
    }
    if (text(p.source_url) && !PLACEHOLDER.test(p.source_url)) {
      const problem = httpsProblem(p.source_url);
      if (problem) say(where, `source_url ${problem}`);
      else {
        const host = new URL(p.source_url).hostname;
        const hosts = EXPLORE_HOSTS[p.kind];
        if (!hosts.some((h) => host === h || host.endsWith(`.${h}`))) say(where, `source_url must be on ${hosts.join(" or ")} for a ${p.kind}`);
      }
    }
    if (p.effective_term !== undefined && p.effective_term !== null && !(typeof p.effective_term === "string" && CYCLE.test(p.effective_term))) {
      say(where, "effective_term must be null or look like fall-2027");
    }

    // The TMC's template fields, which a UC pathway doesn't have
    if (p.kind === "tmc") {
      if (!(typeof p.code === "string" && /^\d+$/.test(p.code))) say(where, 'code must be the template number as text, like "2007"');
      if (!text(p.revision)) say(where, "revision is missing");
      if (!text(p.degree_name)) say(where, "degree_name is missing");
      if (!positive(p.major_units)) say(where, "major_units must be a number above 0");
      if (!positive(p.total_units)) say(where, "total_units must be a number above 0");
    } else {
      for (const key of TMC_ONLY) if (p[key] !== undefined && p[key] !== null) say(where, `${key} is for a TMC; a UC pathway leaves it out`);
    }

    const prov = { source_name: p.source_name, source_url: p.source_url, academic_year: p.academic_year, retrieved_at: p.retrieved_at };
    const owner = { pathway: file.slug, kind: p.kind };
    payload.pathways.push({
      slug: file.slug, kind: p.kind, name: p.name, code: p.code ?? null, revision: p.revision ?? null, degree_name: p.degree_name ?? null,
      major_units: p.major_units ?? null, total_units: p.total_units ?? null, effective_term: p.effective_term ?? null, ...prov,
    });

    // Requirements
    const reqs = p.requirements;
    if (!Array.isArray(reqs) || reqs.length === 0) say(where, "requirements must be a list with at least one requirement");
    const seen = new Set();
    let unitTotal = 0;
    (Array.isArray(reqs) ? reqs : []).forEach((r, j) => {
      const rw = `${where} requirements[${j}]${r?.code ? ` (${r.code})` : ""}`;
      if (!r || typeof r !== "object" || Array.isArray(r)) return say(rw, "must be an object");
      fieldsOk(rw, r, REQUIREMENT_FIELDS);
      noPlaceholders(rw, r);
      for (const key of ["code", "topic", "name", "description", "how_many"]) if (!text(r[key])) say(rw, `${key} is missing`);
      for (const key of ["code", "topic"]) if (text(r[key]) && !SLUG.test(r[key])) say(rw, `${key} must be lowercase letters, numbers and dashes`);
      if (!Number.isInteger(r.sort) || r.sort < 1) say(rw, "sort must be a whole number from 1");
      for (const [key, value] of [["code", r.code], ["sort", r.sort], ["topic", r.topic]]) {
        if (value === undefined) continue;
        if (seen.has(`${key}:${value}`)) say(rw, `${key} appears twice in this pathway`);
        seen.add(`${key}:${value}`);
      }
      const cId = r.c_id ?? [];
      const options = r.options ?? [];
      cIdsOk(rw, cId, "c_id");
      if (!Array.isArray(options)) say(rw, "options must be a list");
      else {
        options.forEach((o, k) => {
          const ow = `${rw} options[${k}]`;
          if (!o || typeof o !== "object" || Array.isArray(o)) return say(ow, "must be an object");
          for (const key of Object.keys(o)) if (!["label", "c_id", "units"].includes(key)) say(ow, `${key} isn't a field an option takes (label, c_id, units)`);
          if (!text(o.label)) say(ow, "label is missing");
          if (!Array.isArray(o.c_id) || o.c_id.length === 0) say(ow, "c_id must list at least one C-ID number");
          else cIdsOk(ow, o.c_id, "c_id");
          if (!positive(o.units)) say(ow, "units must be a number above 0");
        });
      }
      if (r.units !== undefined && r.units !== null && !positive(r.units)) say(rw, "units must be a number above 0, or left out");

      if (p.kind === "tmc") {
        const hasCId = Array.isArray(cId) && cId.length > 0;
        const hasOptions = Array.isArray(options) && options.length > 0;
        if (hasCId === hasOptions) say(rw, "a TMC requirement names its C-ID numbers in c_id, or lists options to pick from, not both");
        if (!positive(r.units)) say(rw, "units is missing (the template's minimum semester units)");
        if (hasOptions && positive(r.units) && options.every((o) => positive(o.units))) {
          const least = Math.min(...options.map((o) => o.units));
          if (r.units !== least) say(rw, `units must be the smallest option's units (${least})`);
        }
        if (positive(r.units)) unitTotal += r.units;
      } else if ((Array.isArray(cId) && cId.length) || (Array.isArray(options) && options.length)) {
        say(rw, "a UC pathway names course types, not C-ID numbers; leave c_id and options out");
      }
      payload.pathway_requirements.push({
        ...owner, code: r.code, sort: r.sort, topic: r.topic, name: r.name, description: r.description, how_many: r.how_many,
        units: r.units ?? null, c_id: cId, options, ...prov,
      });
    });
    if (p.kind === "tmc" && positive(p.major_units) && Array.isArray(reqs) && unitTotal !== p.major_units) {
      say(where, `the requirements add up to ${unitTotal} units, but major_units is ${p.major_units}`);
    }

    // Campuses: UC pathways only
    const campuses = p.campuses ?? [];
    if (!Array.isArray(campuses)) say(where, "campuses must be a list");
    else if (p.kind === "tmc" && campuses.length) say(where, "campuses are for the UC pathway; a TMC doesn't list campuses");
    else {
      const seenCampus = new Set();
      campuses.forEach((c, j) => {
        const cw = `${where} campuses[${j}]${c?.institution ? ` (${c.institution})` : ""}`;
        if (!c || typeof c !== "object" || Array.isArray(c)) return say(cw, "must be an object");
        fieldsOk(cw, c, CAMPUS_FIELDS);
        noPlaceholders(cw, c);
        if (!text(c.institution) || !SLUG.test(c.institution)) say(cw, "institution must be the campus's slug, like uc-san-diego");
        else if (seenCampus.has(c.institution)) say(cw, "appears twice in this pathway");
        seenCampus.add(c.institution);
        if (!Array.isArray(c.major_names) || c.major_names.length === 0 || c.major_names.some((n) => !text(n))) say(cw, "major_names must list the campus majors the pathway covers there");
        else for (const n of c.major_names) if (PLACEHOLDER.test(n)) say(cw, `major_names still has a placeholder ("${n}")`);
        payload.pathway_campuses.push({ ...owner, institution: c.institution, major_names: c.major_names, ...prov });
      });
    }
  });

  return { payload: problems.length ? null : payload, problems };
}

// The topics a major's two pathways share: what the app shows as "Counts for both"
export function sharedTopics(requirements) {
  const uc = new Set(requirements.filter((r) => r.kind === "uc_pathway").map((r) => r.topic));
  return [...new Set(requirements.filter((r) => r.kind === "tmc" && uc.has(r.topic)).map((r) => r.topic))];
}
