var input_foucus = 0;

mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpenphcmRzdCIsImEiOiJja3RyeTlranYxYjl1Mm5taGJmM3Q5OGNtIn0.MbVlF587At3aXBaTg_5Uow';
const map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v11',
	center: [153, -27.5], // starting position
	zoom: 12
});

var coords_start = [153, -27.5];
var coords_end = [153, -27.5];

// create a function to make a directions request
async function getRoute() {
	if (! (map.getLayer('start') && map.getLayer('end'))) {
		console.log("No start or end!")
		return;
	}
	
	const start = coords_start;
	const end = coords_end; 
	const query = await fetch(
		`https://api.mapbox.com/directions/v5/mapbox/cycling/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
		{ method: 'GET' }
	);
	const json = await query.json();
	const data = json.routes[0];
	const route = data.geometry.coordinates;
	const geojson = {
		type: 'Feature',
		properties: {},
		geometry: {
			type: 'LineString',
			coordinates: route
		}
	};
	// if the route already exists on the map, we'll reset it using setData
	if (map.getSource('route')) {
		map.getSource('route').setData(geojson);
	}
	// otherwise, we'll make a new request
	else {
		map.addLayer({
			id: 'route',
			type: 'line',
			source: {
				type: 'geojson',
				data: geojson
			},
			layout: {
				'line-join': 'round',
				'line-cap': 'round'
			},
			paint: {
				'line-color': '#3887be',
				'line-width': 5,
				'line-opacity': 0.75
			}
		});
	}
	
	const bbox = [[coords_start[0], coords_start[1]], [coords_end[0], coords_end[1]]];
	camera = map.cameraForBounds(bbox);
	console.log(camera)
	map.setZoom(camera.zoom - 0.8);
	center = [0.5 * (coords_start[0] + coords_end[0]), 0.5 * (coords_start[1] + coords_end[1])];
	
	
	map.flyTo({
		center: center,
		essential: true,
		screenSpeed: 1,
		easing: (t) => {
			return t;
		}
	});
	
	// add turn instructions here at the end
	// get the sidebar and add the instructions
}

map.on('load', () => {
	// getRoute();
	map.setLayoutProperty('country-label', 'text-field', ['format',
		['get', 'name_en'], { 'font-scale': 1.2 },
		'\n', {},
		['get', 'name'], {
		'font-scale': 0.8,
		'text-font': ['literal', [ 'DIN Offc Pro Italic', 'Arial Unicode MS Regular' ]]
		}
	]);
});


map.on('click', function ({ lngLat }) {
	if (input_foucus == 1) {
		coords_start = Object.keys(lngLat).map((key) => lngLat[key]);
		console.log("coords_start: " + coords_start)
		drawStart(coords_start);
		getRoute();
	}
	else if (input_foucus == 2) {
		coords_end = Object.keys(lngLat).map((key) => lngLat[key]);
		console.log("coords_end: " + coords_end)
		drawEnd(coords_end);
		getRoute();
	}
});

function placeToCoords() {
	const Http = new XMLHttpRequest();
	var search_location = document.getElementById("start-address").value;
	search_location = search_location.replace(/ /g, "%20");
	search_location = search_location.replace(/,/g, "%20");
	console.log(search_location);
	const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + search_location + '.json?access_token=pk.eyJ1IjoiYmxpenphcmRzdCIsImEiOiJja3RyeTlranYxYjl1Mm5taGJmM3Q5OGNtIn0.MbVlF587At3aXBaTg_5Uow';
	Http.open("GET", url);
	Http.send();
	Http.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200) {
			geoinfo = Http.responseText;
			index = geoinfo.search("center");
			coords = Http.responseText.substring(index + 9);
			index = coords.search("]");
			coords = coords.substring(0, index).split(",");
			
			coords_start = [parseFloat(coords[0]), parseFloat(coords[1])];
			console.log("coords_start: " + coords_start)
			drawStart(coords_start);
			_placeToCoords();
		}
	}
}

function _placeToCoords() {
	const Http = new XMLHttpRequest();
	var search_location = document.getElementById("end-address").value;
	search_location = search_location.replace(/ /g, "%20");
	search_location = search_location.replace(/,/g, "%20");
	console.log(search_location);
	const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + search_location + '.json?access_token=pk.eyJ1IjoiYmxpenphcmRzdCIsImEiOiJja3RyeTlranYxYjl1Mm5taGJmM3Q5OGNtIn0.MbVlF587At3aXBaTg_5Uow';
	Http.open("GET", url);
	Http.send();
	Http.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200) {
			geoinfo = Http.responseText;
			index = geoinfo.search("center");
			coords = Http.responseText.substring(index + 9);
			index = coords.search("]");
			coords = coords.substring(0, index).split(",");
			
			coords_end = [parseFloat(coords[0]), parseFloat(coords[1])];
			console.log("coords_end: " + coords_end)
			drawEnd(coords_end);
			getRoute();
		}
	}
}

function drawStart(coords) {
	const start = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'Point',
					coordinates: coords
				}
			}
		]
	};
	if (map.getLayer('start')) {
		map.getSource('start').setData(start);
	} 
	else {
		map.addLayer({
			id: 'start',
			type: 'circle',
			source: {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: [
						{
							type: 'Feature',
							properties: {},
							geometry: {
								type: 'Point',
								coordinates: coords
							}
						}
					]
				}
			},
			paint: {
				'circle-radius': 10,
				'circle-color': '#6a0dad'
			}
		});
	}
}

function drawEnd(coords) {
	const end = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'Point',
					coordinates: coords
				}
			}
		]
	};
	if (map.getLayer('end')) {
		map.getSource('end').setData(end);
	} 
	else {
		map.addLayer({
			id: 'end',
			type: 'circle',
			source: {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: [
						{
							type: 'Feature',
							properties: {},
							geometry: {
								type: 'Point',
								coordinates: coords
							}
						}
					]
				}
			},
			paint: {
				'circle-radius': 10,
				'circle-color': '#FF0000'
			}
		});
	}
}

function setInputFocus(num) {
	input_foucus = num;
	if (num == 1) {
		document.getElementById("start-address").style.borderColor = "#6a0dad";
		document.getElementById("end-address").style.borderColor = "lightgrey";
	}	
	else if (num == 2) {
		document.getElementById("end-address").style.borderColor = "#FF0000";
		document.getElementById("start-address").style.borderColor = "lightgrey";
	}
}