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
    const notification = new Notification(`Match Alert: ${match.name}`, {
      body: `Match starts soon at ${new Date(match.startTime).toLocaleTimeString()}`,
      icon: "cricket.svg"
    });

    notification.onclick = () => {
      window.focus();
    };
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        showNotification(match);
      }
    });
  }
}

// Function to handle favorite match selection
export function handleFavoriteSelection(event, currentMatches) {
  const button = event.currentTarget;
  const matchId = button.dataset.matchId;
  const matchName = button.dataset.matchName;
  const favorites = getFavoritesFromStorage();
  const existingFavoriteIndex = favorites.findIndex(favorite => favorite.id === matchId);

  if (existingFavoriteIndex !== -1) {
    // Remove from favorites if already selected
    favorites.splice(existingFavoriteIndex, 1);
    saveFavorites(favorites);
  } else {
    // Add to favorites if not already selected
    favorites.push({ 
      id: matchId, 
      name: matchName,
      dateAdded: new Date().toISOString()
    });
    saveFavorites(favorites);
  }

  // If we have valid match data, check for notifications
  if (Array.isArray(currentMatches) && currentMatches.length > 0) {
    displayFavoriteMatchNotifications(favorites, currentMatches);
  }

  return favorites;
}

// Initialize refresh button functionality
document.addEventListener('DOMContentLoaded', () => {
  const refreshButton = document.getElementById('refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      const button = refreshButton.querySelector('i');
      button.classList.add('fa-spin');
      displayFavorites();
      setTimeout(() => button.classList.remove('fa-spin'), 1000);
    });
  }
  
  // Display favorites initially
  displayFavorites();
});

// Function to display the favorites list
function displayFavorites() {
  const favoritesList = document.querySelector('.favorites');
  const noFavoritesElement = document.getElementById('no-favorites');
  
  if (!favoritesList) {
    console.error('Favorites list element not found!');
    return;
  }

  const favorites = getFavoritesFromStorage();

  if (favorites.length === 0) {
    favoritesList.innerHTML = '';
    if (noFavoritesElement) {
      noFavoritesElement.style.display = 'block';
    }
  } else {
    if (noFavoritesElement) {
      noFavoritesElement.style.display = 'none';
    }
    
    favoritesList.innerHTML = favorites.map(favorite => `
      <li>
        <div class="match-info">
          <div class="match-name" data-match-id="${favorite.id}">${favorite.name}</div>
          <div class="match-score-details">
            <i class="fas fa-clock"></i> Added on ${new Date(favorite.dateAdded || Date.now()).toLocaleDateString()}
          </div>
        </div>
        <div class="match-actions">
          <button class="favorite-button active" 
                  data-match-id="${favorite.id}" 
                  data-match-name="${favorite.name}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </li>
    `).join('');

    document.querySelectorAll('.favorite-button').forEach(button => {
      button.addEventListener('click', (event) => {
        const li = event.currentTarget.closest('li');
        handleFavoriteSelection(event, []);
        
        // Animate removal
        li.style.opacity = '0';
        li.style.height = '0';
        li.style.marginTop = '0';
        li.style.marginBottom = '0';
        li.style.paddingTop = '0';
        li.style.paddingBottom = '0';
        
        // Remove element after animation
        setTimeout(() => {
          li.remove();
          // Check if we need to show "no favorites" message
          if (document.querySelectorAll('.favorites li').length === 0) {
            if (noFavoritesElement) {
              noFavoritesElement.style.display = 'block';
            }
          }
        }, 300);
      });
    });
  }
}

