<script>
	import { BugIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import ThreatInfoPopup from '../../components/+ThreatInfoPopup.svelte';

	let threats = $state([
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh/virus2.exe',
			hash: '',
			yaraRule: '',
			severity: '7.2',
			deepseekResponse:
				'A data-stealing malware variant focused on capturing sensitive information, such as login credentials and financial data, from infected systems, often distributed through malicious websites and phishing emails.'
		},
		{
			name: 'virus2.exelkflkdhhrwerkhkwhefkwheklhwklehkwehtkhtekhjkth',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			severity: '7.1',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		}
	]);
	onMount(async () => {
		const threatResponse = await depwnerStatus.getThreats();
		threats = JSON.parse(threatResponse);
	});

	let displayInfo = $state({
		name: ''
	});
</script>

<div>
	<h1 class="text-center">Quarantined Threats</h1>
	<div class="mainCont">
		{#each threats as threat, i}
			<button
				class="entry"
				onclick={() => {
					displayInfo = threats[i];
				}}
			>
				<div>
					<BugIcon />
					<h2>{threat.name}</h2>
				</div>
			</button>
		{/each}
	</div>
</div>
{#if displayInfo.name}
	<ThreatInfoPopup bind:displayInfo bind:threats />
{/if}

<style>
	button {
		overflow: hidden;
	}
	button div {
		display: grid;
		place-items: center;
	}
	button div h2 {
		display: block;
		text-overflow: ellipsis;
		overflow-wrap: anywhere;
		padding: min(1.5vh, 1.5vw);
	}
	h1 {
		font-size: min(5vh, 5vw);
		font-weight: 800;
		margin-top: 2vh;
		margin-bottom: -2vh;
	}
	.mainCont {
		display: grid;
		width: 80vw;
		grid-template-columns: repeat(auto-fill, minmax(min(21vh, 21vw), 1fr));
		gap: min(5vh, 5vw);
		place-items: center;
		padding: min(5vh, 5vw);
	}
	.entry {
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		background: rgb(var(--ctp-base));
		width: stretch;
		border-radius: 2vh;
		/* padding: min(5vh, 5vw); */

		:global(svg) {
			--size: min(10vh, 10vw);
			height: var(--size);
			width: var(--size);
		}
		h2 {
			font-size: min(2vh, 2vw);
			font-weight: 600;
		}
	}
	.entry:hover {
		color: rgb(var(--ctp-blue));
		background: rgb(var(--ctp-surface0));
		transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
	}
</style>
