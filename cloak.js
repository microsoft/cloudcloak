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

            function getCloakTargetNode(node) {
                if (!node) {
                    return null;
                }

                if (node.nodeType === Node.ELEMENT_NODE) {
                    return node;
                }

                if (node.parentElement) {
                    return node.parentElement;
                }

                const parentNode = node.parentNode;
                if (parentNode && parentNode.host && parentNode.host.nodeType === Node.ELEMENT_NODE) {
                    return parentNode.host;
                }

                return null;
            }

            function specialHandlingForAzurePortalEssentialsValues(applyFilter) {
                const filter = applyFilter ? blurFilter : resetBlur;
                const essentialsLabels = document.querySelectorAll("body [class*='essentialsLabel']");

                const getLabelText = (element) => {
                    if (!element) {
                        return "";
                    }

                    const clonedElement = element.cloneNode(true);
                    clonedElement.querySelectorAll("button, [role='button']").forEach((button) => button.remove());

                    return (clonedElement.textContent || "")
                        .replace(/\s+/g, " ")
                        .trim();
                };

                const applyFilterToValueElement = (valueElement) => {
                    if (!valueElement) {
                        return;
                    }

                    const linkTarget = valueElement.matches("a, [role='link']") ? valueElement : valueElement.querySelector("a, [role='link']");
                    const target = linkTarget || valueElement;
                    target.style.filter = filter;
                    tryApplyFilterOnElementTitle(target, applyFilter);
                };

                const findEssentialsValueElement = (essentialsItem, labelElement) => {
                    if (!essentialsItem) {
                        return null;
                    }

                    const isEssentialsLabelText = (text) => {
                        const normalizedText = (text || "").trim().replace(/\s+/g, " ").toLowerCase();
                        return normalizedText.startsWith("subscription") || normalizedText.startsWith("app service plan");
                    };

                    const childElements = Array.from(essentialsItem.children).filter((child) => child !== labelElement);

                    const valueCandidate = childElements.find((child) => child.matches("[class*='essentialsValue']"));
                    if (valueCandidate) {
                        return valueCandidate;
                    }

                    const linkCandidate = childElements.find((child) => child.querySelector("a, [role='link']"));
                    if (linkCandidate) {
                        return linkCandidate;
                    }

                    const textCandidate = childElements.find((child) => {
                        const candidateText = child.textContent?.trim().replace(/\s+/g, " ") || "";
                        return candidateText && candidateText !== ":" && !isEssentialsLabelText(candidateText);
                    });
                    if (textCandidate) {
                        return textCandidate;
                    }

                    return essentialsItem.nextElementSibling;
                };

                essentialsLabels.forEach((element) => {
                    const labelText = getLabelText(element).toLowerCase();
                    const isSubscriptionLabel = labelText.startsWith("subscription");
                    const isAppServicePlanLabel = labelText.startsWith("app service plan");
                    if (!isSubscriptionLabel && !isAppServicePlanLabel) {
                        return;
                    }

                    const essentialsItem = element.closest("[class*='essentialsItem']") || element.parentElement;
                    if (!essentialsItem) {
                        return;
                    }

                    const valueElement = findEssentialsValueElement(essentialsItem, element);
                    applyFilterToValueElement(valueElement);
                });
            }

            function tryMatchAndApplyFilterOnTextNode(node, applyFilter) {
                const filter = applyFilter ? blurFilter : resetBlur;
                if (matchPatterns(node.nodeValue || node.textContent || node.wholeText || node.data || node.value)) {
                    const targetNode = getCloakTargetNode(node);
                    if (!targetNode) {
                        return false;
                    }
                    targetNode.style.filter = filter;
                    tryApplyFilterOnElementTitle(targetNode, applyFilter);
                    return true;
                } else {
                    const targetNode = getCloakTargetNode(node);
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

                    if (node.shadowRoot && node.shadowRoot.childNodes.length > 0) {
                        applyFilterOnNode(node.shadowRoot, applyFilter);
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

            function getDefaultToggleStates() {
                return (cloakablePatterns || []).reduce((states, pattern) => {
                    states[pattern.id] = false;
                    return states;
                }, {});
            }

            function ensureToggleStates(toggleStates = {}) {
                window.toggleStates = {
                    ...getDefaultToggleStates(),
                    ...toggleStates
                };
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
                                    if (applyFilter) {
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
                if (document.body) {
                    applyFilterOnNode(document.body, applyFilter);
                }

                specialHandlingForPasswordFieldsAndTablesWithSecrets(applyFilter);
                specialHandlingForAzurePortalEssentialsValues(!!window.toggleStates?.subscriptioninfo && applyFilter);
            }
            function toggleCloak() {
                // Update the regex patterns
                updateRegexPatterns();

                if (window.regexPatternsArray?.length > 0 || window.toggleStates?.secrets || window.toggleStates?.subscriptioninfo) {
                    getAllNodesAndApplyFilter(true);
                    window.cloakObserver && window.cloakObserver.disconnect();
                    window.cloakObserver && window.cloakObserver.observe(document.body, {
                        childList: true,    // Watch for added/removed elements
                        subtree: true,      // Watch the entire subtree of the document
                        characterData: true // Watch for text content changes (SPA updates)
                    });
                } else {
                    getAllNodesAndApplyFilter(false);
                    window.cloakObserver && window.cloakObserver.disconnect();
                    window.cloakObserver = null;
                }

            }

            window.toggleStates = getDefaultToggleStates();

            // MutationObserver to watch for changes in the DOM
            if (!window.cloakObserver) {
                window.cloakObserver = new MutationObserver((mutationList) => {
                    // Go through the mutations and apply the filter on the added/changed nodes
                    for (const mutation of mutationList) {
                        if (mutation.type === 'characterData') {
                            // Text content changed in-place (common in SPAs like Azure Portal)
                            applyFilterOnNode(mutation.target, true);
                        }
                        mutation.addedNodes.forEach((node) => {
                            applyFilterOnNode(node, true /* If observer is running we are in cloak mode */);
                        });
                    }

                    // Special handling for password fields and tables with secrets
                    window.secretHandlingTimeout && clearTimeout(window.secretHandlingTimeout);
                    window.secretHandlingTimeout = setTimeout(() => {
                        specialHandlingForPasswordFieldsAndTablesWithSecrets(true /* If observer is running we are in cloak mode */);
                        specialHandlingForAzurePortalEssentialsValues(!!window.toggleStates?.subscriptioninfo && true /* If observer is running we are in cloak mode */);
                    }, 50);
                });
            }

            // Listen for changes to the toggle states that is persisted in storage
            chrome.storage.onChanged.addListener((changes) => {
                for (const key in changes) {
                    if (Object.prototype.hasOwnProperty.call(changes, key) && Object.prototype.hasOwnProperty.call(window.toggleStates, key)) {
                        window.toggleStates[key] = changes[key].newValue !== undefined ? changes[key].newValue : window.toggleStates[key];
                    }
                }
                // Debounce the re-crawl so rapid toggling (e.g. "Toggle All") doesn't
                // trigger multiple expensive full-DOM walks back-to-back
                clearTimeout(window.cloakToggleDebounce);
                window.cloakToggleDebounce = setTimeout(toggleCloak, 100);
            });

            chrome.storage.sync.get().then((currentState) => {
                // Get the current state of toggles from storage
                ensureToggleStates(currentState);
                toggleCloak();
            });
        });
    })();
}
