<script>
	let { displayInfo = $bindable() } = $props();
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
						Orignal Path
					{:else if key == 'deepseekResponse'}
						AI Analysis
					{:else if key == 'name'}
						File Name
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
		<button class="delete">Permanently Remove</button>
		<h3>Think this was a mistake?</h3>
		<button class="restore">Restore and Add to Whitelist</button>
	</div>
</div>

