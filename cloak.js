if (window.cloakScriptInjected !== true) {
    window.cloakScriptInjected = true;

    (async () => {
        const src = chrome.runtime.getURL("./common.js");
        import(src).then((commonModule) => {
            const cloakablePatterns = commonModule.cloakablePatterns;
            const blurFilter = "blur(5px)";
            const resetBlur = "none";

            window.regexPatternsArray;
            window.toggleStates;

            function tryApplyFilterOnElementTitle(element, shouldCloak) {
                const titleAttribute = "title";
                const maskTitleAttribute = "maskTitle";
                const maskText = "*****";


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
                }
            }

            function tryMatchAndApplyFilterOnTextNode(node, applyFilter) {
                const filter = applyFilter ? blurFilter : resetBlur;
                if (matchPatterns(node.nodeValue || node.textContent || node.wholeText || node.data || node.value)) {
                    const targetNode = node.style ? node : node.parentElement;
                    targetNode.style.filter = filter;
                    tryApplyFilterOnElementTitle(targetNode, applyFilter);
                    return true;
                } else {
                    const targetNode = node.style ? node : node.parentElement;
                    if (targetNode?.style?.filter === blurFilter) {
                        // Sometimes, we have text that matches the pattern but is later updated to a different text
                        // For such nodes, we reset the filter and the title
                        targetNode.style.filter = resetBlur;
                        tryApplyFilterOnElementTitle(targetNode, false);
                        return true;
                    }
                }
            }

            function applyFilterOnNode(node, applyFilter) {
                // Ignore script and style tags
                if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE" || node.nodeName === "svg" || node.nodeType == Node.COMMENT_NODE) {
                    return;
                }

                if (node.nodeType === Node.TEXT_NODE || node.nodeName === "INPUT") {
                    tryMatchAndApplyFilterOnTextNode(node, applyFilter);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // Handle child nodes
                    for (const child of node.childNodes) {
                        if ((child.nodeType === Node.TEXT_NODE || child.nodeName === "INPUT") && tryMatchAndApplyFilterOnTextNode(child, applyFilter)) {
                            break;
                        }

                        // Recurse into child nodes
                        if (child.childNodes && child.childNodes.length > 0) {
                            applyFilterOnNode(child, applyFilter);
                        }
                    }
                }
            }

            function updateRegexPatterns() {
                window.regexPatternsArray = [];
                if (cloakablePatterns) {
                    Object.keys(window.toggleStates).forEach((key) => {
                        const currentStateOfToggle = window.toggleStates[key];
                        if (currentStateOfToggle) {
                            const cloakablePattern = cloakablePatterns.find((pattern) => pattern.id === key);
                            if (cloakablePattern) {
                                window.regexPatternsArray.push(...cloakablePattern.regexes);
                            }
                        }
                    });
                }
            }

            function matchPatterns(value) {
                return window.regexPatternsArray && window.regexPatternsArray.some(regex => regex.test(value));
            }

            function specialHandlingForPasswordFieldsAndTablesWithSecrets(applyFilter) {
                const passwordLikeText = ["password", "key", "secret"];
                const filter = applyFilter ? blurFilter : resetBlur;

                // Find all input password fields and apply the filter so they appear blurred
                const passwordInputs = document.querySelectorAll('input[type="password"]');
                for (const input of passwordInputs) {
                    input.style.filter = filter;
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
                                    if (shouldCloak) {
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
            function getAllNodesAndApplyFilter(applyFilter) {
                const elements = document.querySelectorAll("body *"); //"body *:not([style*='filter: blur(\"5px\")'])"); //document.querySelectorAll("body *");
                for (const element of elements) {
                    applyFilterOnNode(element, applyFilter);
                }

                specialHandlingForPasswordFieldsAndTablesWithSecrets(applyFilter);
            }
            function toggleCloak() {
                // Update the regex patterns
                updateRegexPatterns();

                if (window.regexPatternsArray?.length > 0 || window.toggleStates?.secrets) {
                    getAllNodesAndApplyFilter(true);
                    window.cloakObserver && window.cloakObserver.disconnect();
                    window.cloakObserver && window.cloakObserver.observe(document.body, {
                        childList: true, // Watch for added/removed elements
                        subtree: true   // Watch the entire subtree of the document
                    });
                } else {
                    getAllNodesAndApplyFilter(false);
                    window.cloakObserver && window.cloakObserver.disconnect();
                    window.cloakObserver = null;
                }

            }

            // MutationObserver to watch for changes in the DOM
            if (!window.cloakObserver) {
                window.cloakObserver = new MutationObserver((mutationList) => {
                    // Go through the mutations and apply the filter on the added nodes
                    for (const mutation of mutationList) {
                        mutation.addedNodes.forEach((node) => {
                            applyFilterOnNode(node, true /* If observer is running we are in cloak mode */);
                        });
                    }

                    // Special handling for password fields and tables with secrets
                    window.secretHandlingTimeout && clearTimeout(window.secretHandlingTimeout);
                    window.secretHandlingTimeout = setTimeout(() => {
                        specialHandlingForPasswordFieldsAndTablesWithSecrets(true /* If observer is running we are in cloak mode */);
                    }, 50);
                });
            }

            // Listen for changes to the toggle states that is persisted in storage
            chrome.storage.onChanged.addListener((changes) => {
                for (const key in changes) {
                    if (changes.hasOwnProperty(key) && window.toggleStates.hasOwnProperty(key)) {
                        window.toggleStates[key] = changes[key].newValue !== undefined ? changes[key].newValue : window.toggleStates[key];
                    }
                }
                toggleCloak();
            });

            chrome.storage.sync.get().then((currentState) => {
                // Get the current state of toggles from storage
                window.toggleStates = {};
                for (const key in currentState) {
                    if (currentState.hasOwnProperty(key)) {
                        window.toggleStates[key] = currentState[key];
                    }
                }
                toggleCloak();
            });
        });
    })();
}