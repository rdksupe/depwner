<script lang="ts">
	import '../app.css';
	let { children } = $props();

	import NavSidebar from '../components/+NavSidebar.svelte';
</script>

<div class="cont flex h-[100vh]">
	<NavSidebar />
	<main class="cont grid h-[100vh] w-full place-items-center">
		{@render children()}
	</main>
</div>
