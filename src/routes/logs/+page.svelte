<script>
	import { onMount } from 'svelte';

	let logs = $state([
		{
			scanType: 'Full',
			filesScanned: 45372,
			threats: 2,
			time: 1737729873,
			folder: '/home/harshit/Harshit_Work/pclub/'
		}
	]);
	let threats = $state(0);
	let totalThreatsFound = $derived.by(() => {
		let i = 0;
		logs.forEach((log) => {
			i += log.threats;
		});
		return i;
	});
	onMount(async () => {
		let statsObj = await JSON.parse(depwnerStatus.getStats());
		logs = statsObj;
		const threatResponse = await depwnerStatus.getThreats();
		const threatObj = JSON.parse(threatResponse);
		threats = Object.keys(threatObj).length;
	});
</script>

<div class="overallContainer">
	<h2 class="overallThreats">Overall {totalThreatsFound} Threats were Eliminated by dePWNer</h2>
	<h2 class="activeThreats">{threats} are Quarantined</h2>
	<h2 class="eliminatedThreats">{totalThreatsFound - threats} were removed by user</h2>
	<div class="table">
		<h3>Time</h3>
		<h3>Date</h3>
		<h3>Scan Type</h3>
		<h3>Path Scanned</h3>
		<h3>Threats</h3>
		<h3>TotalScanned</h3>
		{#each logs as scan}
			<p>{scan.time}</p>
			<p>{scan.time}</p>
			<p>{scan.scanType}</p>
			<p>{scan.folder}</p>
			<p>{scan.threats}</p>
			<p>{scan.filesScanned}</p>
		{/each}
	</div>
</div>

<style>
	.table {
		display: grid;
		grid-template-columns: repeat(6, auto);
		text-align: center;
	}
	.overallContainer {
		height: 100%;
		width: 100%;
	}
</style>
