if (window.cloakScriptInjected !== true) {
    window.cloakScriptInjected = true;

    (async () => {
        const src = chrome.runtime.getURL("./common.js");
        import(src).then((commonModule) => {
            const cloakablePatterns = commonModule.cloakablePatterns;
            const cloakObserverOptions = commonModule.cloakObserverOptions;
            const matchesPageRuleLabel = commonModule.matchesPageRuleLabel;
            const pageSpecificRules = commonModule.pageSpecificRules || [];
            const isPageRuleActive = commonModule.isPageRuleActive;
            const normalizePageRuleText = commonModule.normalizePageRuleText;
            const blurFilter = "blur(5px)";
            const maskText = "*****";
            const resetBlur = "none";

            window.regexPatternsArray;
            window.toggleStates;

            function tryApplyFilterOnElementTitle(element, shouldCloak, force = false) {
                const titleAttribute = "title";
                const maskTitleAttribute = "maskTitle";


                const title = element.hasAttribute(titleAttribute) ? element.getAttribute(titleAttribute) : "";
                const maskTitle = element.hasAttribute(maskTitleAttribute) ? element.getAttribute(maskTitleAttribute) : "";
                if (
                    (shouldCloak && title && (force || matchPatterns(title))) ||
                    (!shouldCloak && maskTitle && (force || matchPatterns(maskTitle)))
                ) {
                    if (shouldCloak) {
                        element.setAttribute(titleAttribute, maskText);
                        if (!maskTitle) {
                            element.setAttribute(maskTitleAttribute, title);
                        }
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

            function getPageRuleMaskAttribute(ruleId) {
                return `data-cloudcloak-page-rule-${ruleId}`;
            }

            function getExplicitCloakMarkerValue(element) {
                if (!element || !element.getAttribute) {
                    return "";
                }

                return normalizePageRuleText(element.getAttribute("data-cloudcloak"));
            }

            function shouldForceMaskElement(element) {
                const markerValue = getExplicitCloakMarkerValue(element);
                return markerValue === "cloak" || markerValue === "mask" || markerValue === "sensitive";
            }

            function getPageRuleMaskTarget(element, rule) {
                if (!element) {
                    return null;
                }

                if (!rule?.maskClosestSelector) {
                    return element;
                }

                return element.closest(rule.maskClosestSelector) || element;
            }

            function getActivePageRules() {
                return pageSpecificRules.filter((rule) => isPageRuleActive(rule, window.location.href, window.toggleStates));
            }

            function getElementMaskValue(element) {
                if (!element) {
                    return "";
                }

                return (element.value || element.textContent || element.getAttribute("title") || "").trim();
            }

            function collectRuleContextText(element) {
                const contextValues = [];
                const addContextValue = (value) => {
                    const normalizedValue = normalizePageRuleText(value);
                    if (normalizedValue) {
                        contextValues.push(normalizedValue);
                    }
                };

                if (!element) {
                    return contextValues;
                }

                ["aria-label", "placeholder", "name", "id", "title"].forEach((attributeName) => {
                    addContextValue(element.getAttribute(attributeName));
                });

                const labelledBy = (element.getAttribute("aria-labelledby") || "")
                    .split(/\s+/)
                    .map((id) => id.trim())
                    .filter(Boolean);
                labelledBy.forEach((labelId) => {
                    addContextValue(document.getElementById(labelId)?.textContent);
                });

                if (element.labels) {
                    Array.from(element.labels).forEach((label) => addContextValue(label.textContent));
                }

                const contextContainer = element.closest("[class*='fxc-gc'], [class*='form'], [class*='row'], [role='row'], [role='group']") || element.parentElement;
                if (contextContainer) {
                    addContextValue(contextContainer.getAttribute?.("aria-label"));

                    contextContainer.querySelectorAll("label, [role='label'], [class*='label'], [class*='header'], th, dt, legend").forEach((candidate) => {
                        if (candidate === element || candidate.contains(element)) {
                            return;
                        }

                        addContextValue(candidate.textContent);
                    });

                    addContextValue(element.previousElementSibling?.textContent);
                    addContextValue(contextContainer.previousElementSibling?.textContent);
                    addContextValue(contextContainer.parentElement?.previousElementSibling?.textContent);
                }

                return contextValues;
            }

            function elementMatchesPageRuleContext(element, rule) {
                const labels = rule.contextLabels || [];
                if (labels.length === 0) {
                    return false;
                }

                const contextValues = collectRuleContextText(element);
                return labels.some((label) => contextValues.some((contextValue) => matchesPageRuleLabel(label, contextValue)));
            }

            function elementHasNearbyRuleActions(element, rule) {
                const actionLabels = rule.nearbyActionLabels || [];
                if (actionLabels.length === 0) {
                    return false;
                }

                const actionTexts = [];
                const addActionText = (value) => {
                    const normalizedValue = normalizePageRuleText(value);
                    if (normalizedValue) {
                        actionTexts.push(normalizedValue);
                    }
                };

                const contextContainers = [];
                let currentContainer = element.closest("[class*='fxc-gc'], [class*='form'], [class*='row'], [role='row'], [role='group']") || element.parentElement;
                for (let depth = 0; currentContainer && depth < (rule.actionSearchDepth || 1); depth++) {
                    contextContainers.push(currentContainer);
                    currentContainer = currentContainer.parentElement;
                }

                contextContainers.forEach((contextContainer) => {
                    contextContainer.querySelectorAll("button, [role='button'], [title], [aria-label]").forEach((candidate) => {
                        if (candidate === element || candidate.contains(element)) {
                            return;
                        }

                        addActionText(candidate.textContent);
                        addActionText(candidate.getAttribute?.("title"));
                        addActionText(candidate.getAttribute?.("aria-label"));
                    });
                });

                return actionLabels.some((label) => actionTexts.some((actionText) => matchesPageRuleLabel(label, actionText)));
            }

            function applyPageRuleMaskToElement(element, shouldCloak, ruleId) {
                if (!element) {
                    return;
                }

                const ruleMaskAttribute = getPageRuleMaskAttribute(ruleId);
                if (shouldCloak) {
                    element.style.filter = blurFilter;
                    element.setAttribute(ruleMaskAttribute, "true");
                    tryApplyFilterOnElementTitle(element, true, true);
                    return;
                }

                if (!element.hasAttribute(ruleMaskAttribute)) {
                    return;
                }

                element.removeAttribute(ruleMaskAttribute);
                const shouldKeepMaskedByPattern = matchPatterns(getElementMaskValue(element));
                const originalTitle = element.getAttribute("maskTitle") || "";

                element.style.filter = shouldKeepMaskedByPattern ? blurFilter : resetBlur;
                if (originalTitle && matchPatterns(originalTitle)) {
                    element.setAttribute("title", maskText);
                } else {
                    tryApplyFilterOnElementTitle(element, false, true);
                }
            }

            function updatePageRuleMatches(rule, matchedElements, shouldCloak) {
                const maskedElements = document.querySelectorAll(`[${getPageRuleMaskAttribute(rule.id)}]`);
                const matchedElementSet = new Set(matchedElements);

                maskedElements.forEach((element) => {
                    if (!shouldCloak || !matchedElementSet.has(element)) {
                        applyPageRuleMaskToElement(element, false, rule.id);
                    }
                });

                if (!shouldCloak) {
                    return;
                }

                matchedElements.forEach((element) => {
                    applyPageRuleMaskToElement(element, true, rule.id);
                });
            }

            function runContextAwarePageRule(rule, shouldCloak) {
                const candidateSelectors = (rule.valueSelectors || []).join(", ");
                const matchedElements = [];
                const matchedElementSet = new Set();
                if (candidateSelectors) {
                    document.querySelectorAll(candidateSelectors).forEach((element) => {
                        const elementValue = getElementMaskValue(element);
                        if (!elementValue) {
                            return;
                        }

                        const meetsMinimumValueLength = elementValue.length >= (rule.minimumValueLength || 1);
                        const matchesRuleContext = elementMatchesPageRuleContext(element, rule);
                        const hasNearbyActions = meetsMinimumValueLength && elementHasNearbyRuleActions(element, rule);

                        if (matchesRuleContext || hasNearbyActions) {
                            const maskTarget = getPageRuleMaskTarget(element, rule);
                            if (maskTarget && !matchedElementSet.has(maskTarget)) {
                                matchedElementSet.add(maskTarget);
                                matchedElements.push(maskTarget);
                            }
                        }
                    });
                }

                updatePageRuleMatches(rule, matchedElements, shouldCloak);
            }

            function runPageSpecificRule(rule, shouldCloak) {
                if (rule.valueSelectors?.length) {
                    runContextAwarePageRule(rule, shouldCloak);
                } else {
                    updatePageRuleMatches(rule, [], false);
                }
            }

            function runPageSpecificRules(applyFilter) {
                const activePageRules = new Set(getActivePageRules().map((rule) => rule.id));

                pageSpecificRules.forEach((rule) => {
                    runPageSpecificRule(rule, applyFilter && activePageRules.has(rule.id));
                });
            }

            function schedulePageSpecificRuleRescan() {
                const activePageRules = getActivePageRules();
                if (activePageRules.length === 0) {
                    return;
                }

                window.pageRuleRescanTimeouts = window.pageRuleRescanTimeouts || [];
                window.pageRuleRescanTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
                window.pageRuleRescanTimeouts = [];

                const rescanDelays = [...new Set(activePageRules.flatMap((rule) => rule.interactionRescanDelays || [0]))];
                rescanDelays.forEach((delay) => {
                    window.pageRuleRescanTimeouts.push(setTimeout(() => {
                        runPageSpecificRules(true);
                    }, delay));
                });
            }

            function ensurePageRuleInteractionHandlers() {
                if (window.pageRuleInteractionHandlersRegistered) {
                    return;
                }

                const scheduleTrustedRescan = (event) => {
                    if (!event.isTrusted) {
                        return;
                    }

                    if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") {
                        return;
                    }

                    schedulePageSpecificRuleRescan();
                };

                document.addEventListener("mousedown", scheduleTrustedRescan, true);
                document.addEventListener("click", scheduleTrustedRescan, true);
                document.addEventListener("keydown", scheduleTrustedRescan, true);
                window.pageRuleInteractionHandlersRegistered = true;
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

            function applyFilterOnNode(node, applyFilter, shouldRecurse = true) {
                // Ignore script and style tags
                if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE" || node.nodeName === "svg" || node.nodeType == Node.COMMENT_NODE) {
                    return;
                }

                if (node.nodeType === Node.TEXT_NODE || node.nodeName === "INPUT") {
                    tryMatchAndApplyFilterOnTextNode(node, applyFilter);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    tryApplyFilterOnElementTitle(node, applyFilter, shouldForceMaskElement(node));
                    if (shouldForceMaskElement(node)) {
                        node.style.filter = applyFilter ? blurFilter : resetBlur;
                    }

                    // Handle child nodes
                    if (shouldRecurse) {
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

                    if (shouldRecurse && node.shadowRoot && node.shadowRoot.childNodes.length > 0) {
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
                const passwordLikeText = ["password", "key", "secret", "token", "connection string", "client secret"];
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

                const secureFieldContainers = document.querySelectorAll("[class*='form'], [class*='row'], [role='row'], [role='group'], [class*='section']");
                secureFieldContainers.forEach((container) => {
                    const labelCandidates = container.querySelectorAll("label, [role='label'], [class*='label'], [class*='header'], dt, legend");
                    const hasSecureLabel = Array.from(labelCandidates).some((label) =>
                        passwordLikeText.some((pwdLikeText) => matchesPageRuleLabel(pwdLikeText, label.textContent))
                    );
                    if (!hasSecureLabel) {
                        return;
                    }

                    const valueCandidates = container.querySelectorAll("input:not([type='password']), textarea, [role='textbox'], [class*='value'], [class*='output'], [class*='content'], [class*='text'], code, pre, a[href]");
                    valueCandidates.forEach((valueCandidate) => {
                        if (labelCandidates.length > 0 && Array.from(labelCandidates).some((label) => label.contains(valueCandidate))) {
                            return;
                        }

                        const valueText = getElementMaskValue(valueCandidate);
                        if (!valueText || valueText.length < 3) {
                            return;
                        }

                        valueCandidate.style.filter = filter;
                        tryApplyFilterOnElementTitle(valueCandidate, applyFilter, true);
                    });
                });
            }
            function getAllNodesAndApplyFilter(applyFilter) {
                if (document.body) {
                    applyFilterOnNode(document.body, applyFilter);
                }

                specialHandlingForPasswordFieldsAndTablesWithSecrets(applyFilter);
                specialHandlingForAzurePortalEssentialsValues(!!window.toggleStates?.subscriptioninfo && applyFilter);
                runPageSpecificRules(applyFilter);
            }
            function toggleCloak() {
                // Update the regex patterns
                updateRegexPatterns();
                ensurePageRuleInteractionHandlers();

                if (window.regexPatternsArray?.length > 0 || window.toggleStates?.secrets || window.toggleStates?.subscriptioninfo) {
                    getAllNodesAndApplyFilter(true);
                    window.cloakObserver && window.cloakObserver.disconnect();
                    window.cloakObserver && window.cloakObserver.observe(document.body, cloakObserverOptions);
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
                        if (mutation.type === 'attributes') {
                            const shouldDeepScan = mutation.attributeName !== 'class' && mutation.attributeName !== 'style';
                            applyFilterOnNode(mutation.target, true, shouldDeepScan);
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
                        runPageSpecificRules(true /* If observer is running we are in cloak mode */);
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
