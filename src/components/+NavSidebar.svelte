<script>
	import {
		Settings,
		House,
		Logs,
		ChartSpline,
		CalendarDays,
		MenuIcon,
		RefreshCcw,
		BugIcon
	} from 'lucide-svelte';

	let sidebarExpanded = $state(false);

	import { page } from '$app/state';
	console.log(page);

	const toggleSidebar = () => {
		sidebarExpanded = !sidebarExpanded;
	};
</script>

<nav class:expanded={sidebarExpanded} class="bg-catp-mantle">
	<div class="top">
		<button class="navTile" id="sidebarMenuToggleButton" onclick={toggleSidebar}>
			<MenuIcon />
			<!-- <p class="longTitle">Toggle Menu</p> -->
		</button>
	</div>
	<div class="middle">
		<a class="navTile" href="index.html" class:active={page.url.pathname.endsWith('index.html')}>
			<House />
			<p class="shortTitle">Dash</p>
			<p class="longTitle">Dashboard</p>
		</a>
		<a class="navTile" href="scan.html" class:active={page.url.pathname.endsWith('scan.html')}>
			<RefreshCcw />
			<p class="shortTitle">Scan</p>
			<p class="longTitle">Scan</p>
		</a>
		<a
			class="navTile"
			href="threats.html"
			class:active={page.url.pathname.endsWith('threats.html')}
		>
			<BugIcon />
			<p class="shortTitle">Threats</p>
			<p class="longTitle">Threats</p>
		</a>
		<a class="navTile" href="logs.html" class:active={page.url.pathname.endsWith('logs.html')}>
			<Logs />
			<p class="shortTitle">Logs</p>
			<p class="longTitle">Scan Logs</p>
		</a>
		<a class="navTile" href="stats.html" class:active={page.url.pathname.endsWith('stats.html')}>
			<ChartSpline />
			<p class="shortTitle">Stats</p>
			<p class="longTitle">Statistics</p>
		</a>
		<a
			class="navTile"
			href="schedule.html"
			class:active={page.url.pathname.endsWith('schedule.html')}
		>
			<CalendarDays />
			<p class="shortTitle">Schedule</p>
			<p class="longTitle">Schedule</p>
		</a>
	</div>
	<div class="bottom">
		<a
			class="navTile"
			href="settings.html"
			class:active={page.url.pathname.endsWith('settings.html')}
		>
			<Settings />
			<p class="shortTitle"></p>
			<p class="longTitle">Settings</p>
		</a>
	</div>
</nav>

<style>
	nav {
		/* height: 100vh; */
		display: flex;
		flex-flow: column;
		justify-content: space-between;
		width: max-content;
		transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);

		.shortTitle {
			display: block;
		}
		.longTitle {
			display: none;
			font-size: min(2vh, 2vw);
		}

		.navTile {
			transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
			display: grid;
			place-items: center;
			text-wrap: nowrap;
			border-radius: 0.7rem;
			padding: min(2vh, 2vw);
			margin: min(1vh, 1vw);

			:global(svg) {
				height: min(3vh, 3vw);
				width: 100%;
				margin: min(0.5vh, 0.5vw);
			}
		}
		.active,
		.navTile.active:hover {
			background: var(--ctp-macchiato-blue);
			color: var(--ctp-macchiato-crust);
		}
		.navTile:hover {
			background: var(--ctp-macchiato-surface0);
		}
		.top {
			:global(svg) {
				margin: 0;
			}
			.navTile {
				width: stretch;
			}
		}
		/* width: min(5vh, 4vw); */
	}
	.expanded {
		.navTile {
			display: flex;
			margin: 0 min(1vh, 1vw);
			padding: 1.5vh 2vw;
			.shortTitle {
				display: none;
			}
			.longTitle {
				display: block;
				margin: min(1vh, 1vw);
			}
			:global(svg) {
				width: min(3vh, 3vw);
				height: 100%;
				margin: min(0.5vh, 0.5vw);
			}
		}
		.top {
			.navTile {
				/* display: grid; */
				padding: min(2vh, 2vw);
				margin: min(1vh, 1vw);
			}
		}
	}

	:root {
		--ctp-macchiato-rosewater: #f4dbd6;
		--ctp-macchiato-flamingo: #f0c6c6;
		--ctp-macchiato-pink: #f5bde6;
		--ctp-macchiato-mauve: #c6a0f6;
		--ctp-macchiato-red: #ed8796;
		--ctp-macchiato-maroon: #ee99a0;
		--ctp-macchiato-peach: #f5a97f;
		--ctp-macchiato-yellow: #eed49f;
		--ctp-macchiato-green: #a6da95;
		--ctp-macchiato-teal: #8bd5ca;
		--ctp-macchiato-sky: #91d7e3;
		--ctp-macchiato-sapphire: #7dc4e4;
		--ctp-macchiato-blue: #8aadf4;
		--ctp-macchiato-lavender: #b7bdf8;
		--ctp-macchiato-text: #cad3f5;
		--ctp-macchiato-subtext1: #b8c0e0;
		--ctp-macchiato-subtext0: #a5adcb;
		--ctp-macchiato-overlay2: #939ab7;
		--ctp-macchiato-overlay1: #8087a2;
		--ctp-macchiato-overlay0: #6e738d;
		--ctp-macchiato-surface2: #5b6078;
		--ctp-macchiato-surface1: #494d64;
		--ctp-macchiato-surface0: #363a4f;
		--ctp-macchiato-base: #24273a;
		--ctp-macchiato-mantle: #1e2030;
		--ctp-macchiato-crust: #181926;
	}
</style>
