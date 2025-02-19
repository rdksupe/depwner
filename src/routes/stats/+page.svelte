<script>
  import PlotlyGraph from '../../components/PlotlyGraph.svelte';
  import { onMount } from 'svelte';

  let selectedGraph = '';
  let plotData = null;
  
  const graphs = {
    'hourly_activity': 'Hourly Distribution',
    'malware_trends': 'Malware Family Trends',
    'new_families_timeline': 'New Families Trend',
    'seasonal_heatmap': 'Seasonal Heatmap',
    'signature_distribution': 'Signature Distribution',
    'temporal_heatmap': 'Temporal Patterns'
  };

  async function loadGraphData(graphType) {
    try {
      const response = await fetch(`./trend_analysis/visualization_data/${graphType}.json`);
      const data = await response.json();
      plotData = data;
    } catch (err) {
      console.error('Error loading graph data:', err);
      plotData = null;
    }
  }

  $: if (selectedGraph) {
    loadGraphData(selectedGraph);
  }
</script>

<div class="text-center">
  <h1>Trend Analysis</h1>
  <p>
    We analysed an advanced dataset of malware samples with when they were first detected, the
    source and their malware family. The dataset comprised of more than 45 Million malware samples.
    Our detection system is also trained on the same database
  </p>

  <select bind:value={selectedGraph}>
    <option value="" disabled selected>Choose a Report</option>
    {#each Object.entries(graphs) as [value, label]}
      <option value={value}>{label}</option>
    {/each}
  </select>

  <div class="graph-container">
    {#if plotData}
      <PlotlyGraph data={plotData.data} layout={plotData.layout} />
    {:else if selectedGraph}
      <p>Loading graph...</p>
    {/if}
  </div>
</div>

<style>
  .graph-container {
    width: 90%;
    height: 600px;
    margin: 2rem auto;
  }
  
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
