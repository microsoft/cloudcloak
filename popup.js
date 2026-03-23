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

            const groupedToggles = cloakablePatterns.reduce((groups, toggle) => {
                const category = toggle.category || 'General';
                if (!groups[category]) {
                    groups[category] = [];
                }

                groups[category].push(toggle);
                return groups;
            }, {});

            const syncMasterToggleState = () => {
                const masterToggle = document.getElementById('toggle-all');
                if (!masterToggle) {
                    return;
                }

                const values = cloakablePatterns.map((toggle) => !!toggleStates[toggle.id]);
                const allEnabled = values.length > 0 && values.every(Boolean);
                const anyEnabled = values.some(Boolean);

                masterToggle.checked = allEnabled;
                masterToggle.indeterminate = anyEnabled && !allEnabled;
            };

            const persistToggleStates = () => {
                chrome.storage.sync.set(toggleStates).then(() => {
                    syncMasterToggleState();
                });
            };

            const currentDomain = (new URL(url)).hostname;
            // Inject the currentDomain into the div with class subtitle
            const subtitleDiv = document.querySelector('.subtitle');
            if (subtitleDiv) {
                subtitleDiv.textContent = `${currentDomain}`;
            }

            const createCategoryHeader = (label) => {
                const header = document.createElement('div');
                header.className = 'category-header';
                header.textContent = label;
                document.body.appendChild(header);
            };

            const createToggle = (toggle, options = {}) => {
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

                if (options.insertBeforeTitle) {
                    document.body.insertBefore(container, document.body.children[1] || null);
                } else {
                    document.body.appendChild(container);
                }

                return input;
            };

            const masterToggle = createToggle({ id: 'toggle-all', label: 'Toggle All' }, { insertBeforeTitle: true });
            masterToggle.addEventListener('change', (event) => {
                const checked = event.target.checked;
                cloakablePatterns.forEach((toggle) => {
                    toggleStates[toggle.id] = checked;
                    const checkbox = document.getElementById(toggle.id);
                    if (checkbox) {
                        checkbox.checked = checked;
                    }
                });

                persistToggleStates();
            });

            Object.entries(groupedToggles).forEach(([category, toggles]) => {
                createCategoryHeader(category);
                toggles.forEach((toggle) => {
                    createToggle(toggle);
                });
            });

            chrome.storage.sync.get().then((stateFromStorage) => {
                cloakablePatterns.forEach((toggle) => {
                    toggleStates[toggle.id] = stateFromStorage[toggle.id] ?? false;
                    const checkbox = document.getElementById(toggle.id);
                    if (checkbox) {
                        checkbox.checked = toggleStates[toggle.id];
                    }
                    checkbox?.addEventListener('change', (event) => {
                        toggleStates[toggle.id] = event.target.checked;
                        persistToggleStates();
                    });
                });

                syncMasterToggleState();
            });
        }
    });
});