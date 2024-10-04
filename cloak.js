(async () => {
    const src = chrome.runtime.getURL("./common.js");
    import(src).then((commonModule) => {
        cloakablePatterns = commonModule.cloakablePatterns;

        window.regexArray;
        window.toggleStates;


        // MutationObserver to watch for changes in the DOM
        window.mutationObserverTimeoutId;
        if (!window.cloakObserver) {
            window.cloakObserver = new MutationObserver(() => {
                // Debounce the function to avoid multiple calls in quick succession
                clearTimeout(window.mutationObserverTimeoutId);
                window.mutationObserverTimeoutId = setTimeout(() => {
                    applyFilter(true);
                }, 50);
            });
        }


        function updateRegexes() {
            window.regexArray = [];
            if (cloakablePatterns) {
                Object.keys(window.toggleStates).forEach((key) => {
                    const currentStateOfToggle = window.toggleStates[key];
                    if (currentStateOfToggle) {
                        const cloakablePattern = cloakablePatterns.find((pattern) => pattern.id === key);
                        if (cloakablePattern) {
                            window.regexArray.push(...cloakablePattern.regexes);
                        }
                    }
                });
            }
        }

        function matchPatterns(value) {
            return window.regexArray && window.regexArray.some(regex => regex.test(value));
        }

        function applyFilter(shouldCloak) {
            const passwordLikeText = ["password", "key", "secret"];
            const maskText = "*****";
            const blurFilter = "blur(5px)";
            const resetBlur = "none";
            const titleAttribute = "title";
            const maskTitleAttribute = "maskTitle";
            const dataOriginalTypeAttribute = "data-original-type";
            const filter = shouldCloak ? blurFilter : resetBlur;

            if (!shouldCloak || (shouldCloak && !!window.regexArray.length)) {
                const elements = document.querySelectorAll("body *");
                for (const element of elements) {
                    // Handle title
                    const title = element.hasAttribute(titleAttribute) ? element.getAttribute(titleAttribute) : "";
                    const maskTitle = element.hasAttribute(maskTitleAttribute) ? element.getAttribute(maskTitleAttribute) : "";
                    if (
                        (shouldCloak && title && matchPatterns(title)) ||
                        (!shouldCloak && maskTitle && matchPatterns(maskTitle))
                    ) {
                        if (shouldCloak) {
                            element.setAttribute(titleAttribute, maskText);
                            element.setAttribute(maskTitleAttribute, title);
                        } else {
                            element.setAttribute(titleAttribute, maskTitle);
                            element.removeAttribute(maskTitleAttribute);
                        }

                        if (matchPatterns(element.value)) {
                            element.style.filter = filter;
                            continue;
                        }
                    }

                    // Handle child nodes
                    for (const child of element.childNodes) {
                        if ((child.nodeType === Node.TEXT_NODE)) {
                            if (matchPatterns(child.nodeValue)) {
                                element.style.filter = filter;
                                break;
                            }

                            // Sometimes, we have text that matches the pattern but is later updated to a different text
                            // For such nodes, we reset the filter
                            if (element.style.filter === blurFilter && !matchPatterns(child.nodeValue)) {
                                element.style.filter = resetBlur;
                            }
                        }
                    }
                }
            }

            
                // Find all input fields with class 'azc-password-input' and apply the filter so they appear blurred
                const passwordInputs = document.querySelectorAll('.azc-password-input');
                for (const input of passwordInputs) {
                    input.style.filter = filter;
                }

                // Check for all input fields and set them as password fields so that anything typed in shows up as hidden
                // This is done after the password inputs are blurred so that these do not show up blurred
                if (shouldCloak && window.toggleStates?.["secrets"]) {
                    const inputs = document.querySelectorAll('input[type="text"]');
                    for (const input of inputs) {
                        const originalType = input.hasAttribute(dataOriginalTypeAttribute) ? input.getAttribute(dataOriginalTypeAttribute) : "";
                        if (!originalType) {
                            input.setAttribute(dataOriginalTypeAttribute, "text");
                        }
                        input.type = 'password';
                    }
                } else {
                    const inputs = document.querySelectorAll('input[type="password"]');
                    for (const input of inputs) {
                        const originalType = input.hasAttribute(dataOriginalTypeAttribute) ? input.getAttribute(dataOriginalTypeAttribute) : "";
                        if (originalType) {
                            input.type = originalType;
                            input.removeAttribute(dataOriginalTypeAttribute);
                        }
                    }
                }

                // Find all tables and mask the content of cells in columns with keywords like 'password', 'key', 'secret'
                const tables = document.querySelectorAll('.fxc-gc-table');
                tables.forEach((table) => {
                    // Select all row header cells and find the ones that have the keywords like 'password', 'key', 'secret'
                    const headers = table.querySelectorAll('.fxc-gc-columnheader');
                    headers.forEach((header, columnIndex) => {
                        // Check if the header contains the word 'password', 'key', 'secret'
                        if (passwordLikeText.some((pwdLikeText) => header.textContent?.toLowerCase()?.includes(pwdLikeText))) {
                            // Select all row cells in the same column
                            const cells = table.querySelectorAll(`.fxc-gc-cell:nth-child(${columnIndex + 1})`);

                            // Mask the content of those cells
                            cells.forEach((cell) => {
                                cell.style.filter = filter;
                                const title = cell.getAttribute("title");
                                const maskTitle = cell.getAttribute("maskTitle") || "";
                                if (title) {
                                    if (shouldCloak && window.toggleStates?.["secrets"]) {
                                        cell.setAttribute("title", maskText);
                                        cell.setAttribute("maskTitle", title);
                                    } else {
                                        cell.setAttribute("title", maskTitle);
                                        cell.removeAttribute("maskTitle");
                                    }
                                }
                            });
                        }
                    });
                });
            
        }

        function toggleCloakAndObserve() {
            updateRegexes();
            if (window.regexArray?.length > 0 || !!window.toggleStates?.["secrets"]) {
                applyFilter(true);

                window.cloakObserver && window.cloakObserver.disconnect();
                window.cloakObserver && window.cloakObserver.observe(document.body, {
                    childList: true, // Watch for added/removed elements
                    subtree: true   // Watch the entire subtree of the document
                });
            } else {
                window.cloakObserver && window.cloakObserver.disconnect();
                window.cloakObserver = null;
                applyFilter(false);
            }
        }

        // Listen for changes to the extension state that is persisted in storage
        chrome.storage.onChanged.addListener((changes) => {
            for (const key in changes) {
                if (changes.hasOwnProperty(key) && window.toggleStates.hasOwnProperty(key)) {
                    window.toggleStates[key] = changes[key].newValue !== undefined ? changes[key].newValue : window.toggleStates[key];
                }
            }
            toggleCloakAndObserve();
        });

        chrome.storage.sync.get().then((currentState) => {
            window.toggleStates = {};
            for (const key in currentState) {
                if (currentState.hasOwnProperty(key)) {
                    window.toggleStates[key] = currentState[key];
                }
            }
            toggleCloakAndObserve();
        });
    });
})();