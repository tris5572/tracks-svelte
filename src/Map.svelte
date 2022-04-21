<script lang="ts">
	import * as L from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import GeoUtil from 'leaflet-geometryutil';
	import { onMount } from 'svelte';
	import { track, draggingTrack } from './stores';

	const LINE_OPTIONS = {
		color: 'yellow',
		weight: 4,
		opacity: 0.8,
	};

	const POINT_OPTIONS = {
		color: 'orange',
		radius: 6,
		opacity: 0.8,
	};

	let mapElement: HTMLElement;
	let map: L.Map;

	let trackLayer: L.LayerGroup = L.layerGroup();

	let draggingStartPoint: L.LatLng; // 点のドラッグが開始された座標。クリック判定に使用。
	let clickFlag = false; // 点がクリックされたかどうかのフラグ。

	$: {
		if (map != undefined) {
			updateTrackView();
		}
		$track;
		$draggingTrack;
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

		map.on('click', (e: L.LeafletMouseEvent) => {
			mapClicked(e);
		});
	}

	// 地図がクリックされたときに呼び出され、新しい点を追加する。
	function mapClicked(e: L.LeafletMouseEvent) {
		const latlng = e.latlng;
		$track = [...$track, latlng];
	}

	// 軌跡の表示を更新する。
	function updateTrackView() {
		trackLayer.clearLayers();

		// 点や線をドラッグ中かどうかに応じて、表示処理を分岐。
		if ($draggingTrack != null) {
			// 点や線をドラッグ中の場合は、ドラッグ中の座標を元に表示する。
			// 表示だけで、コールバックは登録しない。

			// 線を表示する。
			let line = L.polyline($draggingTrack, LINE_OPTIONS);
			line.addTo(trackLayer);

			// 点を表示する。
			for (const p of $draggingTrack) {
				let circle = L.circleMarker(p, POINT_OPTIONS);
				circle.addTo(trackLayer);
			}
		} else {
			// ドラッグ中でない場合は、持っている座標を元に表示する。

			// 線を表示する。
			let line = L.polyline($track, LINE_OPTIONS);

			function trackLineDrag(e: L.LeafletMouseEvent) {
				// セグメントの開始点の座標を取得。
				const segment = getSegment(e.latlng, line).segment;
				const start = $draggingTrack.indexOf(segment[0]);
				const end = $draggingTrack.indexOf(segment[1]);
				// ドラッグ中の点を追加済みかどうかで処理を変える。
				if (end - start === 1) {
					// 初めてのときは点を追加する。
					$draggingTrack.splice(start + 1, 0, e.latlng);
					$draggingTrack = $draggingTrack;
				} else {
					// すでにドラッグ中の点が追加されているときは、点の座標を上書きする。
					$draggingTrack[start + 1] = e.latlng;
					$draggingTrack = $draggingTrack;
				}
			}

			// 線のドラッグが開始されたとき。
			line.on('mousedown', (e: L.LeafletMouseEvent) => {
				map.dragging.disable();
				$draggingTrack = [...$track]; // ドラッグ中軌跡へコピー。
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
			for (const p of $track) {
				let circle = L.circleMarker(p, POINT_OPTIONS);

				// 点のドラッグを追跡し、当該の座標を移動させるコールバック。
				function trackPointDrag(e: L.LeafletMouseEvent) {
					// 軌跡からドラッグ元の座標と一致するものを探し、ドラッグ中の座標に置き換える。
					for (const i in $track) {
						if ($track[i] == p) {
							$draggingTrack[i] = L.latLng(e.latlng.lat, e.latlng.lng);
							clickFlag = false; // 位置が変わったらクリックではない。
						}
					}
				}

				// 点のドラッグが開始されたとき。
				circle.on('mousedown', (e: L.LeafletMouseEvent) => {
					map.dragging.disable();
					$draggingTrack = [...$track]; // ドラッグ中軌跡へコピー。
					draggingStartPoint = p; // 押された点の座標を記録。
					clickFlag = true;
					map.on('mousemove', trackPointDrag);
				});

				// 点のドラッグが終了したときのコールバックを追加。map に対して追加する。
				// 開始と関数を合わせる必要があるため、trackDrag を引数なしで登録している。
				map.on('mouseup', (e: L.LeafletMouseEvent) => {
					map.dragging.enable();
					// ドラッグ中軌跡で確定し、ドラッグを終了。
					if ($draggingTrack != null) {
						$track = [...$draggingTrack];
						$draggingTrack = undefined;

						// クリックされたとき、点を消す。
						if (clickFlag) {
							for (let i = 0; i < $track.length; i++) {
								if ($track[i] == draggingStartPoint) {
									$track.splice(i, 1);
									$track = $track;
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
</script>

<div id="map" bind:this={mapElement} />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	#map {
		width: 100%;
		height: 100vh;
	}

	/* マウスカーソルを強制的に変更 */
	:global(.leaflet-grab) {
		cursor: default !important;
	}
</style>
