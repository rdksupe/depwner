<script>
	let { info = $bindable() } = $props();
</script>

<button
	class="absolute left-0 top-0 h-[100vh] w-[100vw] bg-black opacity-75"
	aria-label="close popup"
></button>

<div class="mainCont">
	<h2>{info.title}</h2>
	<p>{info.message}</p>
</div>
