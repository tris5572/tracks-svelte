<script lang="ts">
	import GeometryUtil from 'leaflet-geometryutil';
	import { draggingTrack, track } from './stores';

	const outputKind = [
		'JSON配列',
		'CSV(くくりなし、末尾カンマあり)',
		'CSV(くくりなし、末尾カンマなし)',
		'CSV(くくりあり、末尾カンマあり)',
		'CSV(くくりあり、末尾カンマなし)',
	];
	let kind = outputKind[0];

	let targetTrack; // 表示対象の軌跡。ドラッグ中かどうかで変わる。

	let trackLength = '---'; // 始点から終点までの距離。
	let outputString = '';
	let outputSample = '';

	// 距離の文字列を生成。
	$: {
		const length = GeometryUtil.length(targetTrack);
		if (length < 1000) {
			trackLength = `${length.toFixed(1)}m`;
		} else if (length < 10000) {
			trackLength = `${(length / 1000).toFixed(2)}km`;
		} else {
			trackLength = `${(length / 1000).toFixed(1)}km`;
		}
	}

	// 軌跡の状態（ドラッグ中かどうか）に応じて、情報の元になる情報を切り替える。
	$: {
		targetTrack = $draggingTrack != null ? $draggingTrack : $track;
	}

	// 軌跡から出力サンプルを生成。
	$: {
		let buf = '';

		if (kind == outputKind[0]) {
			// JSON配列
			buf += '[\n';
			let i = 0;
			for (const t of targetTrack) {
				buf += `  [${t.lat.toFixed(7)}, ${t.lng.toFixed(7)}]`;
				// 最後以外のときは末尾カンマを付ける。
				if (i < targetTrack.length - 1) {
					buf += ',';
				}
				buf += '\n';

				i++;
			}
			buf += ']\n';
		} else if (kind == outputKind[1]) {
			// CSV(くくりなし、末尾カンマあり)
			for (const t of targetTrack) {
				buf += `${t.lat.toFixed(7)},${t.lng.toFixed(7)},\n`;
			}
		} else if (kind == outputKind[2]) {
			// CSV(くくりなし、末尾カンマなし)
			for (const t of targetTrack) {
				buf += `${t.lat.toFixed(7)},${t.lng.toFixed(7)}\n`;
			}
		} else if (kind == outputKind[3]) {
			// CSV(くくりあり、末尾カンマあり)
			for (const t of targetTrack) {
				buf += `"${t.lat.toFixed(7)}","${t.lng.toFixed(7)}",\n`;
			}
		} else if (kind == outputKind[4]) {
			// CSV(くくりあり、末尾カンマなし)
			for (const t of targetTrack) {
				buf += `"${t.lat.toFixed(7)}","${t.lng.toFixed(7)}"\n`;
			}
		}
		outputString = buf;

		// サンプルは、最初の3行と、最後の3行を抽出して表示する。
		const lines = buf.trim().split('\n');
		if (lines.length <= 6) {
			outputSample = buf;
		} else {
			const a = lines.slice(0, 3);
			a.push('　　　：');
			const b = lines.slice(-3); // 最後の改行があるので、取得要素数+1 を指定する。
			outputSample = a.concat(b).join('\n');
		}
	}

	// 選択肢を元に、出力文字列を生成して返す。
	function createOutput(): string {
		return '';
	}

	// 軌跡をクリアする。ここに書くのは微妙だけど、とりあえず。
	function clearTrack() {
		$track = [];
		$draggingTrack = null;
	}

	// 軌跡の文字列をクリップボードへコピーする。
	function copyToClipboard() {
		navigator.clipboard.writeText(outputString);
	}
</script>

<section id="main">
	<div class="box">
		<p>ポイント数：<strong>{targetTrack.length}</strong></p>
		<p>長さ：<strong>{trackLength}</strong></p>
		<button id="clear-button" on:click={clearTrack}>軌跡をクリア</button>
	</div>

	<div class="box">
		{#each outputKind as k}
			<label>
				<input type="radio" bind:group={kind} value={k} />
				{k}
			</label>
		{/each}

		<p id="sample">{@html outputSample}</p>
		<button on:click={copyToClipboard}>クリップボードへコピー</button>
	</div>

	<div id="footer">
		<a href="https://github.com/tris5572/tracks-svelte" target="_blank"
			>GitHub</a
		>
	</div>
</section>

<style>
	#main {
		/* background: rgb(200, 207, 207); */
		/* height: 100%; */
		font-size: small;
		padding-top: 1em;
		font-size: small;
	}

	.box {
		border: 1px solid rgb(120, 123, 126);
		margin: 4px;
		padding: 4px;
	}
	.box p {
		margin: 0px 2px;
	}
	#sample {
		font-family: monospace;
		font-size: small;
		white-space: pre-wrap;
		background: rgb(226, 228, 230);
		border: 1px solid rgb(153, 153, 153);
		margin: 0 0 4px;
		padding: 4px;
	}

	button {
		margin: 0px;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid #999;
	}

	#footer {
		position: absolute;
		bottom: 0px;
		right: 0px;
		padding: 2px;
	}
</style>
