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
						if (file != 'user cancelled') {
							option = 'scan';
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
						if (folder != 'user cancelled') {
							option = 'scan';
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

