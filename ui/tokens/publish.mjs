// Builds Storybook for the current tokens.json and publishes it as a design token
// preview the designer can open, then records it on the preview index page.
//
//   npm run tokens:publish -- [--changes changes_<ts>.txt] [--target <t>] [--keep N]
//   npm run tokens:status -- <build id> approved|rejected|pending
//
// A target is user@host:/remote/dir (over ssh/scp, like deploy.sh) or a local
// directory, which is how to try it without a server. Defaults can be set with
// TOKENS_PREVIEW_TARGET and TOKENS_PREVIEW_URL. Never commits anything.
import { execFileSync } from 'node:child_process';
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
	cpSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { committedTokensText } from './check-usage.mjs';
import { formatDiff, pendingDiff, summarise } from './token-diff.mjs';
import {
	KEEP_NEWEST,
	addBuild,
	buildId,
	idsToPrune,
	isBuildId,
	newEntry,
	parseBuilds,
	renderIndex,
	serialiseBuilds,
	setStatus,
	tokensHash
} from './previews.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const starsDir = join(here, '..', '..', 'stars');
const DEFAULT_TARGET = 'deployer@compucore3.setu.ie:/var/www/storybook-previews/dev';
const DEFAULT_URL = 'https://compucore3.setu.ie/storybook/dev';
const REMOTE = /^([\w.-]+@[\w.-]+):(\/[\w./-]+)$/;

/** Where previews live: a directory on this machine. */
export function localTransport(dir) {
	return {
		describe: dir,
		read: (name) => (existsSync(join(dir, name)) ? readFileSync(join(dir, name), 'utf8') : null),
		write(name, content) {
			mkdirSync(dir, { recursive: true });
			writeFileSync(join(dir, name), content);
		},
		putDir(localDir, name) {
			rmSync(join(dir, name), { recursive: true, force: true });
			mkdirSync(dir, { recursive: true });
			cpSync(localDir, join(dir, name), { recursive: true });
		},
		remove: (name) => rmSync(join(dir, name), { recursive: true, force: true })
	};
}

/** Where previews live: a directory on a server, reached with ssh and scp. */
export function sshTransport(userHost, path) {
	const ssh = (command, input) =>
		execFileSync('ssh', [userHost, command], {
			input,
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'inherit']
		});
	return {
		describe: `${userHost}:${path}`,
		read(name) {
			try {
				return ssh(`cat '${path}/${name}'`);
			} catch {
				return null;
			}
		},
		write(name, content) {
			ssh(`mkdir -p '${path}' && cat > '${path}/${name}'`, content);
		},
		putDir(localDir, name) {
			if (!isBuildId(name)) throw new Error(`Refusing to publish to ${name}`);
			ssh(`rm -rf '${path}/${name}' && mkdir -p '${path}/${name}'`);
			execFileSync('scp', ['-r', `${localDir}/.`, `${userHost}:${path}/${name}/`], {
				stdio: 'inherit'
			});
		},
		remove(name) {
			if (!isBuildId(name)) throw new Error(`Refusing to delete ${name}`);
			ssh(`rm -rf '${path}/${name}'`);
		}
	};
}

export function transportFor(target) {
	const remote = REMOTE.exec(target);
	return remote ? sshTransport(remote[1], remote[2]) : localTransport(resolve(target));
}

function buildStorybook(outDir) {
	execFileSync('npx', ['storybook', 'build', '-o', outDir, '--quiet'], {
		cwd: starsDir,
		stdio: 'inherit'
	});
}

/**
 * Publish a preview of `tokensText` to `transport` and update builds.json and the index.
 * Returns { id, url, entry, pruned }. Everything outside the transport is injectable.
 */
export function publish({
	transport,
	tokensText,
	diff,
	changesFile = null,
	urlBase = DEFAULT_URL,
	now = new Date(),
	keep = KEEP_NEWEST,
	committedHash = null,
	storybookBuild = buildStorybook
}) {
	if (changesFile && !existsSync(changesFile)) {
		throw new Error(`Changes file not found: ${changesFile}`);
	}
	const hash = tokensHash(tokensText);
	const id = buildId(now, hash);
	const staging = mkdtempSync(join(tmpdir(), 'token-preview-'));
	try {
		storybookBuild(staging);
		if (changesFile) copyFileSync(changesFile, join(staging, 'changes.txt'));
		transport.putDir(staging, id);
	} finally {
		rmSync(staging, { recursive: true, force: true });
	}
	const entry = newEntry({
		id,
		date: now,
		hash,
		summary: diff ? summarise(diff) : 'No committed tokens.json to compare with',
		hasChanges: Boolean(changesFile)
	});
	let builds = addBuild(parseBuilds(transport.read('builds.json')), entry);
	const pruned = idsToPrune(builds, { keep, committedHash });
	pruned.forEach((old) => transport.remove(old));
	builds = builds.filter((build) => !pruned.includes(build.id));
	transport.write('builds.json', serialiseBuilds(builds));
	transport.write('index.html', renderIndex(builds));
	return { id, url: `${urlBase}/${id}/`, entry, pruned };
}

/** Set a build's status and regenerate the index. */
export function updateStatus({ transport, id, status }) {
	const builds = setStatus(parseBuilds(transport.read('builds.json')), id, status);
	transport.write('builds.json', serialiseBuilds(builds));
	transport.write('index.html', renderIndex(builds));
	return builds.find((build) => build.id === id);
}

function option(args, name) {
	const index = args.indexOf(name);
	return index === -1 ? null : args[index + 1];
}

async function main(args) {
	const [command, ...rest] = args;
	const target = option(rest, '--target') ?? process.env.TOKENS_PREVIEW_TARGET ?? DEFAULT_TARGET;
	const urlBase = (process.env.TOKENS_PREVIEW_URL ?? DEFAULT_URL).replace(/\/$/, '');
	const transport = transportFor(target);

	if (command === 'status') {
		const [id, status] = rest;
		const entry = updateStatus({ transport, id, status });
		console.log(`${entry.id}: ${entry.status}`);
		return;
	}
	if (command !== 'publish') {
		console.error('usage: publish [--changes file] [--target t] [--keep N] | status <id> <status>');
		process.exit(2);
	}
	const diff = pendingDiff();
	const committed = committedTokensText();
	const result = publish({
		transport,
		tokensText: readFileSync(join(here, 'tokens.json'), 'utf8'),
		diff,
		changesFile: option(rest, '--changes'),
		urlBase,
		keep: Number(option(rest, '--keep') ?? KEEP_NEWEST),
		committedHash: committed ? tokensHash(committed) : null
	});
	console.log(`\nPreview ${result.id} published to ${transport.describe}`);
	console.log(`Link:   ${result.url}`);
	console.log(`Index:  ${urlBase}/`);
	if (result.pruned.length) console.log(`Pruned: ${result.pruned.join(', ')}`);
	console.log(`\n${diff ? formatDiff(diff) : 'No committed tokens.json to compare with.'}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
