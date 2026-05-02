// background.js

// Listen for History API changes to detect Single Page Application (SPA) navigations on YouTube
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.url.includes("youtube.com")) {
    // Send a message to the content script about the URL change
    chrome.tabs.sendMessage(details.tabId, {
      type: "URL_CHANGED",
      url: details.url
    }).catch(err => {
      // Content script might not be loaded yet, which is fine as it checks the URL on load anyway
      console.log("Tab not ready for message yet:", err);
    });
  }
}, { url: [{ hostContains: 'youtube.com' }] });

// Also listen for completed navigations
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.url.includes("youtube.com")) {
    chrome.tabs.sendMessage(details.tabId, {
      type: "URL_CHANGED",
      url: details.url
    }).catch(err => {
      console.log("Tab not ready for message yet:", err);
    });
  }
}, { url: [{ hostContains: 'youtube.com' }] });
