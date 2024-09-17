function unCloakText() {
    const guidPattern = /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const domainPattern = /(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/;
    const ipv4Pattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    
    const elements = document.querySelectorAll('body *');
    elements.forEach(element => {
        element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                if (guidPattern.test(child.nodeValue) || emailPattern.test(child.nodeValue) || domainPattern.test(child.nodeValue) || ipv4Pattern.test(child.nodeValue)) {
                    element.style.filter = "none";
                }
            }
        });
    });
}

unCloakText();
