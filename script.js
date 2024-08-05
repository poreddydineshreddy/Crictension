import { getFavoritesFromStorage, handleFavoriteSelection, displayFavoriteMatchNotifications } from './favorites.js';

async function getMatchData() {
  const statusElement = document.getElementById("status");
  const matchesElement = document.getElementById("matches");

  try {
    const response = await fetch("https://api.cricapi.com/v1/currentMatches?apikey=78d29145-c822-431c-8634-28a0e9c4fd14&offset=0");
    const data = await response.json();

    if (data.status !== "success") {
      throw new Error("Failed to fetch match data");
    }

    const matchesList = data.data;
    if (!matchesList) {
      throw new Error("No matches found");
    }

    const relevantData = matchesList.map(match => {
      const matchId = match.unique_id;
      const matchName = match.name || "Unknown";
      const matchStatus = match.status || "No status available";
      const matchScore = match.score ? match.score.map(score => `(${score.r}/${score.w}, ${score.o} overs, ${score.inning})`).join(" - ") : "No score available";
      return { id: matchId, name: matchName, status: matchStatus, score: matchScore, startTime: match.start_time };
    });

    matchesElement.innerHTML = relevantData.map(match => `
      <li>
        <div class="match-info">
          <div>
            <p class="match-name" data-match-id="${match.id}" data-match-name="${match.name}">${match.name}</p>
            <p class="match-status">${match.status}</p>
          </div>
          <div>
            <p class="match-score">${match.score}</p>
          </div>
        </div>
        <button class="favorite-button" data-match-id="${match.id}" data-match-name="${match.name}">Add to Favorites</button>
      </li>
    `).join('');
    statusElement.textContent = ""; 

    // Add event listeners for favorite selection
    document.querySelectorAll('.favorite-button').forEach(button => {
      button.addEventListener('click', (event) => handleFavoriteSelection(event, relevantData));
    });

  } catch (error) {
    console.error("Error fetching match data:", error);
    statusElement.textContent = "Error fetching match data";
    statusElement.classList.add("error");
  }
}

getMatchData();

// Request notification permission on page load
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Initial check for favorites and notifications
const initialFavorites = getFavoritesFromStorage();
getMatchData().then(relevantData => {
  displayFavoriteMatchNotifications(initialFavorites, relevantData);
});
