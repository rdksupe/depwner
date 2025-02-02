<script>
	let img = $state('');
</script>

<div class="text-center">
	<h1>Trend Analysis</h1>
	<p>
		We analysed an advanced dataset of malware samples with when they were first detected, the
		source and their malware family. The dataset comprised of more than 45 Million malware samples.
		Our detection system is also trained on the same database
	</p>
	<select bind:value={img}>
		<option value="" disabled selected>Choose a Report</option>
		<option value="hourly_activity.svg">Hourly Distribution</option>
		<option value="malware_trends.svg">Malware Family Trends</option>
		<option value="monthly_activity.png">Monthly Heatmap</option>
		<option value="new_families_timeline.svg">New Families Tend</option>
		<option value="seasonal_heatmap.svg">Seasonal Heatmap</option>
		<option value="signature_distribution.svg">Signature Distribution</option>
		<option value="signature_evolution.png">Signature Evolution</option>
		<option value="temporal_patterns.png">Temporal Patterns</option>
	</select>
	<div class="img">
		{#if img}
			<img src="/trend_analysis/{img}" alt={img} />
		{/if}
	</div>
</div>

<style>
	.img {
		display: flex;
		justify-content: center;
	}
	img {
		width: 70vw;
	}
	h1 {
		font-size: min(4vh, 4vw);
		font-weight: 700;
	}
	p {
		margin: 0 10vw;
		font-size: min(1.5vh, 2vw);
	}
	select {
		margin: min(1.5vh, 1.5vw) 0;
		background: rgb(var(--ctp-base));
		border-radius: 1vh;
		padding: min(0.5vw, 0.5vh) min(2vh, 2vw);
		font-size: min(2vh, 1.9vw);
		font-weight: 500;
		border: 0.2vh solid rgb(var(--ctp-text));
		color-scheme: dark;
		text-align: center;
	}
	select:focus {
		border: 0.2vh solid rgb(var(--ctp-blue));
	}
</style>
