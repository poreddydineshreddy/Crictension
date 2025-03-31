// Function to save favorites to Chrome storage
export function saveFavorites(favorites) {
  // Store in localStorage for compatibility
  localStorage.setItem('favorites', JSON.stringify(favorites));
  
  // Store in Chrome storage for background access
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ favorites });
  }
}

// Function to get favorites from storage
export function getFavoritesFromStorage() {
  // First try Chrome storage, fall back to localStorage
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['favorites'], (result) => {
        if (result.favorites) {
          resolve(result.favorites);
        } else {
          // Fall back to localStorage
          const favoritesJSON = localStorage.getItem('favorites');
          const favorites = favoritesJSON ? JSON.parse(favoritesJSON) : [];
          // Also save to Chrome storage for next time
          if (favorites.length > 0) {
            chrome.storage.local.set({ favorites });
          }
          resolve(favorites);
        }
      });
    } else {
      // No Chrome storage available, use localStorage
      const favoritesJSON = localStorage.getItem('favorites');
      resolve(favoritesJSON ? JSON.parse(favoritesJSON) : []);
    }
  });
}

// Synchronous version for internal use
function getFavoritesSync() {
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
  if (typeof chrome !== 'undefined' && chrome.notifications) {
    // Use Chrome notifications API
    chrome.notifications.create(`match-${match.id}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Cricket Match Alert",
      message: `${match.name} starts soon at ${new Date(match.startTime).toLocaleTimeString()}`,
      priority: 2
    });
  } else if (Notification.permission === "granted") {
    // Fall back to browser notifications
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
export async function handleFavoriteSelection(event, currentMatches) {
  const button = event.currentTarget;
  const matchId = button.dataset.matchId;
  const matchName = button.dataset.matchName;
  
  // Get existing favorites
  const favoritesPromise = getFavoritesFromStorage();
  const favorites = await favoritesPromise;
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
async function displayFavorites() {
  const favoritesList = document.querySelector('.favorites');
  const noFavoritesElement = document.getElementById('no-favorites');
  
  if (!favoritesList) {
    console.error('Favorites list element not found!');
    return;
  }

  const favorites = await getFavoritesFromStorage();

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
      button.addEventListener('click', async (event) => {
        const li = event.currentTarget.closest('li');
        await handleFavoriteSelection(event, []);
        
        // Animate removal
        li.style.transition = 'all 0.3s ease';
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

