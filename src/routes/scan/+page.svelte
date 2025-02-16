<script lang="ts">
	const hashDatabases = ['loremIpsum', 'hydra', 'McAfee', 'Random', 'yoooooooo'];
	const yaraDatabases = ['hydra', 'xylent', 'lauda', 'lassan', 'CHE bhai'];

	let status = $state({
		status: 'idle',
		type: 'full',
		progress: '10'
	});

</script>
{#if status.status == 'scan'}
	yo
{:else}
	<div class="mainCont grid text-center">
		<button
			class="scanButton row-start-1"
		>
			<div>
				<h2>Full System Scan</h2>
				<p>Scan all the files on the monitored filesystem paths</p>
			</div>
		</button>
		<button
			class="scanButton row-start-2"
		>
			<div>
				<h2>Custom Scan</h2>
				<p>Scan a particular File or Folder</p>
			</div>
		</button>
		<div class="statusPannel row-span-2">
			<!-- <button class="lastReportButton">Last Scan Report</button> -->
			<h3>Active Hash Datasets</h3>
			<div class="grid place-items-center">
				<div>
					{#each hashDatabases as hashDatabase}
						<div class="entry flex items-center justify-end">
							<p><span class="font-bold">{hashDatabase}</span>&nbsp;&nbsp;Active</p>
							<div class="pinger relative">
								<div class="pinger animate-ping-monitoring absolute"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
			<h3 class="mt-[2vh]">Active Yara Datasets</h3>
			<div class="grid place-items-center">
				<div>
					{#each yaraDatabases as yaraDatabase}
						<div class="entry flex items-center justify-end">
							<p><span class="font-bold">{yaraDatabase}</span>&nbsp;&nbsp;Active</p>
							<div class="pinger relative">
								<div class="pinger animate-ping-monitoring absolute"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

