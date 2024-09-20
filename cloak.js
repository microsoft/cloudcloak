// MutationObserver to watch for changes in the DOM
if (!window.cloakObserver) {
    window.cloakObserver = new MutationObserver(cloakText);
}

function matchPatterns(value) {
    const regexArray = [
        /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/, //guid
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, //email
        /(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/, //domain
        /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, //ipv4
        /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, //us phone
        /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/, //uk phone
        /^(\+91[\-\s]?)??(91)?\d{9}$/, //india phone
        /^\+?[1-9]\d{1,14}$/ //intl phone
    ];
    return regexArray.some(regex => regex.test(value));
}

function applyFilter(shouldCloak) {
    const passwordLikeText = [ "password", "key", "secret" ];
    const maskText = "*****";
    const blurFilter = "blur(5px)";
    const resetBlur = "none";
    const filter = shouldCloak ? blurFilter : resetBlur;

    const elements = document.querySelectorAll("body *");
    for (const element of elements) {
        // Handle title
        const title = element.getAttribute("title");
        const maskTitle = element.getAttribute("maskTitle");
        if (
            (shouldCloak && title && matchPatterns(title)) ||
            (!shouldCloak && maskTitle && matchPatterns(maskTitle))
        ) {
            if (shouldCloak) {
                element.setAttribute("title", maskText);
                element.setAttribute("maskTitle", title);
            } else {
                element.setAttribute("title", maskTitle);
                element.removeAttribute("maskTitle");
            }

            if (matchPatterns(element.innerText) || matchPatterns(element.value) || matchPatterns(element.textContent)) {
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

    // Find all input fields with class 'azc-password-input' and apply the filter
    const passwordInputs = document.querySelectorAll('.azc-password-input');
    for (const input of passwordInputs) {
        input.style.filter = filter;
    }

    // Find all tables and mask the content of cells in columns with the word 'password'
    const tables = document.querySelectorAll('.fxc-gc-table');
    tables.forEach((table) => {
        // Select all row header cells and find the ones that have the word 'password'
        const headers = table.querySelectorAll('.fxc-gc-columnheader');
        headers.forEach((header, columnIndex) => {
            // Check if the header contains the word 'password'
            if (passwordLikeText.some((pwdLikeText) => header.textContent.toLowerCase().includes(pwdLikeText))) {
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

function cloakText() {
    applyFilter(true);
}

function cloakTextAndStartObserving() {
    cloakText();

    // Start observing the whole document for changes
    window.cloakObserver && window.cloakObserver.observe(document.body, {
        childList: true, // Watch for added/removed elements
        subtree: true   // Watch the entire subtree of the document
    });
}

function unCloakTextAndStopObserving() {
    window.cloakObserver && window.cloakObserver.disconnect();
    window.cloakObserver = null;
    applyFilter(false);
}

window.unCloakTextAndStopObserving = unCloakTextAndStopObserving;
window.cloakTextAndStartObserving = cloakTextAndStartObserving;
