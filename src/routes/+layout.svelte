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

<p class="text-catp-subtext0" style="position: fixed;left:46.5%;bottom:0;margin:auto;">
	<strong>dePWNer</strong> by team pwnedRaccoons
</p>
