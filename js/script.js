/* Global constants & variables */

var input_foucus = 0;
const START_COLOR = "#8877ff";
const END_COLOR = "#f7347a";
const ROUTE_COLOR = "#1EA362";

mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpenphcmRzdCIsImEiOiJja3RyeTlranYxYjl1Mm5taGJmM3Q5OGNtIn0.MbVlF587At3aXBaTg_5Uow';

const map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v11',
	center: [153, -27.5], // starting position
	zoom: 12
});

var coords_start = [153, -27.5];
var coords_end = [153, -27.5];

retrieveData();

/* Functions */

async function getRoute(show=false) {
	if (!(map.getLayer('start') && map.getLayer('end'))) {
		console.log("No start or end!");
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
		// map.removeLayer('route');
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
				'line-color': ROUTE_COLOR,//'#3887be',
				'line-width': 8,
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
	if (show) {
		const instruction = document.getElementById('instruction');
		const steps = data.legs[0].steps;
	
		let tripInstructions = '';
		for (const step of steps) {
			tripInstructions += `<li>${step.maneuver.instruction}</li>`;
		}
		instruction.innerHTML = `<ol>${tripInstructions}</ol>`;
		const time_length = Math.floor(data.duration / 60);
		document.getElementById("time-length-txt").innerHTML = "Estimated " + time_length + " min";
	}
}

map.on('load', () => {
	// getRoute();
	map.setLayoutProperty('road-label', 'text-field', ['format',
		['get', 'name_en'], { 'font-scale': 11.2 },
		'\n', {},
		['get', 'name'], {
		'font-scale': 10.8,
		'text-font': ['literal', [ 'DIN Offc Pro Italic', 'Arial Unicode MS Regular' ]]
		}
	]);
	dataView("fountainData");
});

function dataView(dataName) {
	var color = "#FFFFFF";
	switch (dataName) {
		case "fountainData": {
			color = "#0000FF"; 
			document.getElementById("fountain-button").style.borderColor = color;
			document.getElementById("wifi-button").style.borderColor = "white";
			document.getElementById("park-button").style.borderColor = "white";
			document.getElementById("hide-button").style.borderColor = "white";
			break;
		}
		case "wifiData": {
			color = "#FF00FF"; 
			document.getElementById("fountain-button").style.borderColor = "white";
			document.getElementById("wifi-button").style.borderColor = color;
			document.getElementById("park-button").style.borderColor = "white";
			document.getElementById("hide-button").style.borderColor = "white";
			break;
		}
		case "parkData": {
			color = "#006400"; 
			document.getElementById("fountain-button").style.borderColor = "white";
			document.getElementById("wifi-button").style.borderColor = "white";
			document.getElementById("park-button").style.borderColor = color;
			document.getElementById("hide-button").style.borderColor = "white";
			break;
		}
		case "hideData": { 
			color = "grey"; 
			document.getElementById("fountain-button").style.borderColor = "white";
			document.getElementById("wifi-button").style.borderColor = "white";
			document.getElementById("park-button").style.borderColor = "white";
			document.getElementById("hide-button").style.borderColor = color;
			map.removeLayer('point');
			map.removeSource('point');
			return;
		}
	}
	selectedData = JSON.parse(localStorage.getItem(dataName));
	// console.log(dataName, "=", selectedData);
	fountainRecords = selectedData.result.records;
	fountainNum = fountainRecords.length;
	// console.log("dataNum =", fountainNum);
	var x = new Array(fountainNum);
	var y = new Array(fountainNum)
	var fcoords = [];
	var features = []
	for (var i = 0; i < fountainNum; i++) {
		if (dataName == "fountainData") {
			x[i] = fountainRecords[i].X;
			y[i] = fountainRecords[i].Y;
		}
		else if (dataName == "wifiData") {
			x[i] = fountainRecords[i].Longitude;
			y[i] = fountainRecords[i].Latitude;
		}
		else if (dataName == "parkData") {
			x[i] = fountainRecords[i].LONG;
			y[i] = fountainRecords[i].LAT;
		}
		features.push({
						'type': 'Feature',
						'geometry': {
							'type': 'Point',
							'coordinates': [x[i], y[i]]
						}
					})
	}
	// console.log("features =", features);
	
	if (map.getLayer('point')) {
		map.removeLayer('point');
		map.removeSource('point');
	}

	map.addSource('point', {
	'type': 'geojson',
	'data': {
		'type': 'FeatureCollection',
		'features': features
		}
	});

	a = map.addLayer({
		'id': "point",
		'type': 'circle',
		'source': 'point',
		paint: {
			'circle-radius': 4,
			'circle-color': color
		}
	});	
}


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
	coordsToPlace();
});

