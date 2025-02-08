<script lang="ts">
	import HomeButton from '../components/+HomeButton.svelte';

	import {
		RefreshCcw,
		ShieldIcon,
		ChartSpline,
		FileTextIcon,
		ShieldCheckIcon,
		ShieldXIcon,
		CalendarClockIcon
	} from 'lucide-svelte';

	const statusMessages = {
		Okay: {
			title: 'Secure',
			message: 'No Threats were found.<br/>All Services Functional',
			fix: '',
			link: '',
			icon: ShieldCheckIcon,
			backIcon: ShieldIcon,
			color: 'lime-300'
		},
		Threat: {
			title: 'Threat Detected',
			message: 'Threats were Detected.<br/>Detected Threats Quarantined',
			fix: 'Take action now',
			link: '',
			icon: ShieldXIcon,
			backIcon: ShieldIcon,
			color: 'catp-red'
		},
		Disabled: {
			title: 'DePWNer is Disabled',
			message: '',
			fix: 'Enable now',
			link: '/settings',
			icon: ShieldXIcon,
			backIcon: ShieldIcon,
			color: 'catp-red'
		},
		NoSchedule: {
			title: 'Feature Disabled',
			message: 'Scheduled Scanning was disabled',
			fix: 'Fix Now',
			link: '/settings',
			icon: ShieldXIcon,
			backIcon: ShieldIcon,
			color: 'catp-red'
		},
		YaraDisabled: {
			title: 'Feature Disabled',
			message: 'Scheduled Scanning was disabled',
			fix: 'Fix Now',
			link: '/settings',
			icon: ShieldXIcon,
			backIcon: ShieldIcon,
			color: 'catp-red'
		},
		FeatureDisabled: {
			title: 'Features Disabled',
			message: 'Some Security features were disabled',
			fix: 'Enable them now',
			link: '/settings',
			icon: ShieldXIcon,
			backIcon: ShieldIcon,
			color: 'catp-red'
		}
	};

	let dashStatus: any;

	let currentStatus = {
		threats: 3,
		yara: true,
		scheduled: true
	};

	let setDashStatus = (status: any) => {
		if (status.threats != 0) {
			dashStatus = statusMessages.Threat;
		} else if (!status.scheduled && !status.yara) {
			dashStatus = statusMessages.Disabled;
		} else if (!status.scheduled) {
			dashStatus = statusMessages.NoSchedule;
		} else if (!status.yara) {
			dashStatus = statusMessages.YaraDisabled;
		} else {
			dashStatus = statusMessages.Okay;
		}
	};

	setDashStatus(currentStatus);
</script>

<svelte:head>
	<title>DePWNer</title>
</svelte:head>

<div class="dashContainer grid grid-cols-4 text-center">
	<HomeButton href="scan.html">
		<RefreshCcw />
		<h3>Start a Scan</h3>
	</HomeButton>
	<HomeButton href="stats.html">
		<ChartSpline />
		<h3>Statistics</h3>
	</HomeButton>
	<HomeButton href="logs.html">
		<FileTextIcon />
		<h3>Scan Reports</h3>
	</HomeButton>
	<HomeButton href="schedule.html">
		<CalendarClockIcon />
		<h3>Scan Schedule</h3>
	</HomeButton>
	<div
		class="homeStatusCard card col-start-3 col-end-5 row-start-1 row-end-3 grid place-items-center rounded-[2vh] bg-catp-mantle"
	>
		<div class="cardInner grid justify-items-center">
			<div class={'text-' + dashStatus.color}>
				<p class="relative">
					<dashStatus.icon />
					<dashStatus.backIcon class="animate-ping-shield absolute top-0" />
				</p>
				<h3 class="relative">
					{dashStatus.title}
				</h3>
			</div>
			<p>{@html dashStatus.message}</p>
			<a
				class="fix text-{dashStatus.color} border-{dashStatus.color} my-[1vh] rounded-[0.5vh] bg-catp-surface0/60 px-[1vh] py-[0.2vh] hover:bg-{dashStatus.color} hover:text-catp-crust"
				href={dashStatus.link}>{dashStatus.fix}</a
			>
			<a href="threats.html" class="statusCardList">
				<p>Threats</p>
				<p>{currentStatus.threats}</p>
			</a>
			<a href="settings.html" class="statusCardList">
				<p></p>
				<p>{currentStatus.threats}</p>
			</a>
		</div>
	</div>
	<button
		onclick={async () => {
			console.log('buttonClicked');
			let yo = await depwnerPreferences.get();
			console.log('printing');
			console.log(yo);
		}}>bruh</button
	>
</div>

<style>
	.dashContainer {
		gap: min(2vh, 1.5vw);
	}
	.homeStatusCard {
		transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
		padding: min(5vh, 4vw);
		h3 {
			font-size: min(4vh, 3vw);
			font-weight: 700;
			margin-top: -0.5vh;
		}
		p,
		a.fix {
			font-size: min(2vh, 1.5vw);
			max-width: 30vw;
			transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
		}
	}
	.homeStatusCard :global(.lucide-icon) {
		height: min(15vh, 12vw);
		width: stretch;
	}
	@keyframes ping {
		50%,
		100% {
			transform: scale(1.35);
			opacity: 0;
		}
	}
	:global(.animate-ping-shield) {
		animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
	}
</style>
