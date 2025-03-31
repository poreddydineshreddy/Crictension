// Background service worker for Crictension

// Function to fetch match data
async function fetchMatchData() {
  try {
    const response = await fetch("https://api.cricapi.com/v1/currentMatches?apikey=78d29145-c822-431c-8634-28a0e9c4fd14&offset=0");
    const data = await response.json();
    
    if (data.status !== "success" || !data.data) {
      return [];
    }
    
    return data.data.map(match => ({
      id: match.id || match.unique_id,
      name: match.name || "Unknown match",
      status: match.status || "No status available",
      startTime: match.dateTimeGMT || match.start_time,
      venue: match.venue || "Unknown venue"
    }));
  } catch (error) {
    console.error("Error fetching match data in background:", error);
    return [];
  }
}

// Function to get favorites from storage
async function getFavorites() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['favorites'], (result) => {
      resolve(result.favorites || []);
    });
  });
}

// Function to check if a match is starting soon (within 30 minutes)
function isMatchStartingSoon(match) {
  const currentTime = new Date();
  const matchStartTime = new Date(match.startTime);
  const differenceInMinutes = (matchStartTime - currentTime) / (1000 * 60);
  return differenceInMinutes > 0 && differenceInMinutes <= 30;
}

// Function to show notifications for favorite matches
async function checkFavoriteMatches() {
  const matches = await fetchMatchData();
  const favorites = await getFavorites();
  
  if (!matches.length || !favorites.length) {
    return;
  }
  
  // Check each favorite match
  for (const favorite of favorites) {
    const match = matches.find(m => m.id === favorite.id);
    
    if (match && isMatchStartingSoon(match)) {
      // Show notification
      chrome.notifications.create(`match-${match.id}`, {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Cricket Match Alert",
        message: `${match.name} is starting soon at ${new Date(match.startTime).toLocaleTimeString()}`,
        priority: 2
      });
    }
  }
}

// Check for matches every 15 minutes
setInterval(checkFavoriteMatches, 15 * 60 * 1000);

// Run on initial load
checkFavoriteMatches();

// Listen for storage changes to sync with popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.favorites) {
    checkFavoriteMatches();
  }
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check-matches') {
    checkFavoriteMatches();
  }
});

// Set up a daily alarm
chrome.alarms.create('check-matches', { periodInMinutes: 60 }); 