function coordsToPlace() {
	const Http = new XMLHttpRequest();
	var search_coords = [0, 0];
	
	if (input_foucus == 1) {
		search_coords = coords_start[0] + ',' + coords_start[1];
	}
	else if (input_foucus == 2) {
		search_coords = coords_end[0] + ',' + coords_end[1];
	}
	console.log("search_coords: " + search_coords);
	const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + search_coords + `.json?types=poi&access_token=${mapboxgl.accessToken}`;
	Http.open("GET", url);
	Http.send();
	Http.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200) {
			geoinfo = Http.responseText;
			index = geoinfo.search("address");
			address = Http.responseText.substring(index + 10);
			index = address.search('category');
			address = address.substring(0, index - 3);
			console.log("Clicked Address: " + address);
			
			if (input_foucus == 1) {
				document.getElementById("start-address").value = address;
			}
			else if (input_foucus == 2) {
				document.getElementById("end-address").value = address;
			}
			
		}
	}
}

function placeToCoords() {
	const Http = new XMLHttpRequest();
	var search_location = document.getElementById("start-address").value;
	search_location = search_location.replace(/ /g, "%20");
	search_location = search_location.replace(/,/g, "%20");
	//console.log(search_location);
	const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + search_location + `.json?access_token=${mapboxgl.accessToken}`;
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
	//console.log(search_location);
	const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + search_location + `.json?access_token=${mapboxgl.accessToken}`;
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
	const start_text = {
		"geometry": {
			"type": "Point",
			"coordinates": [coords[0], coords[1]]
		},
		"type": "Feature",
		"properties": {
			"text": "Start",
		}
    };	
	if (map.getLayer('start')) {
		map.getSource('start').setData(start);
		map.getSource('start_text').setData(start_text);
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
				'circle-radius': 12,
				'circle-color': START_COLOR
			}
		});
		
		map.addSource('start_text', {
			type: "geojson",
			data: start_text
		});
		map.addLayer({
			"id": 'start_text_layer',
			"type": "symbol",
			"minzoom": 0,
			"maxzoom": 22,
			"source": 'start_text',
			"layout": {
				"text-field": [
					"format", 
					["get", "text"], 
					{
						"text-font": ["literal", ["Open Sans Regular"]],
						"text-color": START_COLOR,
						"font-scale": 3
					}
				],
				"text-size": 16,
				"text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
				"text-offset": [1.2, 0],
				"text-anchor": "left",
				"text-justify": "left",
				"text-max-width": 20,
				"text-allow-overlap": false,
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
	const end_text = {
		"geometry": {
			"type": "Point",
			"coordinates": [coords[0], coords[1]]
		},
		"type": "Feature",
		"properties": {
			"text": "End",
		}
    };	
	if (map.getLayer('end')) {
		map.getSource('end').setData(end);
		map.getSource('end_text').setData(end_text);
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
				'circle-radius': 12,
				'circle-color': END_COLOR
			}
		});
		
		map.addSource('end_text', {
			type: "geojson",
			data: end_text
		});
		map.addLayer({
			"id": 'end_text_layer',
			"type": "symbol",
			"minzoom": 0,
			"maxzoom": 22,
			"source": 'end_text',
			"layout": {
				"text-field": [
					"format", 
					["get", "text"], 
					{
						"text-font": ["literal", ["Open Sans Regular"]],
						"text-color": END_COLOR,
						"font-scale": 3
					}
				],
				"text-size": 16,
				"text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
				"text-offset": [1.2, 0],
				"text-anchor": "left",
				"text-justify": "left",
				"text-max-width": 20,
				"text-allow-overlap": false,
			}
		});
	}
}

