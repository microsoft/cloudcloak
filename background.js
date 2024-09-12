// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: 'OFF'
  });
});

const extensions = ['https://portal.azure.com', 'https://ms.portal.azure.com', 'https://rc.portal.azure.com', 'https://preview.portal.azure.com'];

chrome.webNavigation.onCompleted.addListener(async (details) => {
  const currentState = await chrome.action.getBadgeText({ tabId: details.tabId });

  if (currentState === 'ON' && details.frameId !== 0) { // This is an iframe
    chrome.scripting.executeScript({
      target: { tabId: details.tabId, frameIds: [details.frameId] },
      files: ['cloak.js']
    });
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
      chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['cloak.js']
      });

    } else if (nextState === 'OFF') {
      // Restore the text
      chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['uncloak.js']
      });
    }
  }
});