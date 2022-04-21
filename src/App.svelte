<script lang="ts">
	import Information from './Information.svelte';
	import Map from './Map.svelte';

	// export let name: string;
</script>

<!-- <main>
	<h1>Hello {name}!</h1>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
</main> -->

<div id="container">
	<main id="map">
		<Map />
	</main>
	<div id="information">
		<Information />
	</div>
</div>

<style>
	:global(body) {
		background: rgb(200, 207, 207);
	}

	#container {
		display: flex;
	}

	#map {
		width: 100%;
		height: 100vh;
	}

	#information {
		width: 20em;
		height: 100vh;
	}

	/* main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	} */
</style>
