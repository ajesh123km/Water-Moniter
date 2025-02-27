let map;
let markers = [];

document.addEventListener("DOMContentLoaded", async () => {
    const stateSelect = document.getElementById("state");
    const riverSelect = document.getElementById("river");
    const dataTable = document.getElementById("data-table");

    // Fetch JSON data from file
    const response = await fetch("Water_data.json");
    const jsonData = await response.json();
    const stations = jsonData.WaterBodiesData;

    // Extract unique states
    const states = new Set();
    for (const station in stations) {
        states.add(stations[station].state);
    }

    // Populate state dropdown
    states.forEach(state => {
        const option = document.createElement("option");
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });

    // When a state is selected, update river dropdown
    stateSelect.addEventListener("change", () => {
        riverSelect.innerHTML = `<option value="">--Select River--</option>`;
        riverSelect.disabled = true;

        const selectedState = stateSelect.value;
        if (!selectedState) return;

        const rivers = new Set();
        for (const station in stations) {
            if (stations[station].state === selectedState) {
                rivers.add(stations[station].river_name);
            }
        }

        rivers.forEach(river => {
            const option = document.createElement("option");
            option.value = river;
            option.textContent = river;
            riverSelect.appendChild(option);
        });

        riverSelect.disabled = false;
        updateTable();
        updateMap();
    });

    // When both state and river are selected, display data
    riverSelect.addEventListener("change", () => {
        updateTable();
        updateMap();
    });

    function updateTable() {
        dataTable.innerHTML = "";

        const selectedState = stateSelect.value;
        const selectedRiver = riverSelect.value;

        let foundData = false;

        for (const station in stations) {
            const data = stations[station];
            if (
                data.state === selectedState &&
                (!selectedRiver || data.river_name === selectedRiver)
            ) {
                const readings = Object.values(data.readings)[0]; // Get first reading
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${data.station_name}</td>
                    <td>${data.river_name}</td>
                    <td>${readings.tds}</td>
                    <td>${readings.pH}</td>
                    <td>${readings.dissolved_oxygen}</td>
                    <td>${readings.bod}</td>
                    <td>${readings.fecal_coliform}</td>
                    <td>${readings.total_coliform}</td>
                `;
                dataTable.appendChild(row);
                foundData = true;
            }
        }

        if (!foundData) {
            dataTable.innerHTML = `<tr><td colspan="8">No data available for selected criteria.</td></tr>`;
        }
    }

    function updateMap() {
        const selectedState = stateSelect.value;
        const selectedRiver = riverSelect.value;

        // Clear existing markers
        markers.forEach(marker => marker.setMap(null));
        markers = [];

        for (const station in stations) {
            const data = stations[station];
            if (
                data.state === selectedState &&
                (!selectedRiver || data.river_name === selectedRiver)
            ) {
                const readings = Object.values(data.readings)[0]; // Get first reading
                
                const marker = new google.maps.Marker({
                    position: { lat: data.lat, lng: data.lon },
                    map,
                    title: data.station_name
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <h3>${data.station_name}</h3>
                        <p><strong>River:</strong> ${data.river_name}</p>
                        <p><strong>TDS:</strong> ${readings.tds}</p>
                        <p><strong>pH:</strong> ${readings.pH}</p>
                        <p><strong>Dissolved Oxygen:</strong> ${readings.dissolved_oxygen}</p>
                        <p><strong>BOD:</strong> ${readings.bod}</p>
                    `
                });

                marker.addListener("click", () => {
                    infoWindow.open(map, marker);
                });

                markers.push(marker);
            }
        }
    }
});

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 25.0, lng: 83.0 }, // Approximate central point of rivers
        zoom: 6
    });
}
