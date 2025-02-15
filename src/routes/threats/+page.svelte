<script>
	onMount(async () => {
		const threatResponse = await depwnerStatus.getThreats();
		threats = JSON.parse(threatResponse);
	});

</script>
