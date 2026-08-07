import axios from 'axios';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// OPTIMIZATION: Create an Axios instance to automatically attach the base URL and API Key
const placesClient = axios.create({
    baseURL: 'https://maps.googleapis.com/maps/api/place',
    params: {
        key: GOOGLE_PLACES_API_KEY
    }
});

/**
 * Generate a URL for a Google Places photo
 * @param {string} photoReference - Photo reference from Google Places API
 * @param {number} maxWidth - Maximum width of the image (default 400)
 * @returns {string} - Full photo URL
 */
function getPhotoUrl(photoReference, maxWidth = 400) {
    // Note: We have to pass the key manually here since this generates a raw string URL for the frontend, not an Axios call
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * Search for restaurants near a location using Google Places API
 * @param {number} latitude - Latitude of search center
 * @param {number} longitude - Longitude of search center
 * @param {number} radiusMeters - Search radius in meters (default 1500 = 1.5km)
 * @param {string} keyword - Optional keyword filter (e.g., "sushi", "pizza")
 * @returns {Promise<Array>} - Array of restaurant results
 */
export async function searchNearbyRestaurants(latitude, longitude, radiusMeters = 1500, keyword = 'restaurant') {
    try {
        const response = await placesClient.get('/nearbysearch/json', {
            params: {
                location: `${latitude},${longitude}`,
                radius: radiusMeters,
                type: 'restaurant',
                keyword: keyword,
            }
        });

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            throw new Error(`Google Places API error: ${response.data.status}`);
        }

        return response.data.results.map(place => ({
            api_place_id: place.place_id,
            name: place.name,
            address: place.vicinity,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            // FIX: Use ?? instead of || so a price_level or rating of 0 isn't wiped out
            rating: place.rating ?? null,
            price_level: place.price_level ?? null,
            photo_url: place.photos?.[0]?.photo_reference ?
                getPhotoUrl(place.photos[0].photo_reference) : null,
            is_open: place.opening_hours?.open_now ?? null,
            types: place.types || []
        }));
    } catch (error) {
        console.error('Google Places search error:', error.message);
        throw error;
    }
}

/**
 * Text search for restaurants
 * @param {string} query - Search query (e.g., "sushi in San Francisco")
 * @param {number} latitude - Optional: latitude for location bias
 * @param {number} longitude - Optional: longitude for location bias
 * @returns {Promise<Array>} - Array of search results
 */
export async function textSearchRestaurants(query, latitude = null, longitude = null) {
    try {
        const params = {
            query: query,
            type: 'restaurant'
        };

        if (latitude && longitude) {
            params.location = `${latitude},${longitude}`;
        }

        const response = await placesClient.get('/textsearch/json', { params });

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            throw new Error(`Google Places API error: ${response.data.status}`);
        }

        return response.data.results.map(place => ({
            api_place_id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            rating: place.rating ?? null,
            price_level: place.price_level ?? null,
            photo_url: place.photos?.[0]?.photo_reference ?
                getPhotoUrl(place.photos[0].photo_reference) : null,
            is_open: place.opening_hours?.open_now ?? null,
            types: place.types || [] // FIX: Added types here to match nearbySearch schema
        }));
    } catch (error) {
        console.error('Google Places text search error:', error.message);
        throw error;
    }
}

/**
 * Get detailed information about a specific restaurant
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} - Detailed place information
 */
export async function getRestaurantDetails(placeId) {
    try {
        const response = await placesClient.get('/details/json', {
            params: {
                place_id: placeId,
                fields: 'place_id,name,formatted_address,geometry,rating,price_level,photos,opening_hours,website,formatted_phone_number,reviews'
            }
        });

        if (response.data.status !== 'OK') {
            throw new Error(`Google Places API error: ${response.data.status}`);
        }

        const place = response.data.result;
        return {
            api_place_id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            rating: place.rating ?? null,
            price_level: place.price_level ?? null,
            photo_url: place.photos?.[0]?.photo_reference ?
                getPhotoUrl(place.photos[0].photo_reference) : null,
            website: place.website || null,
            phone: place.formatted_phone_number || null,
            opening_hours: place.opening_hours || null,
            reviews: place.reviews || []
        };
    } catch (error) {
        console.error('Google Places details error:', error.message);
        throw error;
    }
}