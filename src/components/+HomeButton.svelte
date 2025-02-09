<script>
	let { children, col = '', row = '', href = '' } = $props();
</script>

<a
	class="homeCard card rounded-[2vh] bg-catp-base hover:bg-catp-surface0 hover:text-catp-blue"
	style="grid-row:{row};grid-column:{col};"
	{href}
>
	<div class="cardInner grid justify-items-center">
		{@render children()}
	</div>
</a>

<style>
	.homeCard {
		padding: min(5vh, 4vw);
		font-size: min(2.5vh, 2.5vw);
		transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);

		:global(h3) {
			--margin: min(1vh, 1vw);
			margin: var(--margin) 0 calc(var(--margin) * -3 / 4);
		}
	}
	.homeCard :global(.lucide-icon) {
		--icon-size: min(15vh, 12vw);
		height: var(--icon-size);
		width: var(--icon-size);
	}
</style>
