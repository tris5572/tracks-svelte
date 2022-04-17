<script lang="ts">
	import * as L from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import { onMount } from 'svelte';
	import GeoUtil from 'leaflet-geometryutil';

	let mapElement: HTMLElement;
	let map: L.Map;

	let trackLayer: L.LayerGroup = L.layerGroup();

	let track: L.LatLng[] = [
		new L.LatLng(36.0, 139.4),
		new L.LatLng(35.8, 139.8),
		new L.LatLng(35.5, 139.2),
	];

	let draggingTrack: L.LatLng[];
	let draggingStartPoint: L.LatLng; // ドラッグが開始された点の座標。クリック判定に使用。
	let clickFlag = false; // クリックされたかどうかのフラグ。

	// let centerCross: L.Marker;

	// let laglngFieldValue = '';
	// let latlngFieldWarning = false;

	// let radiusCircle: L.Circle;
	// let radiusValue = 300;
	// let radiusFlag = false;

	// 半径表示の表示/非表示を、チェックボックスの値に応じて切り替える。
	// $: {
	// 	if (radiusCircle != null) {
	// 		if (radiusFlag === true) {
	// 			radiusCircle.addTo(map);
	// 		} else {
	// 			radiusCircle.removeFrom(map);
	// 		}
	// 	}
	// }

	// // 半径表示の半径を、テキストフィールドの値に応じて変化させる。
	// $: {
	// 	if (radiusCircle != null) {
	// 		radiusCircle.setRadius(radiusValue);
	// 	}
	// }

	$: {
		if (map != undefined) {
			updateTrackView();
		}
		track;
		draggingTrack;
	}

	onMount(() => {
		initMap();
	});

	// 地図タイルを初期化する。onMount() 以降で呼び出すこと。
	function initMap() {
		let pale = L.tileLayer('https://maps.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
			maxZoom: 18,
		});
		let std = L.tileLayer('https://maps.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
			maxZoom: 18,
		});
		let photo = L.tileLayer(
			'https://maps.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
			{
				attribution:
					'&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
				maxZoom: 18,
			}
		);

		// 地図を初期化する。
		map = L.map(mapElement, {
			layers: [pale],
		});

		// タイル一覧を設定する。オプションを渡して常に表示させる。
		L.control
			.layers(
				{
					'地理院地図(淡色)': pale,
					'地理院地図(標準)': std,
					'地理院地図(写真)': photo,
				},
				null,
				{ collapsed: false }
			)
			.addTo(map);

		trackLayer.addTo(map);

		// 初期表示位置をセットする。load イベントを発火させるために、on で load をセット後に呼び出す。
		map.setView([35.8, 139.3], 9);

		// 地図が動かされたとき、表示する座標等の情報を更新する。
		// map.on('load', (e: L.LeafletEvent) => {
		// 	mapMoved(e);
		// });
		// map.on('move', (e: L.LeafletEvent) => {
		// 	mapMoved(e);
		// });

		map.on('click', (e: L.LeafletMouseEvent) => {
			mapClicked(e);
		});
	}

	// 地図がクリックされたときに呼び出され、新しい点を追加する。
	function mapClicked(e: L.LeafletMouseEvent) {
		const latlng = e.latlng;
		track = [...track, latlng];
		// console.log(e);
	}

	// 軌跡の表示を更新する。
	function updateTrackView() {
		trackLayer.clearLayers();

		// 点や線をドラッグ中かどうかに応じて、表示処理を分岐。
		if (draggingTrack != null) {
			// 点や線をドラッグ中の場合は、ドラッグ中の座標を元に表示する。
			// 表示だけで、コールバックは登録しない。

			// 線を表示する。
			let line = L.polyline(draggingTrack, { color: 'yellow', weight: 4 });
			line.addTo(trackLayer);

			// 点を表示する。
			for (const p of draggingTrack) {
				let circle = L.circleMarker(p, { color: 'orange', radius: 6 });
				circle.addTo(trackLayer);
			}
		} else {
			// ドラッグ中でない場合は、持っている座標を元に表示する。

			// 線を表示する。
			let line = L.polyline(track, { color: 'yellow', weight: 4 });

			function trackLineDrag(e: L.LeafletMouseEvent) {
				// セグメントの開始点の座標を取得。
				const segment = getSegment(e.latlng, line).segment;
				const start = draggingTrack.indexOf(segment[0]);
				const end = draggingTrack.indexOf(segment[1]);
				// ドラッグ中の点を追加済みかどうかで処理を変える。
				if (end - start === 1) {
					// 初めてのときは点を追加する。
					draggingTrack.splice(start + 1, 0, e.latlng);
					draggingTrack = draggingTrack;
				} else {
					// すでにドラッグ中の点が追加されているときは、点の座標を上書きする。
					draggingTrack[start + 1] = e.latlng;
					draggingTrack = draggingTrack;
				}
			}

			// 線のドラッグが開始されたとき。
			line.on('mousedown', (e: L.LeafletMouseEvent) => {
				map.dragging.disable();
				draggingTrack = [...track]; // ドラッグ中軌跡へコピー。
				map.on('mousemove', trackLineDrag);
			});
			// マウスアップ（線のドラッグが終了）したとき。
			map.on('mouseup', (e: L.LeafletMouseEvent) => {
				map.dragging.enable();
				// クリック判定が不要なため、ここの処理はシンプル。
				map.off('mousemove', trackLineDrag);
			});

			line.addTo(trackLayer);

			// 点を表示する。
			for (const p of track) {
				let circle = L.circleMarker(p, { color: 'orange', radius: 6 });

				// 点のドラッグを追跡し、当該の座標を移動させるコールバック。
				function trackPointDrag(e: L.LeafletMouseEvent) {
					// 軌跡からドラッグ元の座標と一致するものを探し、ドラッグ中の座標に置き換える。
					for (const i in track) {
						if (track[i] == p) {
							draggingTrack[i] = L.latLng(e.latlng.lat, e.latlng.lng);
							clickFlag = false; // 位置が変わったらクリックではない。
						}
					}
				}

				// 点のドラッグが開始されたとき。
				circle.on('mousedown', (e: L.LeafletMouseEvent) => {
					map.dragging.disable();
					draggingTrack = [...track]; // ドラッグ中軌跡へコピー。
					draggingStartPoint = p; // 押された点の座標を記録。
					clickFlag = true;
					map.on('mousemove', trackPointDrag);
				});

				// 点のドラッグが終了したときのコールバックを追加。map に対して追加する。
				// 開始と関数を合わせる必要があるため、trackDrag を引数なしで登録している。
				map.on('mouseup', (e: L.LeafletMouseEvent) => {
					map.dragging.enable();
					// ドラッグ中軌跡で確定し、ドラッグを終了。
					if (draggingTrack != null) {
						track = [...draggingTrack];
						draggingTrack = undefined;

						// クリックされたとき、点を消す。
						if (clickFlag) {
							for (let i = 0; i < track.length; i++) {
								if (track[i] == draggingStartPoint) {
									track.splice(i, 1);
									track = track;
									break;
								}
							}
						}
					}

					map.off('mousemove', trackPointDrag);
				});

				circle.addTo(trackLayer);
			}
		}
	}

	// クリックされた座標が、ポリラインのどのセグメントに該当するかを返す。
	// https://stackoverflow.com/questions/65082167/obtain-a-segment-of-polyline-which-was-clicked
	function getSegment(latlng: L.LatLng, polyline: L.Polyline) {
		// get layerpoint of user click
		const latlngs = polyline.getLatLngs() as L.LatLng[];
		let segments = [];

		// get segments of polyline
		// calculate distances from point to each polyline
		for (let i = 0; i < latlngs.length - 1; i++) {
			const pointToLineDistance = GeoUtil.distanceSegment(
				map,
				latlng,
				latlngs[i],
				latlngs[i + 1]
			);

			segments.push({
				index: i,
				pointToLineDistance,
				segment: [latlngs[i], latlngs[i + 1]],
			});
		}

		// sort segments by shortest distance
		segments.sort((a, b) =>
			a.pointToLineDistance < b.pointToLineDistance ? -1 : 1
		);

		// return first entry, which has shortest distance
		return segments[0];
	}

	// 地図が動かされたときと初期化されたときに呼び出され、現在の位置情報関係の表示等を更新する。
	// function mapMoved(e: L.LeafletEvent) {
	// 	let c = e.target.getCenter();
	// 	let latlng: L.LatLngExpression = [c.lat, c.lng];
	// 	currentLatLng.set(latlng);
	// 	currentZoom.set(map.getZoom());
	// 	centerCross.setLatLng(latlng);
	// 	radiusCircle.setLatLng(latlng);
	// }

	// // 渡された文字列をクリップボードへ書き込む。
	// function copyToClipboard(text: string) {
	// 	navigator.clipboard.writeText(text);
	// }

	// // DEG形式の現在座標をクリップボードへコピーする。
	// function copyDEG() {
	// 	copyToClipboard(
	// 		`${$currentLatLng[0].toFixed(7)},${$currentLatLng[1].toFixed(7)}`
	// 	);
	// }

	// // DMM形式の現在座標をクリップボードへコピーする。
	// function copyDMM() {
	// 	copyToClipboard(
	// 		`${deg2dmm($currentLatLng[0]).toFixed(5)},${deg2dmm(
	// 			$currentLatLng[1]
	// 		).toFixed(5)}`
	// 	);
	// }

	// // 緯度経度指定フィールドの値が変更されたときに呼び出される。
	// function latlngFieldChanged(e: Event) {
	// 	const latlng = analyzeLatlngInput(laglngFieldValue);
	// 	if (latlng == null) {
	// 		// 不正な値のときは警告表示にする。
	// 		latlngFieldWarning = true;
	// 	} else {
	// 		map.setView(latlng);
	// 	}
	// }

	// // 座標へ移動ボタンが押されたとき、緯度経度指定フィールドの座標へ移動する。
	// function moveToLatlng() {
	// 	const latlng = analyzeLatlngInput(laglngFieldValue);
	// 	if (latlng != null) {
	// 		map.setView(latlng);
	// 	}
	// }

	// // 緯度経度指定フィールドの値をクリアする。
	// function clearLatlng() {
	// 	laglngFieldValue = '';
	// }
