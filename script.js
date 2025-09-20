// Initialize the map and set its center and zoom level
const map = L.map('map').setView([20.5937, 78.9629], 5);

// Get the info panel element to update its content
const infoPanel = document.getElementById('info-panel');

// The GeoJSON file with the state boundaries
const geojsonDataUrl = 'india_states.geojson';

// The CORRECT property name for the state's name based on your file
const stateNameProperty = 'st_nm';

// Data for the locations to display on the map
const orphanageLocations = [
    {
        name: "Srinagar",
        lat: 34.0836,
        lon: 74.7973
    },
    {
        name: "Hyderabad",
        lat: 17.3850,
        lon: 78.4867
    },
    // The three locations you sent me
    {
        name: "Mahima Ministries Branch 1",
        lat: 17.375311115519064,
        lon: 77.89827233659041
    },
    {
        name: "Mahima Ministries Branch 2",
        lat: 17.52390264237546,
        lon: 78.31738500960867
    },
    {
        name: "Mahima Ministries Branch 3",
        lat: 17.523759376153624,
        lon: 78.31724553436287
    },
];

// Function to handle the style of each state
function style(feature) {
    return {
        fillColor: '#FF9933',
        weight: 1.5,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

let geojson;
let previousSelectedLayer = null;

// Function to handle actions for each state
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: function(e) {
            e.target.setStyle({
                weight: 3,
                fillOpacity: 0.9
            });
            if (feature.properties && feature.properties[stateNameProperty]) {
                e.target.bindTooltip(feature.properties[stateNameProperty], { permanent: false, sticky: true }).openTooltip();
            }
        },
        mouseout: function(e) {
            geojson.resetStyle(e.target);
            if (previousSelectedLayer && previousSelectedLayer === e.target) {
                e.target.setStyle({ fillColor: '#008000' });
            }
            // Close tooltip on mouseout
            if (e.target.getTooltip()) {
                e.target.closeTooltip();
            }
        },
        click: function(e) {
            if (previousSelectedLayer) {
                geojson.resetStyle(previousSelectedLayer);
                if (previousSelectedLayer.getTooltip()) {
                    previousSelectedLayer.closeTooltip();
                }
            }

            e.target.setStyle({
                fillColor: '#008000'
            });

            previousSelectedLayer = e.target;

            if (feature.properties && feature.properties[stateNameProperty]) {
                infoPanel.innerHTML = '<h3>You have selected: ' + feature.properties[stateNameProperty] + '</h3>';
                // Show tooltip on click as well
                e.target.bindTooltip(feature.properties[stateNameProperty], { permanent: false, sticky: true }).openTooltip();
            } else {
                infoPanel.innerHTML = '<h3>You have selected a state, but the name property was not found.</h3>';
            }

            map.fitBounds(e.target.getBounds());
        }
    });
}

// Fetch the GeoJSON data and add it to the map
fetch(geojsonDataUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        geojson = L.geoJSON(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);

        map.fitBounds(geojson.getBounds());
        
        // Add the location markers after the map is loaded
        addMarkersToMap();
    })
    .catch(error => {
        console.error('Error loading the GeoJSON file:', error);
        infoPanel.innerHTML = '<h3>Error loading the map. Please check the console for details.</h3>';
    });


// Store marker cluster group globally for filtering
let markers;

// Telangana bounding box (approximate)
const telanganaBounds = {
    north: 19.0,
    south: 15.8,
    east: 80.5,
    west: 77.0
};

// Function to check if a location is in Telangana
function isInTelangana(lat, lon) {
    return lat >= telanganaBounds.south && lat <= telanganaBounds.north &&
           lon >= telanganaBounds.west && lon <= telanganaBounds.east;
}

// Function to add markers from your data using marker clustering
function addMarkersToMap(locations = orphanageLocations) {
    // Remove previous markers if any
    if (markers) {
        map.removeLayer(markers);
    }
    // Create a new marker cluster group
    markers = L.markerClusterGroup();

    locations.forEach(location => {
        const marker = L.marker([location.lat, location.lon]);

        // Bind a permanent tooltip to the marker to show the location name
        marker.bindTooltip(location.name, {
            permanent: true,
            direction: 'right',
            offset: [15, 0]
        }).openTooltip();

        // Add a popup with the address details on click
        marker.bindPopup(`
            <b>${location.name}</b><br>
            Our address is here.
        `);
        
        // Add the marker to the cluster group
        markers.addLayer(marker);
    });
    
    // Add the cluster group to the map
    map.addLayer(markers);
}

// Add event listener for Telangana filter button (if present)
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('show-telangana-branches');
    if (btn) {
        btn.addEventListener('click', function() {
            // Filter locations in Telangana
            const filtered = orphanageLocations.filter(loc => isInTelangana(loc.lat, loc.lon));
            addMarkersToMap(filtered);
        });
    }
});