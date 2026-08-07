// Change this manually to 'https://api.yourdomain.com' only when deploying to the cloud.
const API_BASE_URL = 'http://localhost:5000';


document.addEventListener('DOMContentLoaded', async () => {

    // 1. Verify Authentication & Load Profile
    async function loadProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: 'GET',
                credentials: 'include' // Attaches the HttpOnly cookie
            });

            if (!response.ok) {
                // If the HttpOnly cookie is missing or invalid, redirect to login via replace
                window.location.replace('/login.html');
                return;
            }

            const user = await response.json();
            document.getElementById('display-username').textContent = `@${user.username}`;
            document.getElementById('display-email').textContent = user.email;
        } catch (error) {
            console.error('Failed to load profile', error);
        }
    }

    // 2. Load Saved Restaurants
    async function loadSavedRestaurants() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/profile/saved-restaurants`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const saved = await response.json();
                const list = document.getElementById('saved-list');

                if (saved.length === 0) {
                    list.innerHTML = '<li>No saved restaurants yet.</li>';
                    return;
                }

                list.innerHTML = saved.map(item => `
                    <li>
                        <strong>${item.restaurant.name}</strong> 
                        <button onclick="removeRestaurant(${item.restaurant_id})">Remove</button>
                    </li>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load saved restaurants', error);
        }
    }

    // 3. Load Lobbies
    async function loadLobbies() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/profile/lobbies`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const memberships = await response.json();
                const list = document.getElementById('lobby-list');

                if (memberships.length === 0) {
                    list.innerHTML = '<li>You have not joined any lobbies.</li>';
                    return;
                }

                list.innerHTML = memberships.map(m => `
                    <li>Lobby: ${m.lobby.name || 'Untitled Lobby'} - Status: ${m.lobby.status}</li>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load lobbies', error);
        }
    }

    // 4. Handle Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await fetch(`${API_BASE_URL}/api/users/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            window.location.replace('/login.html');
        } catch (error) {
            console.error('Logout failed', error);
        }
    });

    // Initialize the dashboard
    await loadProfile();
    await loadSavedRestaurants();
    await loadLobbies();
});

// Global function for the remove button to access
window.removeRestaurant = async (restaurantId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/profile/saved-restaurants/${restaurantId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            // Reload the list to show the update
            location.reload();
        }
    } catch (error) {
        console.error('Failed to remove restaurant', error);
    }
};