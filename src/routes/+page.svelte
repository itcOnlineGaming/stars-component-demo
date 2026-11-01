<script lang="ts">
	import { Badge, Button, Card } from '$ui/components';
	import {
		SelfEfficacyChecklist,
		createHttpSelfEfficacyApi,
		createMockSelfEfficacyApi
	} from '$lib/component';

	type LookMode = 'standard' | 'gamified';
	type ThemeMode = 'light' | 'dark';
	type ApiStage = 'stage1-mock' | 'stage2-http';

	let look = $state<LookMode>('standard');
	let theme = $state<ThemeMode>('light');
	let apiStage = $state<ApiStage>('stage1-mock');
	let showJsonInspector = $state(false);
	let lastApiCall = $state<{ method: string; endpoint: string; response: unknown } | null>(
		null
	);

	function applyTheme(nextLook: LookMode, nextTheme: ThemeMode) {
		look = nextLook;
		theme = nextTheme;
		if (typeof document !== 'undefined') {
			document.documentElement.dataset.look = nextLook;
			document.documentElement.dataset.theme = nextTheme;
		}
	}

	const activeApi = $derived(
		apiStage === 'stage1-mock'
			? createMockSelfEfficacyApi({
					onRequestLog: (entry) => {
						lastApiCall = entry;
					}
				})
			: createHttpSelfEfficacyApi('/stars/api/self-efficacy')
	);
</script>

<svelte:head>
	<title>STARS Student Component Sandbox — Self-Efficacy Checklist</title>
</svelte:head>

<div class="sandbox-page">
	<header class="sandbox-bar" aria-label="Developer sandbox controls">
		<div class="sandbox-bar-inner">
			<div class="sandbox-brand">
				<Badge variant="success">Student Sandbox</Badge>
				<span class="sandbox-label">
					Component folder: <code>src/lib/component/</code>
				</span>
			</div>

			<div class="sandbox-controls">
				<div class="control-cluster" role="group" aria-label="API stage mode">
					<Button
						size="sm"
						variant={apiStage === 'stage1-mock' ? 'primary' : 'secondary'}
						aria-pressed={apiStage === 'stage1-mock'}
						onclick={() => (apiStage = 'stage1-mock')}
					>
						Stage 1: Mock JSON API
					</Button>
					<Button
						size="sm"
						variant={apiStage === 'stage2-http' ? 'primary' : 'secondary'}
						aria-pressed={apiStage === 'stage2-http'}
						onclick={() => (apiStage = 'stage2-http')}
					>
						Stage 2: Live HTTP API
					</Button>
					<Button
						size="sm"
						variant="secondary"
						aria-expanded={showJsonInspector}
						onclick={() => (showJsonInspector = !showJsonInspector)}
					>
						{showJsonInspector ? 'Hide JSON Inspector' : 'Inspect API JSON'}
					</Button>
				</div>

				<div class="control-cluster" role="group" aria-label="Theme preview">
					<Button
						size="sm"
						variant={look === 'standard' && theme === 'light' ? 'primary' : 'secondary'}
						onclick={() => applyTheme('standard', 'light')}
					>
						Standard Light
					</Button>
					<Button
						size="sm"
						variant={look === 'standard' && theme === 'dark' ? 'primary' : 'secondary'}
						onclick={() => applyTheme('standard', 'dark')}
					>
						Standard Dark
					</Button>
					<Button
						size="sm"
						variant={look === 'gamified' && theme === 'dark' ? 'primary' : 'secondary'}
						onclick={() => applyTheme('gamified', 'dark')}
					>
						Gamified Dark
					</Button>
					<Button
						size="sm"
						variant={look === 'gamified' && theme === 'light' ? 'primary' : 'secondary'}
						onclick={() => applyTheme('gamified', 'light')}
					>
						Gamified Light
					</Button>
				</div>
			</div>
		</div>

		{#if showJsonInspector && lastApiCall}
			<div class="inspector-drawer">
				<Card variant="flat" padding="sm">
					<div class="inspector-header">
						<Badge variant="neutral">{lastApiCall.method}</Badge>
						<code class="inspector-endpoint">{lastApiCall.endpoint}</code>
					</div>
					<pre class="inspector-pre">{JSON.stringify(lastApiCall.response, null, 2)}</pre>
				</Card>
			</div>
		{/if}
	</header>

	<main>
		<SelfEfficacyChecklist api={activeApi} />
	</main>
</div>

<style>
	.sandbox-page {
		min-height: 100vh;
		background: var(--color-surface);
		color: var(--color-text-primary);
		font-family: var(--font-sans);
	}

	.sandbox-bar {
		background: var(--color-header-bg);
		color: var(--color-header-text);
		border-bottom: var(--border-width-1) solid var(--color-header-rule);
		padding: var(--spacing-3) var(--spacing-4);
	}

	.sandbox-bar-inner {
		max-width: var(--container-xl);
		margin: var(--spacing-0) auto;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-4);
	}

	.sandbox-brand {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
	}

	.sandbox-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.sandbox-label code {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-brand-text);
	}

	.sandbox-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-4);
	}

	.control-cluster {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
	}

	.inspector-drawer {
		max-width: var(--container-xl);
		margin: var(--spacing-3) auto var(--spacing-0) auto;
	}

	.inspector-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		margin-bottom: var(--spacing-2);
	}

	.inspector-endpoint {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-brand-text);
	}

	.inspector-pre {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-primary);
		margin: var(--spacing-0);
		max-height: var(--container-xs);
		overflow: auto;
	}
</style>
