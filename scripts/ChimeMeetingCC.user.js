// ==UserScript==
// @name         Chime Chief Mate
// @namespace    wchemz
// @version      1.0.0
// @description  Save Chime CC to disk, this script is going to enable machine generated caption by default
// @author       Wei Che <wchemz@amazon.com>
// @match        https://app.chime.aws/meetings/*
// @grant        GM_xmlhttpRequest
// @updateURL    https://github.com/wchemz/ChimeChiefMate/raw/main/scripts/ChimeMeetingCC.user.js
// @downloadURL  https://github.com/wchemz/ChimeChiefMate/raw/main/scripts/ChimeMeetingCC.user.js
// ==/UserScript==

(function () {
    "use strict";
    const RoleEnum = {
        SA: 'SA',
        AM: 'AM',
        DM: 'DM',
        TAM: 'TAM'
    };
    //Update this to get your relative action items
    const roleName = RoleEnum.AM;

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

        var saveButton = document.createElement("div");
        saveButton.title = "Save Captions to disk";
        saveButton.style.cssText = "margin: 12px 0 0 16px; cursor:pointer; line-height:24px;";
        saveButton.className = querySelectorPathButton;
        saveButton.innerHTML = "&#x1F4BE;";
        saveButton.addEventListener("click", saveChimeCCTextArray);
        meetingTop.appendChild(saveButton);
    }

    var chimeCCTextArray = []; // Initialize the array

    async function setupMutationObserver() {
        console.log("Setting up MutationObserver...");

        const buttonWithAriaLabel = await waitForElement('[aria-label="Caption settings"]');

        if (buttonWithAriaLabel) {
            console.log("Button with Aria Label found. Setting up observer.");
            const ccDiv = buttonWithAriaLabel.closest('div').previousElementSibling;
            const observer = new MutationObserver(function (mutationsList) {
                console.log("Mutation observer callback triggered.");
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        console.log("Mutation detected. Updating Chime CC Text Array...");
                        updateChimeCCTextArray();
                    }
                }
            });
            observer.observe(ccDiv, { childList: true });
        } else {
            console.log("Button with Aria Label not found. Retrying after 2s.");
            setTimeout(setupMutationObserver, 2000); // Retry after 2s if not found
        }
    }

    async function waitForElement(selector) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                }
            }, 100);
        });
    }

    function updateChimeCCTextArray() {
        const buttonWithAriaLabel = document.querySelector('[aria-label="Caption settings"]');
        if (buttonWithAriaLabel) {
            const chimeCCTextElement = buttonWithAriaLabel.closest('div').previousElementSibling;
            if (chimeCCTextElement) {
                let currentIndex = 0;
                let currentElement = chimeCCTextElement.firstElementChild;
                const appendedArray = [];

                while (currentElement) {
                    if (currentIndex % 2 === 0) {
                        const appendedContent = currentElement.nextElementSibling ? currentElement.nextElementSibling.innerText : '';
                        if (currentElement.innerText == "Amazon Chime") {
                            currentElement = currentElement.nextElementSibling;
                            currentIndex++;
                            continue;
                        }
                        const caption = currentElement.innerText + ": " + appendedContent;

                        // Check if the caption is not already in the array before appending
                        if (!chimeCCTextArray.includes(caption)) {
                            appendedArray.push(caption);
                        }
                    }
                    currentElement = currentElement.nextElementSibling;
                    currentIndex++;
                }

                // Append new content to the existing array
                chimeCCTextArray.push(...appendedArray);
            }
        }
    }

    function saveChimeCCTextArray() {
        const h2Element = document.querySelector('h2[data-test-id="meetingTitle"]');
        if (h2Element) {
            const meetingTitle = h2Element.textContent + " - Machine generated captions";
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
                        "prompt": ""
                    };
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
        var url = "https://6upnfpnrt8.execute-api.us-east-1.amazonaws.com/dev/genai";

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

    function checkAndClickCCButton() {
        const buttonSelector = 'button[aria-label="Turn on machine generated captions"]';
        const buttonElement = document.querySelector(buttonSelector);

        if (buttonElement && buttonElement.getAttribute('aria-pressed') === 'false') {
            buttonElement.click();
            console.log("Button clicked.");
        }
    }

    setupMutationObserver(); // Start the setup on script load
    checkAndClickCCButton();

})();
