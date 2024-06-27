// Function to save favorites to localStorage
export function saveFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Function to get favorites from localStorage
export function getFavoritesFromStorage() {
  const favoritesJSON = localStorage.getItem('favorites');
  return favoritesJSON ? JSON.parse(favoritesJSON) : [];
}

// Function to display notifications for favorite matches
export function displayFavoriteMatchNotifications(favorites, currentMatches) {
  favorites.forEach(favorite => {
    const match = currentMatches.find(match => match.id === favorite.id);
    if (match && isMatchHappeningSoon(match)) {
      showNotification(match);
    }
  });
}

// Function to check if a match is happening soon (within 30 minutes)
function isMatchHappeningSoon(match) {
  const currentTime = new Date();
  const matchStartTime = new Date(match.startTime);
  const differenceInMinutes = (matchStartTime - currentTime) / (1000 * 60);
  return differenceInMinutes > 0 && differenceInMinutes <= 30;
}

// Function to show browser notification
function showNotification(match) {
  if (Notification.permission === "granted") {
    const notification = new Notification(`Reminder: ${match.name}`, {
      body: `Match starts soon (${match.startTime})`,
      icon: "path/to/icon.png" // Path to your notification icon
    });

    notification.onclick = () => {
      // Handle notification click, e.g., open a new tab with match details
      window.open(`match-details.html?id=${match.id}`, "_blank");
    };
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        // Retry showing notification after permission granted
        showNotification(match);
      }
    });
  }
}

// Function to handle favorite match selection
export function handleFavoriteSelection(event, currentMatches) {
  const matchId = event.target.dataset.matchId;
  const favorites = getFavoritesFromStorage();
  const existingFavorite = favorites.find(favorite => favorite.id === matchId);

  if (existingFavorite) {
    // Remove from favorites if already selected
    const updatedFavorites = favorites.filter(favorite => favorite.id !== matchId);
    saveFavorites(updatedFavorites);
    event.target.textContent = 'Add to Favorites';
  } else {
    // Add to favorites if not already selected
    const matchName = event.target.dataset.matchName;
    favorites.push({ id: matchId, name: matchName });
    saveFavorites(favorites);
    event.target.textContent = 'Remove from Favorites';
  }

  // Display notifications for favorites
  displayFavoriteMatchNotifications(favorites, currentMatches);
}

// On the favorites page, display the list of favorite matches
document.addEventListener('DOMContentLoaded', () => {
  const favoritesList = document.getElementById('favorites');
  const favorites = getFavoritesFromStorage();

  if (favorites.length === 0) {
    favoritesList.innerHTML = '<li>No favorite matches added yet.</li>';
  } else {
    favoritesList.innerHTML = favorites.map(favorite => `
      <li>
        <div class="match-info">
          <div>
            <p class="match-name" data-match-id="${favorite.id}" data-match-name="${favorite.name}">${favorite.name}</p>
          </div>
        </div>
        <button class="favorite-button" data-match-id="${favorite.id}" data-match-name="${favorite.name}">Remove from Favorites</button>
      </li>
    `).join('');

    document.querySelectorAll('.favorite-button').forEach(button => {
      button.addEventListener('click', (event) => handleFavoriteSelection(event, favorites));
    });
  }
});
