// ==UserScript==
// @name         Chime Chief Mate
// @namespace    wchemz
// @version      2.0.0
// @description  Save Chime CC to disk, this script is going to enable machine generated caption by default
// @author       Wei Chen <wchemz@amazon.com>
// @match        https://app.chime.aws/meetings/*
// @grant        GM_xmlhttpRequest
// @updateURL    https://github.com/wchemz/ChimeChiefMate/raw/main/scripts/ChimeMeetingCC.user.js
// @downloadURL  https://github.com/wchemz/ChimeChiefMate/raw/main/scripts/ChimeMeetingCC.user.js
// @connect      6upnfpnrt8.execute-api.us-east-1.amazonaws.com
// ==/UserScript==

(function () {
    "use strict";
    const RoleEnum = {
        NA: 'NA',
        SA: 'SA',
        AM: 'AM',
        DM: 'DM',
        TAM: 'TAM',
        HR: 'HR',
        SUPPORT: 'SUPPORT'
    };

    //Update this to get your relative action items
    const roleName = RoleEnum.NA;

    //offlineMode: false ? (save to disk && invoke api) : (save to disk only)
    const offlineMode = false;

    const querySelectorPathMainArea = `nav[data-testid="control-bar"] div[data-test-id="flex"]`;
    const querySelectorPathButton = `chimeMeetingCC`;
    addSaveButtonToMenu();

    var timerId = null;
    var meetingId = null;
    var timer = setInterval(function () {
        var mainArea = document.querySelector(querySelectorPathMainArea)
        if (mainArea) {
            addSaveButtonToMenu();
            clearInterval(timer);
        } else {
            console.log("Chime Meeting Log Saver: Missing path to area to place save button...Chime Web UI must have changed: " + querySelectorPathMainArea);
        }
    }, 2000);


    function addSaveButtonToMenu() {
        const meetingTop = document.querySelector(querySelectorPathMainArea)
        if (!meetingTop) {
            return;
        }

        // Create the outer div element with class and data-test-id attributes
        const outerDiv = document.createElement('div');
        outerDiv.classList.add('F0UA3OGcJZIObDPdj9chR', 'ch-control-bar-btn-wrapper');
        outerDiv.setAttribute('data-test-id', 'SaveMeetingCaption');

        // Create the inner div element with class "_1CHilVkFW64baA86DEITpB"
        const innerDiv = document.createElement('div');
        innerDiv.classList.add('_1CHilVkFW64baA86DEITpB');

        // Create the span element with class "_1ujIO6VidjhA0Jx5NJDi64"
        const spanElement = document.createElement('span');
        spanElement.classList.add('_1ujIO6VidjhA0Jx5NJDi64');

        // Create the button element with classes, attributes, and id
        const buttonElement = document.createElement('button');
        buttonElement.classList.add('outlook__button', 'outlook__button--default', '_3Qdm7kDcXZkFyvRiDHxI7m', '_6r72YEzgxJnG7jGGxa74i', '_3XyrA5QGUz0NqaFXFsRq8d');
        buttonElement.setAttribute('data-testid', 'button');
        buttonElement.setAttribute('aria-label', 'Save Meeting Caption');
        buttonElement.setAttribute('type', 'button');
        buttonElement.setAttribute('id', 'saveMeetingCaption');
        buttonElement.addEventListener("click", saveChimeCCTextArray);

        // Create the span element with class "ch-icon _2xCR-KH821nE_g8TcMukUv _1ujIO6VidjhA0Jx5NJDi64"
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('ch-icon', '_2xCR-KH821nE_g8TcMukUv', '_1ujIO6VidjhA0Jx5NJDi64');

        // Create the SVG element
        const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.classList.add('Svg');
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgElement.setAttribute('viewBox', '0 0 24 24');
        svgElement.setAttribute('data-testid', 'save-meeting-caption');
        svgElement.setAttribute('style', 'color: rgb(255, 255, 255)');

        // Create the path element within the SVG
        const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute('fill-rule', 'evenodd');
        pathElement.setAttribute('d', 'M4,2 L18.4222294,2 L22,5.67676491 L22,20 C22,21.1045695 21.1045695,22 20,22 L4,22 C2.8954305,22 2,21.1045695 2,20 L2,4 C2,2.8954305 2.8954305,2 4,2 Z M17,4 L17,10 L7,10 L7,4 L4,4 L4,20 L6,20 L6,12 L18,12 L18,20 L20,20 L20,6.48925072 L17.5777706,4 L17,4 Z M9,4 L9,8 L15,8 L15,4 L9,4 Z M8,14 L8,20 L16,20 L16,14 L8,14 Z M12,5 L14,5 L14,7 L12,7 L12,5 Z');

        // Append the path element to the SVG element
        svgElement.appendChild(pathElement);

        // Append the SVG element to the icon span
        iconSpan.appendChild(svgElement);

        // Create the span element with class "ch-label"
        const labelSpan = document.createElement('span');
        labelSpan.classList.add('ch-label');
        labelSpan.setAttribute('data-testid', 'button-label');
        labelSpan.textContent = 'Save Meeting Caption';

        // Append the icon span and label span to the button element
        buttonElement.appendChild(iconSpan);
        buttonElement.appendChild(labelSpan);

        // Append the button element to the span element
        spanElement.appendChild(buttonElement);

        // Create the label element with class "_3KU8weQbtLiFvPUQLzBJCu" and "for" attribute
        const labelElement = document.createElement('label');
        labelElement.classList.add('_3KU8weQbtLiFvPUQLzBJCu');
        labelElement.setAttribute('for', 'saveMeetingCaption');
        labelElement.textContent = 'Save';

        // Append the inner div and label element to the outer div
        innerDiv.appendChild(spanElement);
        outerDiv.appendChild(innerDiv);
        outerDiv.appendChild(labelElement);

        // Assign the resulting structure to the variable saveButton
        let saveButton = outerDiv;

        meetingTop.appendChild(saveButton);
    }

    var chimeCCTextArray = []; // Initialize the array

    // Function to load data from session storage
    function loadFromSessionStorage() {
        var storedData = sessionStorage.getItem('chimeCCTextArray');
        if (storedData) {
            chimeCCTextArray = JSON.parse(storedData);
        }
    }

    // Function to save data to session storage
    function saveToSessionStorage() {
        sessionStorage.setItem('chimeCCTextArray', JSON.stringify(chimeCCTextArray));
    }

    // Load data from session storage on page load
    window.addEventListener('load', function () {
        loadFromSessionStorage();
        console.log('Loaded from session storage:', chimeCCTextArray);
    });

    function mutationCallback(mutations) {
        console.log('mutationCallback');
        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName === 'DIV') {
                            //speaker
                            chimeCCTextArray.push(node.textContent + ": ");
                        } else if (node.tagName === 'P') {
                            //content
                            chimeCCTextArray.push(node.textContent);
                        }
                    });
                }
            }
            else if (mutation.type === 'characterData') {
                const oldValue = mutation.oldValue;
                const newValue = mutation.target.textContent;
                const startIndex = Math.max(0, chimeCCTextArray.length - 50);
                for (let i = chimeCCTextArray.length - 1; i >= startIndex; i--) {
                    if (chimeCCTextArray[i] === oldValue) {
                        chimeCCTextArray[i] = newValue;
                    }
                }
            }
            saveToSessionStorage();
        }
    }

    function setupMutationObserver() {
        console.log("Setting up MutationObserver...");
        const ccDivElementWrapper = document.querySelector('div[style="color: rgb(255, 255, 255); font-size: 16px;"]');
        if (ccDivElementWrapper) {
            console.log("ccDivElementWrapper found. Setting up observer.");
            let ccDivElement = ccDivElementWrapper.firstElementChild;
            const config = {
                childList: true,
                subtree: true,
                characterData: true,
                characterDataOldValue: true
            }
            let observer = new MutationObserver(mutationCallback);
            observer.observe(ccDivElement, config);
        } else {
            console.log("ccDivElement not found. Retrying after 2s.");
            setTimeout(setupMutationObserver, 2000); // Retry after 2s if not found
        }
    }

    function saveChimeCCTextArray() {
        const h2Element = document.querySelector('h2[data-test-id="meetingTitle"]');
        if (h2Element) {
            const meetingTitle = h2Element.textContent + " ";
            meetingId = prompt("Save machine generated captions for: ", meetingTitle);
        }
        if (null === meetingId) {
            meetingId = document.title;
        }
        console.debug("Starting saving");
        const currentTimeFormatted = getCurrentTimeFormatted();
        const fileName = `${meetingId}_${currentTimeFormatted}.txt`;
        // Join the array elements with a line break
        const contentWithLineBreaks = chimeCCTextArray.join('\n');
        if (!offlineMode) {
            genAi(contentWithLineBreaks);
        }
        saveAs(meetingId + "_" + currentTimeFormatted + ".txt", contentWithLineBreaks);
    }

    function saveAs(filename, contents) {
        console.log("saving", filename); //, "with contents", contents);
        var file = new Blob([contents], { type: "text/plain" });
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }

    function genAi(contentWithLineBreaks) {
        if (null === meetingId) {
            const h2Element = document.querySelector('h2[data-test-id="meetingTitle"]');
            if (h2Element) {
                const meetingTitle = h2Element.textContent + " ";
                meetingId = prompt("Save machine generated captions for: ", meetingTitle);
            }
            if (null === meetingId) {
                meetingId = document.title;
            }
        }
        let genAiRequest;
        const currentOrigin = window.location.origin;
        if (currentOrigin === "https://app.chime.aws") {
            const AmazonChimeExpressSession = localStorage.getItem("AmazonChimeExpressSession");
            const typeOfAmazonChimeExpressSession = typeof AmazonChimeExpressSession;
            if (AmazonChimeExpressSession) {
                try {
                    const escapedAmazonChimeExpressSession = AmazonChimeExpressSession.replace(/\\"/g, '"');
                    const cleanedAmazonChimeExpressSession = escapedAmazonChimeExpressSession.slice(1, -1);
                    const sessionData = JSON.parse(cleanedAmazonChimeExpressSession);

                    const primaryEmail = sessionData.primaryEmail;
                    const fullName = sessionData.fullName;

                    console.log("Primary Email:", primaryEmail);
                    console.log("Full Name:", fullName);

                    genAiRequest = {
                        "primaryEmail": `${primaryEmail}`,
                        "fullName": `${fullName}`,
                        "meetingNote": `${contentWithLineBreaks}`,
                        "roleName": `${roleName}`,
                        "prompt": "",
                        "meetingId": `${meetingId}`,
                    };
                    console.log(genAiRequest);
                } catch (error) {
                    console.error("Error parsing AmazonChimeExpressSession:", error);
                }
            } else {
                console.log("AmazonChimeExpressSession not found in localStorage.");
            }
        } else {
            console.log("Not on https://app.chime.aws. Skipping retrieval of AmazonChimeExpressSession.");
        }


        // RESTful URL
        const url = "https://6upnfpnrt8.execute-api.us-east-1.amazonaws.com/dev/genai";

        // Send POST request
        GM.xmlHttpRequest({
            method: "POST",
            url: url,
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify(genAiRequest),
            onload: function (response) {
                console.log("Response:", response.responseText);
            },
            onerror: function (error) {
                console.error("Error:", error);
            }
        });
    }

    function getCurrentTimeFormatted() {
        const now = new Date();
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true };
        return now.toLocaleString(undefined, options).replace(/[\/:]/g, '-') // Replaces slashes and colons with hyphens
            .replace(/,\s+/g, ' ') // Removes comma and space
            .replace(/-(\d{1}) /g, '-0$1 ') // Adds leading zero to single-digit day
            .replace(/-(\d{1})$/g, '-0$1') // Adds leading zero to single-digit month
            .replace(/-(\d{2}) /g, '-$1 ') // Keeps double-digit day and month as is
            .replace(/-(\d{2})$/g, '-$1') // Keeps double-digit day and month as is
            .replace(/:\d+ /, ' '); // Removes seconds and space
    }

    function saveMeetingOnClose() {
        console.log("Saving meeting on close.");
        //When the window is closed, save the meeting notes
        addEventListener('beforeunload', saveChimeCCTextArray);
    }

    setupMutationObserver(); // Start the setup on script load

})();