</script>

<div id="map" bind:this={mapElement} />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	/* #container {
		width: 100vw;
		display: flex;
		flex-wrap: nowrap;
	} */

	#map {
		width: 100%;
		height: 100vh;
	}

	/* マウスカーソルを強制的に変更 */
	:global(.leaflet-grab) {
		cursor: default !important;
	}

	/* #information {
		width: 15em;
		background: hsl(180, 16%, 7%);
		color: white;
		padding: 0.5em;
	}

	#information .box {
		border: 1px solid hsla(0, 0%, 100%, 0.5);
		padding: 4px;
		margin: 0 0 8px;
	}
	.box h2 {
		margin: 0;
		font-size: small;
		opacity: 0.6;
	}
	.box button {
		padding: 2px 8px;
		margin: 4px 0;
		font-size: x-small;
		opacity: 0.9;
		cursor: pointer;
	}

	.latlngField {
		padding: 0 4px;
		margin: 4px 0;
	}
	.latlngFieldWarning {
		padding: 0 4px;
		margin: 4px 0;
		color: red;
	}
	.box .latlngFieldButtonBox {
		display: flex;
		justify-content: space-between;
	}
	.box button.submit {
		padding: 2px 8px;
		margin: 4px 0;
		font-size: small;
		cursor: pointer;
	}
	.box button.clear {
		padding: 2px 8px;
		margin: 4px 0;
		font-size: x-small;
		opacity: 0.9;
		cursor: pointer;
	}

	.raddiusCheckbox {
		margin: 0;
	}
	.radiusField {
		padding: 0 4px;
		margin: 4px 0;
		width: 4em;
	} */
</style>
