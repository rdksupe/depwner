<script>
	import { onMount } from 'svelte';

	let logs = $state([]);
	let threats = $state(0);
	let totalThreatsFound = $derived.by(() => {
		return logs.reduce((sum, log) => sum + log.threats, 0);
	});

	onMount(async () => {
		const statsObj = await depwnerStatus.getStats();
		logs = JSON.parse(statsObj);
		console.log(statsObj);

		const threatResponse = await depwnerStatus.getThreats();
		const threatArr = JSON.parse(threatResponse);
		threats = threatArr.length;
		console.log(threatArr.length);
	});
</script>

<div class="overall-container">
	<h2 class="overall-threats">🚀 {totalThreatsFound} Threats Eliminated by dePWNer</h2>
	<h2 class="active-threats">⚠️ {threats} Threats in Quarantine</h2>
	<h2 class="eliminated-threats text-red-400">✅ {totalThreatsFound - threats} Removed by User</h2>

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Time</th>
					<th>Date</th>
					<th>Scan Type</th>
					<th>Path Scanned</th>
					<th>Threats</th>
					<th>Files Scanned</th>
				</tr>
			</thead>
			<tbody>
				{#each logs as scan}
					<tr>
						<td>{new Date(scan.time).toLocaleTimeString()}</td>
						<td>{new Date(scan.time).toLocaleDateString()}</td>
						<td>{scan.scanType}</td>
						<td class="folder-path">{scan.folder}</td>
						<td class="threat-count">{scan.threats}</td>
						<td>{scan.filesScanned}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	:root {
		--primary-bg: rgb(var(--ctp-mantle));
		--secondary-bg: rgb(var(--ctp-surface0));
		--primary-text: #ffffff;
		--secondary-text: #b0b0b0;
		--highlight: rgb(var(--ctp-blue));
		--safe: #2ed573;
		--warning: #ffa502;
	}

	.overall-container {
		width: 90%;
		margin: 20px auto;
		text-align: center;
		color: var(--primary-text);
		background: var(--primary-bg);
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	h2 {
		margin-bottom: 10px;
	}

	.overall-threats {
		color: var(--safe);
	}

	.active-threats {
		color: var(--warning);
	}

	.eliminated-threats {
	}

	.table-container {
		margin-top: 20px;
		overflow-x: auto;
		border-radius: 8px;
		background: var(--secondary-bg);
		padding: 10px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		color: var(--primary-text);
	}

	th,
	td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid var(--secondary-text);
	}

	th {
		background: var(--highlight);
		color: rgb(var(--ctp-crust));
		font-weight: bold;
	}

	tr:nth-child(even) {
		background: rgba(255, 255, 255, 0.05);
	}

	tr:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.folder-path {
		word-break: break-all;
		max-width: 200px;
	}

	.threat-count {
		font-weight: bold;
		color: var(--highlight);
	}
</style>