function setInputFocus(num) {
	input_foucus = num;
	if (num == 1) {
		document.getElementById("start-address").style.borderColor = START_COLOR;
		document.getElementById("end-address").style.borderColor = "lightgrey";
		document.getElementById("map").style.borderColor = START_COLOR;
	}	
	else if (num == 2) {
		document.getElementById("end-address").style.borderColor = END_COLOR;
		document.getElementById("start-address").style.borderColor = "lightgrey";
		document.getElementById("map").style.borderColor = END_COLOR;
	}
}

function goDirection() {
	window.location.href = "./direction.html?start=" + coords_start + "&end=" + coords_end;
}

function setInputAddress() {
	placeToCoords();
}

function goUrl(url) {
	window.location.href = url;
}

function getQueryVariable(varName) {
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i = 0; i < vars.length; i++) {
               var pair = vars[i].split("=");
               if(pair[0] == varName)
				   return pair[1];
       }
       return(false);
}

function showDirection() {
	coords_start = getQueryVariable("start").split(",");
	coords_start = [parseFloat(coords_start[0]), parseFloat(coords_start[1])];
	coords_end = getQueryVariable("end").split(",");
	coords_end = [parseFloat(coords_end[0]), parseFloat(coords_end[1])];
	// console.log(coords_start, coords_end);
	drawStart(coords_start);
	drawEnd(coords_end);
	getRoute(show=true);
}

function retrieveData() {
	$(document).ready(function() {
		var data = {
			// Drinking Fountain Tap
			resource_id: "69c588f4-232a-4e71-88ee-045f8afb6880",
			limit: 9999
		}

		$.ajax({
			url: "https://www.data.brisbane.qld.gov.au/data/api/3/action/datastore_search",
			data: data,
			dataType: "jsonp", // We use "jsonp" to ensure AJAX works correctly locally (otherwise XSS).
			cache: true,
			success: function(data) {
				localStorage.setItem("fountainData", JSON.stringify(data));
				// console.log("Success!");
				// iterateRecords(data);
			}
		});
		
		var fountainData = JSON.parse(localStorage.getItem("fountainData"));
		// console.log("fountainData =", fountainData);
		
		var data2 = {
			// (free) Wireless hotspot locations — Libraries, Parks and Public spaces
			// https://data.gov.au/dataset/ds-brisbane-17fb3724-ecfc-4802-8f16-62839fb73fc0/details?q=bench
			resource_id: "9851b9fd-8a46-4268-9ece-4e45b143e8c9",
			limit: 9999
		}
		

		$.ajax({
			url: "https://www.data.brisbane.qld.gov.au/data/api/3/action/datastore_search",
			data: data2,
			dataType: "jsonp", // We use "jsonp" to ensure AJAX works correctly locally (otherwise XSS).
			cache: true,
			success: function(data) {
				// console.log("Before Success!");
				localStorage.setItem("wifiData", JSON.stringify(data));
				// console.log("Success!");
				// iterateRecords(data);
			}
		});
		
		var parkData = JSON.parse(localStorage.getItem("parkData"));
		// console.log("parkData=", parkData);
		
		var data3 = {
			// Park — Locations
			// https://data.gov.au/dataset/ds-brisbane-0335347d-d085-4c5a-a26a-3b92e8bb7a87/details?q=parks
			resource_id: "2c8d124c-81c6-409d-bffb-5761d10299fe",
			limit: 9999
		}
		

		$.ajax({
			url: "https://www.data.brisbane.qld.gov.au/data/api/3/action/datastore_search",
			data: data3,
			dataType: "jsonp", // We use "jsonp" to ensure AJAX works correctly locally (otherwise XSS).
			cache: true,
			success: function(data) {
				// console.log("Before Success!");
				localStorage.setItem("parkData", JSON.stringify(data));
				// console.log("Success!");
				// iterateRecords(data);
			}
		});
		
		var parkData = JSON.parse(localStorage.getItem("parkData"));
		// console.log("parkData=", parkData);
		
		
		return true;
	});
}


