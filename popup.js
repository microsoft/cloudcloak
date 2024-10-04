import { supportedDomains, cloakablePatterns } from "./common.js";

document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        var url = tabs[0]?.url;
        
        // Check if the current domain is supported
        if (url && !supportedDomains.includes((new URL(url)).origin)) {
            // Display a message if the domain is not supported
            document.body.innerHTML = '<p>This extension is not supported on this domain.</p>';
        } else {
            const toggleStates = cloakablePatterns.reduce((state, toggle) => {
                state[toggle.id] = false;
                return state;
            }, {});
            const currentDomain = (new URL(url)).hostname;
            // Inject the currentDomain into the div with class subtitle
            const subtitleDiv = document.querySelector('.subtitle');
            if (subtitleDiv) {
                subtitleDiv.textContent = `${currentDomain}`;
            }

            const createToggle = (toggle) => {
                const container = document.createElement('div');
                container.className = 'switch-container';

                const label = document.createElement('label');
                label.className = 'switch';

                const input = document.createElement('input');
                input.type = 'checkbox';
                input.id = toggle.id;

                const spanSlider = document.createElement('span');
                spanSlider.className = 'slider round';

                const spanLabel = document.createElement('span');
                spanLabel.className = 'label-text';
                spanLabel.textContent = toggle.label;

                label.appendChild(input);
                label.appendChild(spanSlider);
                container.appendChild(label);
                container.appendChild(spanLabel);

                document.body.appendChild(container);
            };

            cloakablePatterns.forEach((toggle) => {
                // Load saved toggle states from storage
                chrome.storage.sync.get().then((stateFromStorage) => {
                    toggleStates[toggle.id] = stateFromStorage[toggle.id];;
                    document.getElementById(toggle.id).checked = toggleStates[toggle.id];
                });
                
                // Create the toggle element
                createToggle(toggle);

                // Add event listener to the toggle
                document.getElementById(toggle.id).addEventListener('change', (event) => {
                    toggleStates[toggle.id] = event.target.checked;
                    chrome.storage.sync.set(toggleStates);  // Save the updated state                
                });
            });
        }
    });
});