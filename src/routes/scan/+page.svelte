<script lang="ts">
	const hashDatabases = ['loremIpsum', 'hydra', 'McAfee', 'Random', 'yoooooooo'];
	const yaraDatabases = ['hydra', 'xylent', 'lauda', 'lassan', 'CHE bhai'];

	let status = $state({
		status: 'idle',
		type: 'full',
		progress: '10'
	});

	import FullScan from '../../components/+FullScan.svelte';
</script>
{#if status.status == 'scan'}
	yo
{:else}
	<div class="mainCont grid text-center">
		<button
			class="scanButton row-start-1"
			onclick={() => {
				status.status = 'full';
			}}
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
	{#if status.status == 'full'}
		<FullScan bind:option={status.status} />
		<button
			aria-label="close popup"
			onclick={() => {
				status.status = 'idle';
			}}
			class="absolute left-0 top-0 z-10 h-[100vh] w-[100vw] bg-black opacity-60"
		></button>
	{/if}
{/if}

<style>
	.entry {
		margin: 0.5vh 0;
	}
	.mainCont {
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: min(2vh, 2vw);
	}
	.scanButton {
		background: rgb(var(--ctp-base));
		border-radius: 1.5vh;
		display: grid;
		place-items: center;
		h2 {
			font-size: min(4vh, 2.5vw);
			font-weight: 700;
		}
		div {
			max-width: 30vw;
		}
		transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
	}
	.scanButton:hover {
		background: rgba(var(--ctp-surface0));
	}
	.statusPannel {
		border-radius: 1.5vh;
		padding: min(7vh, 7vw) 0;
		background: rgb(var(--ctp-base));
		width: 35vw;
		h3 {
			font-size: min(4vh, 2.5vw);
			font-weight: 700;
		}
		p {
			font-size: min(2vh, 1.8vw);
		}
	}

	.pinger {
		display: block;
		--size: min(1.2vh, 1.2vw);
		height: var(--size);
		width: var(--size);
		background: oklch(0.897 0.196 126.665);
		border-radius: 50%;
		margin-left: 0.5vw;
	}
	.animate-ping-monitoring {
		right: 0;
		left: 0;
		margin: auto;
		animation: ping-monitor 2s cubic-bezier(0, 0, 0.2, 1) infinite;
	}
	@keyframes ping-monitor {
		50%,
		100% {
			transform: scale(2.2);
			opacity: 0;
		}
	}
</style>
