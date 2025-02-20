<script>
	import { FileText, FolderOpenIcon } from 'lucide-svelte';

	let { option = $bindable() } = $props();
</script>

<div
	class="fullScreen pointer-events-none absolute left-0 top-0 z-20 grid h-[100vh] w-[100vw] place-items-center"
>
	<div class="fullSystemConfirmation pointer-events-auto">
		<h2 class="text-center">Start Custom Scan</h2>
		<div class="flex justify-center">
			<div class="confirms grid grid-cols-2 justify-center">
				<button
					class="file grid place-items-center"
					onclick={async () => {
						let file = await electronFilesystem.getFile();
						console.log(file);
						if (file && file != 'user cancelled') {
							electronFilesystem.manualScan(file, 'custom');
							option = 'scan';
						} else {
							console.warn("No file selected, staying on the current screen.");
							alert("No file selected. Please choose a file to proceed.");
						}
					}}
				>
					<FileText />
					Scan a File
				</button>
				<button
					class="folder grid place-items-center"
					onclick={async () => {
						let folder = await electronFilesystem.getFolder();
						console.log(folder);
						if (folder && folder != 'user cancelled') {
							electronFilesystem.manualScan(folder, 'custom');
							option = 'scan';
						} else {
							console.warn("No folder selected, staying on the current screen.");
							alert("No folder selected. Please choose a folder to proceed.");
						}
					}}
				>
					<FolderOpenIcon />
					Scan a Folder
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
				font-size: min(2.5vh, 2.5vw);
				padding: min(3vh, 3vw);
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
	.confirms :global(svg) {
		height: min(7vh, 7vw);
		width: stretch;
	}
	.confirms {
		--buttColor: rgb(var(--ctp-blue));
	}
</style>
