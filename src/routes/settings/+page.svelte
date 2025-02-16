<script lang="ts">
	let settings = $state({
		yara: true,
		schedule: {
			active: true,
			freq: 'weekly',
			days: {
				sun: true,
				mon: false,
				tue: false,
				wed: false,
				thu: false,
				fri: false,
				sat: false
			},
			time: '13:00'
		},
		locations: [
			'/home/harshit',
			'/oieiourioewioer',
			'ifsfiodsfuiofus',
			'yo',
			'khkjdshkjahsk',
			'skkshfkhsklf',
			'skkshfkhsklf',
			'skkshfkhsklf',
			'skkshfkhsklf',
			'skkshfkhsklf',
			'skkshfkhsklf',
			'skkshfkhsklf',
			'skkshfkhsklf',
			'skkshfkhsklf'
		]
	});
</script>

<div class="mainCont">
	<!-- <h1>dePWNer Settings</h1> -->
	<div class="m-[5vw]">
		<!-- <p>You can set your preferences here.</p> -->
		<div class="grid justify-center">
			<div class="headingInfo">
				<h2>Active Filesystem Monitoring</h2>
				<button>
					<Info />
				</button>
			</div>
			{#if !settings.yara}
				<p class="text-catp-red">disabling this is not recommended!</p>
			{/if}
			<div class="settingsField">
				<h3>Enable</h3>
				<div class="toggleButton">
					<input type="checkbox" id="checkboxInput" bind:checked={settings.yara} />
					<label
						for="checkboxInput"
						class="toggleSwitch relative flex cursor-pointer items-center justify-center bg-catp-crust"
					>
					</label>
				</div>
			</div>
			<div class="headingInfo">
				<h2>Scheduled Scans</h2>
				<button>
					<Info />
				</button>
			</div>
			{#if !settings.schedule.active}
				<p class="text-catp-red">disabling this is not recommended!</p>
			{/if}
			<div class="settingsField">
				<h3>Enable</h3>
				<div class="toggleButton">
					<input type="checkbox" id="checkboxInputSch" bind:checked={settings.schedule.active} />
					<label
						for="checkboxInputSch"
						class="toggleSwitch relative flex cursor-pointer items-center justify-center bg-catp-crust"
					>
					</label>
				</div>
			</div>
			<div class="headingInfo">
				<h2>Locations</h2>
				<button>
					<Info />
				</button>
			</div>
			<div class="locationSettings">
				<div class="addButton">
					<!-- <input type="text" name="location" id="locationInput" /> -->
					<!-- <button class="addPath">+</button> -->
					<button
						onclick={async () => {
							let folder = await electronFilesystem.getFolder();
							console.log(folder);
							if (folder != 'user cancelled') {
								settings.locations.push(folder);
							}
						}}>Add Path to Locations</button
					>
				</div>
				{#each settings.locations as location, i}
					<div class="entry">
						<div>{location}</div>
						<button
							onclick={() => {
								settings.locations.splice(i, 1);
							}}
						>
							<Trash2 />
						</button>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

