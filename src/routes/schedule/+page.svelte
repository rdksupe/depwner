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
		locations: ['']
	});
	onMount(async () => {
</script>

<div class="mainCont">
	<div class="m-[5vw]">
		<h1>Scan Schedule</h1>
		<p>
			Schedule an automatic full system scan to add an additional layer of security.<br />You can
			set it to non-banking hours to not hurt performance
		</p>
		<!-- <p> -->
		<!-- 	Although Depwner has active monitoring, which detects and isolates malicious files as they are -->
		<!-- 	added on the filesystem, it is recommended to set up scheduled full system scans. To add an -->
		<!-- 	additional layer of security. -->
		<!-- </p> -->
		<div class="my-[2vh] grid justify-center">
			<div class="settingsField">
				<h3>Enable</h3>
				<div class="toggleButton">
					<input type="checkbox" id="checkboxInput" bind:checked={settings.schedule.active} />
					<label
						for="checkboxInput"
						class="toggleSwitch relative flex cursor-pointer items-center justify-center bg-catp-crust"
					>
					</label>
				</div>
			</div>
			{#if settings.schedule.active}
				<div class="settingsField mt-[2vh]">
					<h3>Scan Frequency</h3>
					<select name="freq" id="freq" bind:value={settings.schedule.freq}>
						<option value="hourly">Hourly</option>
						<option value="daily">Daily</option>
						<option value="weekly">Weekly</option>
					</select>
				</div>
				{#if settings.schedule.freq == 'hourly'}
					<h3>
						Full system scan
						<span style="text-transform: capitalize;font-weight: 700;">every hour</span>
					</h3>
				{:else}
					{#if settings.schedule.freq == 'weekly'}
						<div class="settingsField">
							<div class="toggleDayButton">
								<input
									type="checkbox"
									id="checkboxSun"
									class="checkboxDay"
									bind:checked={settings.schedule.days.sun}
								/>
								<label
									for="checkboxSun"
									class="toggleDay relative flex cursor-pointer items-center justify-center bg-catp-crust"
								>
									Sun
								</label>
							</div>
							<div class="toggleDayButton">
								<input
									type="checkbox"
									id="checkboxMon"
									class="checkboxDay"
									bind:checked={settings.schedule.days.mon}
								/>
								<label
									for="checkboxMon"
									class="toggleDay relative flex cursor-pointer items-center justify-center bg-catp-crust"
								>
									Mon
								</label>
							</div>
							<div class="toggleDayButton">
								<input
									type="checkbox"
									id="checkboxTue"
									class="checkboxDay"
									bind:checked={settings.schedule.days.tue}
								/>
								<label
									for="checkboxTue"
									class="toggleDay relative flex cursor-pointer items-center justify-center bg-catp-crust"
								>
									Tue
								</label>
							</div>
							<div class="toggleDayButton">
								<input
									type="checkbox"
									id="checkboxWed"
									class="checkboxDay"
									bind:checked={settings.schedule.days.wed}
								/>
								<label
									for="checkboxWed"
									class="toggleDay relative flex cursor-pointer items-center justify-center bg-catp-crust"
								>
									Wed
								</label>
							</div>
							<div class="toggleDayButton">
								<input
									type="checkbox"
									id="checkboxThu"
									class="checkboxDay"
									bind:checked={settings.schedule.days.thu}
								/>
								<label
									for="checkboxThu"
									class="toggleDay relative flex cursor-pointer items-center justify-center bg-catp-crust"
								>
									Thu
								</label>
							</div>
							<div class="toggleDayButton">
								<input
									type="checkbox"
									id="checkboxFri"
									class="checkboxDay"
									bind:checked={settings.schedule.days.fri}
								/>
								<label
									for="checkboxFri"
									class="toggleDay relative flex cursor-pointer items-center justify-center bg-catp-crust"
								>
									Fri
								</label>
							</div>
							<div class="toggleDayButton">
								<input
									type="checkbox"
									id="checkboxSat"
									class="checkboxDay"
									bind:checked={settings.schedule.days.sat}
								/>
								<label
									for="checkboxSat"
									class="toggleDay relative flex cursor-pointer items-center justify-center bg-catp-crust"
								>
									Sat
								</label>
							</div>
						</div>
					{/if}
					<div class="settingsField">
						<!-- <h3>Time of scan</h3> -->
						<input id="scanTime" type="time" name="scanTime" bind:value={settings.schedule.time} />
					</div>
					{#if settings.schedule.freq == 'weekly' && Object.values(settings.schedule.days).includes(true)}
						<h3>
							Scan
							<span style="text-transform: capitalize;font-weight: 700;">Every Week</span>
							on
							{#each Object.keys(settings.schedule.days) as day}
								{#if settings.schedule.days[day]}
									<span style="text-transform: capitalize;font-weight: 700;">{day}&nbsp;</span>
								{/if}
							{/each}
							at
							<span style="text-transform: capitalize;font-weight: 700;"
								>{settings.schedule.time}</span
							>
						</h3>
					{:else if settings.schedule.freq == 'weekly'}
						<h3 class="text-catp-red">Please choose at least one day of the week to scan</h3>
					{:else}
						<h3>
							Scan
							<span style="text-transform: capitalize;font-weight: 700;">Every Day</span>
							at
							<span style="text-transform: capitalize;font-weight: 700;"
								>{settings.schedule.time}</span
							>
						</h3>
					{/if}
				{/if}
			{/if}
		</div>
	</div>
</div>

