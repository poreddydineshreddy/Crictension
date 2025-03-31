import { getFavoritesFromStorage, handleFavoriteSelection, displayFavoriteMatchNotifications } from './favorites.js';

// Initialize the refresh button functionality
document.addEventListener('DOMContentLoaded', () => {
  const refreshButton = document.getElementById('refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      const button = refreshButton.querySelector('i');
      button.classList.add('fa-spin');
      getMatchData().then(() => {
        setTimeout(() => button.classList.remove('fa-spin'), 1000);
      });
    });
  }
});

async function getMatchData() {
  const statusElement = document.getElementById("status");
  const matchesElement = document.getElementById("matches");

  // Show loading state
  statusElement.classList.add("loading");
  statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading matches...';

  try {
    // Load favorites first
    const favorites = await getFavoritesFromStorage();
    
    // Fetch match data
    const response = await fetch("https://api.cricapi.com/v1/currentMatches?apikey=78d29145-c822-431c-8634-28a0e9c4fd14&offset=0");
    const data = await response.json();

    if (data.status !== "success") {
      throw new Error("Failed to fetch match data");
    }

    const matchesList = data.data;
    if (!matchesList || matchesList.length === 0) {
      statusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> No matches found';
      matchesElement.innerHTML = '';
      return [];
    }

    const relevantData = matchesList.map(match => {
      const matchId = match.id || match.unique_id;
      const matchName = match.name || "Unknown";
      const matchStatus = match.status || "No status available";
      const matchScore = match.score ? match.score.map(score => 
        `${score.inning}: ${score.r}/${score.w} (${score.o} overs)`).join("<br>") : "No score available";
      return { 
        id: matchId, 
        name: matchName, 
        status: matchStatus, 
        score: matchScore, 
        startTime: match.dateTimeGMT || match.start_time,
        teams: match.teams || [],
        venue: match.venue || "Unknown venue",
        isFavorite: favorites.some(fav => fav.id === matchId)
      };
    });

    matchesElement.innerHTML = relevantData.map(match => {
      const statusClass = match.status.toLowerCase().includes('live') ? 'live' : 
                         match.status.toLowerCase().includes('upcoming') ? 'upcoming' : '';
      const favoriteIcon = match.isFavorite ? 
                         '<i class="fas fa-star"></i>' : 
                         '<i class="far fa-star"></i>';
      
      return `
      <li>
        <div class="match-info">
          <div class="match-name" data-match-id="${match.id}">${match.name}</div>
          <div class="match-status ${statusClass}">
            ${statusClass === 'live' ? '<i class="fas fa-circle pulse"></i>' : 
              statusClass === 'upcoming' ? '<i class="far fa-clock"></i>' : 
              '<i class="fas fa-flag-checkered"></i>'}
            ${match.status}
          </div>
          <div class="match-score">${match.score}</div>
          <div class="match-score-details">
            <i class="fas fa-map-marker-alt"></i> ${match.venue}
          </div>
        </div>
        <div class="match-actions">
          <a href="#" class="view-details" data-match-id="${match.id}">
            <i class="fas fa-info-circle"></i> Details
          </a>
          <button class="favorite-button ${match.isFavorite ? 'active' : ''}" 
                  data-match-id="${match.id}" 
                  data-match-name="${match.name}">
            ${favoriteIcon}
          </button>
        </div>
      </li>
    `}).join('');
    
    statusElement.innerHTML = "";
    statusElement.classList.remove("loading");

    // Add event listeners for favorite selection
    document.querySelectorAll('.favorite-button').forEach(button => {
      button.addEventListener('click', async (event) => {
        const target = event.currentTarget;
        await handleFavoriteSelection(event, relevantData);
        
        // Update the star icon
        const starIcon = target.querySelector('i');
        if (starIcon.classList.contains('far')) {
          starIcon.classList.remove('far');
          starIcon.classList.add('fas');
          target.classList.add('active');
        } else {
          starIcon.classList.remove('fas');
          starIcon.classList.add('far');
          target.classList.remove('active');
        }
      });
    });

    // Add event listeners for match details
    document.querySelectorAll('.view-details').forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const matchId = event.currentTarget.dataset.matchId;
        const match = relevantData.find(m => m.id === matchId);
        
        if (match) {
          alert(`Match Details:\n${match.name}\nStatus: ${match.status}\nVenue: ${match.venue}\nStart time: ${new Date(match.startTime).toLocaleString()}`);
          // In a real app, you might want to navigate to a detailed view or open a modal
        }
      });
    });

    return relevantData;
  } catch (error) {
    console.error("Error fetching match data:", error);
    statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error fetching match data';
    statusElement.classList.add("error");
    return [];
  }
}

// Initial load
getMatchData();

// Request notification permission on page load
if (Notification.permission !== "granted" && Notification.permission !== "denied") {
  Notification.requestPermission();
}

// Check for updates every 60 seconds
setInterval(getMatchData, 60000);

