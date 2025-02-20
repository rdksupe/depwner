<script>
	import { onMount } from 'svelte';

	let paths = $state(['/home/harshit']);

	onMount(async () => {
		let settings = await depwnerPreferences.get();
		paths = JSON.parse(settings).locations;
	});

	let { option = $bindable() } = $props();
</script>

<div
	class="fullScreen pointer-events-none absolute left-0 top-0 z-20 grid h-[100vh] w-[100vw] place-items-center"
>
	<div class="fullSystemConfirmation pointer-events-auto">
		<h2 class="text-center">Start Full System Scan?</h2>
		<p class="text-left">These paths will be scanned-</p>
		{#each paths as path}
			<p class="font-extrabold">{path}</p>
		{/each}
		<div class="flex justify-center">
			<div class="confirms grid grid-cols-2 justify-center">
				<button
					class="proceed"
					onclick={() => {
						option = 'scan';
						paths.forEach((path) => {
							electronFilesystem.manualScan(path, 'full');
						});
					}}
				>
					Start Scan
				</button>
				<button
					class="cancel"
					onclick={() => {
						option = 'idle';
					}}
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.fullSystemConfirmation {
		background: rgb(var(--ctp-base));
		padding: 3vh 5vw;
		border-radius: 2vh;
		h2 {
			font-size: min(3vh, 3vw);
			font-weight: 600;
		}
		.confirms {
			gap: min(2vh, 2vw);
			margin: 2vh 0 0;
			button {
				padding: min(4vh, 0.2vw) min(3vh, 3vw);
				font-weight: 600;
				border: 2px solid var(--buttColor);
				border-radius: 0.7vh;
				color: var(--buttColor);
				transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
			}
			button:hover {
				background: var(--buttColor);
				color: rgb(var(--ctp-mantle));
			}
		}
	}
	.proceed {
		--buttColor: rgb(var(--ctp-blue));
	}
	.cancel {
		--buttColor: rgb(var(--ctp-red));
	}
</style>
