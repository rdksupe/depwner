<script>
	let { displayInfo = $bindable(), threats = $bindable() } = $props();
</script>

<button
	aria-label="close popup"
	class="absolute left-0 top-0 h-[100vh] w-[100vw] bg-black opacity-75"
	onclick={() => {
		displayInfo = { name: '' };
	}}
>
</button>
<div class="mainCont">
	<h1 class="text-center">About Malware</h1>
	{#each Object.keys(displayInfo) as key}
		{#if displayInfo[key]}
			<p>
				<span class="font-extrabold"
					>{#if key == 'oldPath'}
						Original Path
					{:else if key == 'deepseekResponse'}
						AI Analysis
					{:else if key == 'name'}
						File Name
					{:else if key == 'cve_scores'}
						CVE
					{:else if key == 'history'}
						History
					{:else if key == 'origin'}
						Origin
					{:else if key == 'authorship'}
						Authorship
					{:else if key == 'affected_nations'}
						Affected Nations
					{:else if key == 'detection_techniques'}
						Detection Techniques
					{:else}
						{key}
					{/if}:</span
				>
				{displayInfo[key]}
			</p>
		{/if}
	{/each}
	<div class="center">
		<h3>This malware is securely quarantined</h3>
		<button
			class="delete"
			onclick={() => {
				const index = threats.indexOf(displayInfo);
				if (index > -1) {
					// only splice array when item is found
					threats.splice(index, 1); // 2nd parameter means remove one item only
				}
				displayInfo.name = '';
				electronFilesystem.removeThreat(displayInfo);
			}}>Permanently Remove</button
		>
		<h3>Think this was a mistake?</h3>
		<button
			class="restore"
			onclick={() => {
				const index = threats.indexOf(displayInfo);
				if (index > -1) {
					// only splice array when item is found
					threats.splice(index, 1); // 2nd parameter means remove one item only
				}
				displayInfo.name = '';
				electronFilesystem.restoreThreat(displayInfo);
			}}>Restore and Add to Whitelist</button
		>
	</div>
</div>

<style>
	.delete {
		--btn-color: rgb(var(--ctp-red));
	}
	.restore {
		--btn-color: rgb(var(--ctp-yellow));
	}
	.center {
		display: grid;
		place-items: center;
	}
	h1 {
		font-size: min(4vh, 4vw);
		font-weight: 700;
	}
	h3 {
		margin-top: 2vh;
		font-size: min(3vh, 3vw);
		font-weight: 700;
		text-align: center;
	}
	p {
		font-size: min(2.5vh, 2.5vw);
		overflow-wrap: anywhere;
	}
	p span {
		font-size: min(3vh, 3vw);
		text-transform: capitalize;
	}
	.mainCont {
		position: absolute;
		top: 50%;
		left: 50%;
		translate: -50% -50%;
		background: rgb(var(--ctp-base));
		padding: min(5vh, 5vw);
		width: 60vw;
		max-height: 85vh;
		overflow-y: auto;
		button {
			font-size: min(2.5vh, 2.5vw);
			border-radius: 0.5vh;
			color: var(--btn-color);
			border: 2px var(--btn-color) solid;
			padding: 0 min(2vh, 2vw);
			transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
		}
		button:hover {
			background: var(--btn-color);
			color: rgb(var(--ctp-mantle));
		}
	}
</style>
