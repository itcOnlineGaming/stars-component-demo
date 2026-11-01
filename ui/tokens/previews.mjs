// The records behind the design token previews: build ids, builds.json, pruning and
// the index page. Pure functions, so publish.mjs only has to move files around.
import { createHash } from 'node:crypto';

export const STATUSES = ['pending', 'approved', 'rejected'];
export const KEEP_NEWEST = 20;
const ID = /^\d{4}-\d{2}-\d{2}-\d{4}-[0-9a-f]{4}$/;

export const isBuildId = (value) => ID.test(value);

/** First four hex characters of a hash of the tokens.json text. */
export const tokensHash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 4);

/** yyyy-mm-dd-hhmm-hash: a plain directory listing sorts oldest to newest. */
export function buildId(date, hash) {
	const pad = (n) => String(n).padStart(2, '0');
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	return `${day}-${pad(date.getHours())}${pad(date.getMinutes())}-${hash}`;
}

/** A new pending entry for builds.json. */
export const newEntry = ({ id, date, hash, summary, hasChanges }) => ({
	id,
	date: date.toISOString(),
	hash,
	summary,
	status: 'pending',
	changes: Boolean(hasChanges)
});

/** builds.json text -> entries, tolerating a missing or empty file. */
export function parseBuilds(text) {
	if (!text || !text.trim()) return [];
	const builds = JSON.parse(text);
	if (!Array.isArray(builds)) throw new Error('builds.json must be a list');
	return builds;
}

export const serialiseBuilds = (builds) => `${JSON.stringify(builds, null, '\t')}\n`;

/** The list with `entry` added, replacing an earlier build with the same id (a re-run). */
export const addBuild = (builds, entry) =>
	[...builds.filter((build) => build.id !== entry.id), entry].sort((a, b) =>
		a.id.localeCompare(b.id)
	);

export function setStatus(builds, id, status) {
	if (!STATUSES.includes(status)) throw new Error(`status must be one of: ${STATUSES.join(', ')}`);
	if (!builds.some((build) => build.id === id)) throw new Error(`No build ${id}`);
	return builds.map((build) => (build.id === id ? { ...build, status } : build));
}

/**
 * Ids to delete: everything older than the newest `keep`, except approved builds and
 * the one whose hash matches the committed tokens.json (the preview of what shipped).
 */
export function idsToPrune(builds, { keep = KEEP_NEWEST, committedHash = null } = {}) {
	const newestFirst = [...builds].sort((a, b) => b.id.localeCompare(a.id));
	return newestFirst
		.slice(keep)
		.filter((build) => build.status !== 'approved' && build.hash !== committedHash)
		.map((build) => build.id);
}

const escapeHtml = (value) =>
	String(value).replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
	);

/** The index page the designer bookmarks: newest build first. */
export function renderIndex(builds) {
	const rows = [...builds]
		.sort((a, b) => b.id.localeCompare(a.id))
		.map((build) => {
			const status = STATUSES.includes(build.status) ? build.status : 'pending';
			const changes = build.changes
				? ` · <a href="${escapeHtml(build.id)}/changes.txt">changes</a>`
				: '';
			return `<tr>
<td><a href="${escapeHtml(build.id)}/">${escapeHtml(build.id)}</a></td>
<td>${escapeHtml(build.date.slice(0, 16).replace('T', ' '))}</td>
<td>${escapeHtml(build.summary)}${changes}</td>
<td><span class="status ${status}">${status}</span></td>
</tr>`;
		})
		.join('\n');
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Design token previews</title>
<style>
body { font: 16px/1.5 system-ui, sans-serif; margin: 0; padding: 1rem; color: #1e293b; background: #f8fafc; }
@media (prefers-color-scheme: dark) { body { color: #e2e8f0; background: #0f172a; } a { color: #93c5fd; } }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #94a3b855; vertical-align: top; }
.status { padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.875rem; }
.pending { background: #fef3c7; color: #78350f; }
.approved { background: #dcfce7; color: #14532d; }
.rejected { background: #fee2e2; color: #7f1d1d; }
</style>
</head>
<body>
<h1>Design token previews</h1>
<p>Each row is a Storybook built from a tokens.json. Newest first.</p>
<table>
<thead><tr><th>Build</th><th>Date</th><th>Changes</th><th>Status</th></tr></thead>
<tbody>
${rows || '<tr><td colspan="4">No previews yet.</td></tr>'}
</tbody>
</table>
</body>
</html>
`;
}
