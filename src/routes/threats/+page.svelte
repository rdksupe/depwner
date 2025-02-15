<script>
	let threats = $state([
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			severiety: '7.2',
			deepseekResponse:
				'A data-stealing malware variant focused on capturing sensitive information, such as login credentials and financial data, from infected systems, often distributed through malicious websites and phishing emails.'
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			severiety: '7.1',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		},
		{
			name: 'virus2.exe',
			type: 'dangerous Virus',
			oldPath: '/some/path/bruh',
			hash: '',
			yaraRule: '',
			deepseekResponse: ''
		}
	]);
	onMount(async () => {
		const threatResponse = await depwnerStatus.getThreats();
		threats = JSON.parse(threatResponse);
	});

	let displayInfo = $state({
		name: ''
	});
</script>

<div>
	<h1 class="text-center">Quarantined Threats</h1>
	<div class="mainCont">
		{#each threats as threat, i}
			<button
				class="entry"
				onclick={() => {
					displayInfo = threats[i];
				}}
			>
				<div>
					<BugIcon />
					<h2>{threat.name}</h2>
				</div>
			</button>
		{/each}
	</div>
</div>
