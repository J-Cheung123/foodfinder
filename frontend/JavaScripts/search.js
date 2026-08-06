const API_BASE_URL = 'http://localhost:5000';

let currentLocation = null;
let searchResults = [];

const searchInput = document.getElementById('search-input');
const radiusInput = document.getElementById('radius-input');
const searchBtn = document.getElementById('search-btn');
const useLocationBtn = document.getElementById('use-location-btn');
const resultsContainer = document.getElementById('results-container');
const statusMessage = document.getElementById('status-message');
const loadingDiv = document.getElementById('loading');

function showMessage(text, type = 'info') {
    statusMessage.textContent = text;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = text ? 'block' : 'none';
}

function showLoading(isLoading) {
    loadingDiv.style.display = isLoading ? 'block' : 'none';
}

function getPriceLevel(level) {
    if (!level) return 'N/A';
    return '$'.repeat(level) || 'N/A';
}

function formatAddress(address) {
    if (!address) return 'Address not available';
    return address.length > 80 ? address.substring(0, 80) + '...' : address;
}

function renderRestaurantCard(restaurant) {
    const isSaved = searchResults.find(r => r.api_place_id === restaurant.api_place_id)?.saved || false;
    
    return `
        <div class="restaurant-card">
            <div class="restaurant-image">
                ${restaurant.photo_url 
                    ? `<img src="${restaurant.photo_url}" alt="${restaurant.name}" onerror="this.parentElement.innerHTML='<div class=\'no-image\'>No image available</div>'"/>` 
                    : `<div class="no-image">📷 No photo available</div>`
                }
            </div>
            <div class="restaurant-info">
                <div class="restaurant-name">${restaurant.name}</div>
                
                <div class="restaurant-meta">
                    ${restaurant.rating ? `
                        <div class="rating">
                            <span class="stars">★</span>
                            <span>${restaurant.rating.toFixed(1)}</span>
                        </div>
                    ` : ''}
                    ${restaurant.price_level ? `
                        <div class="price-level">${getPriceLevel(restaurant.price_level)}</div>
                    ` : ''}
                </div>

                ${restaurant.is_open !== null ? `
                    <div class="is-open ${restaurant.is_open ? 'open' : 'closed'}">
                        ${restaurant.is_open ? '✓ Open Now' : '✗ Closed'}
                    </div>
                ` : ''}

                <div class="restaurant-address">${formatAddress(restaurant.address)}</div>

                <div class="action-buttons">
                    <button class="btn-save ${isSaved ? 'saved' : ''}" 
                            onclick="saveRestaurant('${restaurant.api_place_id.replace(/'/g, "\\'")}')"
                            ${isSaved ? 'disabled' : ''}>
                        ${isSaved ? '✓ Saved' : '+ Save'}
                    </button>
                    <button class="btn-details" 
                            onclick="viewDetails('${restaurant.api_place_id.replace(/'/g, "\\'")}')">Details</button>
                </div>
            </div>
        </div>
    `;
}

function renderResults(results) {
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1;">
                <h3>No restaurants found</h3>
                <p>Try adjusting your search criteria or location</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = results.map(restaurant => renderRestaurantCard(restaurant)).join('');
}

// Geolocation
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showMessage('Geolocation is not supported by your browser', 'error');
        return;
    }

    showMessage('Getting your location...', 'info');
    useLocationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            showMessage(`📍 Location: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`, 'success');
            useLocationBtn.disabled = false;
        },
        (error) => {
            showMessage(`Location error: ${error.message}`, 'error');
            useLocationBtn.disabled = false;
        }
    );
}

// Search Handlers
async function searchNearby() {
    const query = searchInput.value.trim();
    const radius = radiusInput.value;

    if (!currentLocation) {
        showMessage('Please enable location first', 'error');
        return;
    }

    if (!query) {
        showMessage('Please enter a search term', 'error');
        return;
    }

    showLoading(true);
    showMessage('Searching...', 'loading');

    try {
        const url = new URL(`${API_BASE_URL}/api/restaurants/search/nearby`);
        url.searchParams.append('latitude', currentLocation.latitude);
        url.searchParams.append('longitude', currentLocation.longitude);
        url.searchParams.append('radius', radius);
        url.searchParams.append('keyword', query);

        const response = await fetch(url.toString(), {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const results = await response.json();
        searchResults = results;
        renderResults(results);
        showMessage(`Found ${results.length} restaurants`, 'success');
    } catch (error) {
        console.error('Search error:', error);
        showMessage(`Search failed: ${error.message}`, 'error');
        renderResults([]);
    } finally {
        showLoading(false);
    }
}

async function searchByName() {
    const query = searchInput.value.trim();

    if (!query) {
        showMessage('Please enter a search term', 'error');
        return;
    }

    showLoading(true);
    showMessage('Searching...', 'loading');

    try {
        const url = new URL(`${API_BASE_URL}/api/restaurants/search/text`);
        url.searchParams.append('query', query);
        
        if (currentLocation) {
            url.searchParams.append('latitude', currentLocation.latitude);
            url.searchParams.append('longitude', currentLocation.longitude);
        }

        const response = await fetch(url.toString(), {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const results = await response.json();
        searchResults = results;
        renderResults(results);
        showMessage(`Found ${results.length} restaurants`, 'success');
    } catch (error) {
        console.error('Search error:', error);
        showMessage(`Search failed: ${error.message}`, 'error');
        renderResults([]);
    } finally {
        showLoading(false);
    }
}

// Save Restaurant
window.saveRestaurant = async (placeId) => {
    const restaurant = searchResults.find(r => r.api_place_id === placeId);
    if (!restaurant) {
        showMessage('Restaurant not found', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/restaurants/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_place_id: restaurant.api_place_id,
                name: restaurant.name,
                address: restaurant.address,
                latitude: restaurant.latitude,
                longitude: restaurant.longitude,
                rating: restaurant.rating,
                price_level: restaurant.price_level,
                photo_url: restaurant.photo_url
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Save failed: ${response.status}`);
        }

        // Mark as saved in state
        restaurant.saved = true;
        renderResults(searchResults);
        showMessage(`✓ ${restaurant.name} saved!`, 'success');
    } catch (error) {
        console.error('Save error:', error);
        showMessage(`Failed to save restaurant: ${error.message}`, 'error');
    }
};

// View Details
window.viewDetails = async (placeId) => {
    // Placeholder for future details modal/page
    showMessage('Details page coming soon!', 'info');
};

// Event Listeners
searchBtn.addEventListener('click', () => {
    // If location is available, do nearby search, otherwise do text search
    if (currentLocation) {
        searchNearby();
    } else {
        searchByName();
    }
});

useLocationBtn.addEventListener('click', getCurrentLocation);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showMessage('Ready to search. Enter a search term and click Search or use your location for nearby restaurants.', 'info');
});
