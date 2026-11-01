<script>
	import { Button } from '$ui/components';
	let status = 'future';

	const statusCycle = ['future', 'active', 'completed'];

	function toggleStatus() {
		const index = statusCycle.indexOf(status);
		status = statusCycle[(index + 1) % statusCycle.length];
	}

	$: statusColor = {
		future: 'gray',
		active: 'blue',
		completed: 'green'
	}[status];
</script>

<Button onclick={toggleStatus} style="background-color: {statusColor}">
	[{status}]
</Button>
<span> Your status message here. </span>

<style>
	span {
		font-family: var(--font-sans);
		font-weight: 500;
	}
</style>
