import { supportedDomains, cloakablePatterns } from "./common.js";

// Get the current state of the extension from storage and update the badge
function getCurrentStateFromStorageAndUpdateBadge() {
  // Check the current state of the extension and cloak the text accordingly
  chrome.storage.sync.get().then(async (currentState) => {
    chrome.tabs.query({ currentWindow: true, active: true }, async (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const tabId = tabs[0].id;
        const enabled = Object.values(currentState).some((value) => !!value);
        // Set the badge text, color and tooltip
        await chrome.action.setBadgeText({
          tabId: tabId,
          text: enabled ? "ON" : "OFF"
        });

        await chrome.action.setBadgeBackgroundColor({
          tabId: tabId,
          color: enabled ? "#00FF00" : "#FF0000"
        });
      }
    });
  });
}

// Inject the cloak script into the current tab/iframes
async function injectScripts(tabId, frameIds, allFrames) {
  allFrames = false;
  await chrome.scripting.executeScript({
    target: { tabId, allFrames, frameIds },
    files: ['cloak.js']
  });
}

// This event is triggered when navigation occurs, which can include loading iframes
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) { // This is an iframe
    await injectScripts(details.tabId, [details.frameId], false);
  }
}, { url: [{ urlMatches: 'https://*/*' }] });

// Function to handle tab events
async function tabsEventHandler() {
  chrome.tabs.query({ currentWindow: true, active: true }, async (tabs) => {
      const tabUrl = tabs[0]?.url;
      const tabId = tabs[0]?.id;
      if (tabUrl && supportedDomains.some((url) => tabUrl.startsWith(url))) {
        await injectScripts(tabId, null, true);
        getCurrentStateFromStorageAndUpdateBadge();
      }
    
  });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async () => { await tabsEventHandler(); });

// Listen for tab switching
chrome.tabs.onActivated.addListener(async () => { await tabsEventHandler(); });

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async () => { await tabsEventHandler(); });

// Listen for changes to the extension state that is persisted in storage
chrome.storage.onChanged.addListener(async () => { getCurrentStateFromStorageAndUpdateBadge(); });