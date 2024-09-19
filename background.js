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

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: 'OFF'
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
        // We retrieve the action badge to check if the extension is 'ON' or 'OFF'
        const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
        // Next state will always be the opposite
        const nextState = prevState === 'ON' ? 'OFF' : 'ON';

        // Set the action badge to the next state
        await chrome.action.setBadgeText({
            tabId: tab.id,
            text: nextState
        });

        if (nextState === 'ON') {
            // Blur the text
            loadScriptAndStartCloaking(tab.id, null, true);
        } else if (nextState === 'OFF') {
            chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                function: () => { unCloakTextAndStopObserving(); },
            });
        }
    }
});
