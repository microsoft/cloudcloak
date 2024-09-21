const extensions = [
  'https://portal.azure.com',
  'https://ms.portal.azure.com',
  'https://rc.portal.azure.com',
  'https://preview.portal.azure.com',
  'https://entra.microsoft.com',
  'https://intune.microsoft.com',
  'https://ai.azure.com',
  'https://admin.microsoft.com',
  'https://sip.security.microsoft.com',
  'https://purview.microsoft.com',
  'https://make.powerapps.com',
  'https://make.preview.powerapps.com',
  'https://msazure.visualstudio.com',
  'https://github.com',
  'https://copilotstudio.microsoft.com',
  'https://copilotstudio.preview.microsoft.com'
];

const currentState = { enabled: false };

async function loadScriptAndStartCloaking(tabId, frameIds, allFrames) {
  await chrome.scripting.executeScript({
    target: { tabId, allFrames, frameIds },
    files: ['cloak.js']
  });
  await chrome.scripting.executeScript({
    target: { tabId, allFrames, frameIds },
    function: () => { cloakTextAndStartObserving(); },
  });
}

function updateBadgeAndExecute(tabId) {
  // Set the badge text, color and tooltip
  chrome.action.setBadgeText({
    tabId: tabId,
    text: currentState.enabled ? "ON" : "OFF"
  });

  chrome.action.setBadgeBackgroundColor({
    tabId: tabId,
    color: currentState.enabled ? "#00FF00" : "#FF0000"
  });

  chrome.action.setTitle({
    tabId: tabId,
    title: "Cloud Cloak (Available on this page)"
  });

  // If enabled is true, blur the text. Otherwise, unblur it
  if (currentState.enabled) {
    // Blur the text
    loadScriptAndStartCloaking(tabId, null, true);
  } else {
    chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      function: () => { unCloakTextAndStopObserving(); },
    });
  }
}

function eventHandler(tabUrl, tabId) {
  if (!tabUrl || !extensions.some((url) => tabUrl.startsWith(url))) {
    chrome.action.setBadgeText({
      tabId: tabId,
      text: ""
    });

    chrome.action.setTitle({
      tabId: tabId,
      title: "Cloud Cloak (Unsupported on this page)"
    });
  } else {
    updateBadgeAndExecute(tabId);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { eventHandler(tab.url, tabId); });

chrome.tabs.onActivated.addListener(() => {
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    eventHandler(tabs[0].url, tabs[0].id);
  });
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  const currentState = await chrome.action.getBadgeText({ tabId: details.tabId });

  if (currentState === 'ON' && details.frameId !== 0) { // This is an iframe
    loadScriptAndStartCloaking(details.tabId, [details.frameId], false);
  }
}, { url: [{ urlMatches: 'https://*/*' }] });  // Matches all https URLs

// When the user clicks on the extension action
chrome.action.onClicked.addListener(async (tab) => {
  if (extensions.some((url) => tab.url.startsWith(url))) {
    currentState.enabled = !currentState.enabled;
    updateBadgeAndExecute(tab.id);
  }
});
