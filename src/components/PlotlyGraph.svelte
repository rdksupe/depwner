<script>
  import { onMount } from 'svelte';
  
  export let data;
  export let layout = {};
  export let config = { 
    responsive: true,
    displayModeBar: true,
    displaylogo: false
  };

  let graphDiv;
  let plotlyLoaded = false;

  async function loadPlotly() {
    if (!plotlyLoaded) {
      await import('https://cdn.jsdelivr.net/npm/plotly.js-dist@2.27.1/plotly.min.js');
      plotlyLoaded = true;
    }
  }

  onMount(async () => {
    if (typeof window !== 'undefined') {
      await loadPlotly();
      if (graphDiv && data) {
        window.Plotly.newPlot(graphDiv, data, layout, config);
      }
    }

    return () => {
      if (graphDiv && window.Plotly) {
        window.Plotly.purge(graphDiv);
      }
    };
  });

  $: if (graphDiv && data && typeof window !== 'undefined' && plotlyLoaded) {
    window.Plotly.react(graphDiv, data, layout, config);
  }
</script>

<svelte:head>
  <script async src="https://cdn.jsdelivr.net/npm/plotly.js-dist@2.27.1/plotly.min.js"></script>
</svelte:head>

<div bind:this={graphDiv} class="plot-container"></div>

<style>
  .plot-container {
    width: 100%;
    height: 100%;
    min-height: 400px;
    background: rgb(var(--ctp-base));
  }
</style>
