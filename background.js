const extensions = [
  'https://portal.azure.com',
  'https://ms.portal.azure.com',
  'https://rc.portal.azure.com',
  'https://preview.portal.azure.com',
  'https://entra.microsoft.com',
  'https://intune.microsoft.com',
  'https://intuneeducation.portal.azure.com',
  'https://ai.azure.com',
  'https://admin.microsoft.com',
  'https://sip.security.microsoft.com',
  'https://purview.microsoft.com',
  'https://make.powerapps.com',
  'https://make.preview.powerapps.com',
  'https://msazure.visualstudio.com',
  'https://github.com',
  'https://copilotstudio.microsoft.com',
  'https://copilotstudio.preview.microsoft.com',
  'https://portal.azure.us',
  'https://aad.portal.azure.com'
];

const currentState = { enabled: false };

async function injectScripts(tabId, frameIds, allFrames) {
  await chrome.scripting.executeScript({
    target: { tabId, allFrames, frameIds },
    files: ['cloak.js']
  });
}

async function injectScriptsAndUpdateBadge(tabId) {
  // If enabled is true, blur the text. Otherwise, unblur it
  await injectScripts(tabId, null, true, currentState.enabled);

  // Set the badge text, color and tooltip
  await chrome.action.setBadgeText({
    tabId: tabId,
    text: currentState.enabled ? "ON" : "OFF"
  });

  await chrome.action.setBadgeBackgroundColor({
    tabId: tabId,
    color: currentState.enabled ? "#00FF00" : "#FF0000"
  });

  await chrome.action.setTitle({
    tabId: tabId,
    title: "Cloud Cloak (Available on this page)"
  });
}

async function tabsEventHandler(tabUrl, tabId) {
  if (tabUrl && extensions.some((url) => tabUrl.startsWith(url))) {
    await injectScriptsAndUpdateBadge(tabId);
  } else {
    await chrome.action.setBadgeText({
      tabId: tabId,
      text: ""
    });

    await chrome.action.setTitle({
      tabId: tabId,
      title: "Cloud Cloak (Unsupported on this page)"
    });
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => { await tabsEventHandler(tab.url, tabId); });

chrome.tabs.onActivated.addListener(() => {
  chrome.tabs.query({ currentWindow: true, active: true }, async (tabs) => {
    await tabsEventHandler(tabs[0].url, tabs[0].id);
  });
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (currentState.enabled && details.frameId !== 0) { // This is an iframe
    await injectScripts(details.tabId, [details.frameId], false);
  }
}, { url: [{ urlMatches: 'https://*/*' }] });  // Matches all https URLs

// When the user clicks on the extension action, update the state and inject the scripts
chrome.action.onClicked.addListener(async (tab) => {
  if (extensions.some((url) => tab.url.startsWith(url))) {
    currentState.enabled = !currentState.enabled;
    await injectScriptsAndUpdateBadge(tab.id);
    await chrome.storage.sync.set(currentState);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  var stateFromStorage = await chrome.storage.sync.get();
  Object.assign(currentState, stateFromStorage);

  chrome.tabs.query({ currentWindow: true, active: true }, async (tabs) => {
    await tabsEventHandler(tabs[0].url, tabs[0].id);
  });
});

