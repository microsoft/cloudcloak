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

function matchPatterns(value) {
    const regexArray = [
        /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/, //guid
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, //email
        /(?!.*[\\/])(?:[a-zA-Z0-9-]+\.)+(com|org|net|edu|gov|mil|int|co|io|biz|info|me|us|uk|ca|de|jp|fr|au|in|cn|ru|br|za|nl|se|no|es|it|ch|pl|eu|tv|cc|ws|mobi|asia|name|pro|aero|coop|museum)/, //domain
        /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, //ipv4
        /\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/, //us phone
        /(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}/, //uk phone
        /(\+91[\-\s]?)??(91)?\d{9}/, //india phone
        /https?:\/\/[^\s]*/ //web addresses
    ];
    return regexArray.some(regex => regex.test(value));
}

function applyFilter(shouldCloak) {
    const passwordLikeText = ["password", "key", "secret"];
    const maskText = "*****";
    const blurFilter = "blur(5px)";
    const resetBlur = "none";
    const titleAttribute = "title";
    const maskTitleAttribute  = "maskTitle";
    const dataOriginalTypeAttribute = "data-original-type";
    const filter = shouldCloak ? blurFilter : resetBlur;

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

    // Find all input fields with class 'azc-password-input' and apply the filter so they appear blurred
    const passwordInputs = document.querySelectorAll('.azc-password-input');
    for (const input of passwordInputs) {
        input.style.filter = filter;
    }

    // Check for all input fields and set them as password fields so that anything typed in shows up as hidden
    // This is done after the password inputs are blurred so that these do not show up blurred
    if (shouldCloak) {
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

function toggleCloakAndObserve(shouldCloak) {
    if (shouldCloak) {
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
chrome.storage.onChanged.addListener((changes) => { toggleCloakAndObserve(changes.enabled.newValue); });

// Check the current state of the extension and cloak the text accordingly
chrome.storage.sync.get().then((currentState) => { toggleCloakAndObserve(currentState.enabled); });
