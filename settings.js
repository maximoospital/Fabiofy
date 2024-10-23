var extensionIsDisabled
var appearChance
var flipChance
var customImg
var customImgURL

// Function to load settings from Chrome storage
function loadSettings() {
    chrome.storage.local.get({
        extensionIsDisabled: false,
        appearChance: 1.00,
        flipChance: 0.25,
        overlayCounter: 0,
        customImg: false,
        customImgURL: '',
    }, function (data) {
        document.getElementById('disableExtension').checked = !data.extensionIsDisabled;
        document.getElementById('appearChance').value = data.appearChance * 100;
        document.getElementById('flipChance').value = data.flipChance * 100;
        document.getElementById('overlayCounter').textContent  = data.overlayCounter;
        document.getElementById('customImg').checked = data.customImg;
        document.getElementById('customImgURL').value = data.customImgURL;

        customImg = data.customImg;
        customImgURL = data.customImgURL;
    });
}

function updateCounterDisplay() {
    chrome.storage.local.get(['overlayCounter'], function(data) {
        document.getElementById('overlayCounter').textContent = data.overlayCounter || 0;
    });
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            chrome.storage.local.set({
                customImgURL: imageData
            }, function() {
                loadSettings();
                // Refresh current tab
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.reload(tabs[0].id);
                });
            });
        };
        reader.readAsDataURL(file);
    }
}

function saveSettings() {
    const data = {
        extensionIsDisabled: !document.getElementById('disableExtension').checked,
        appearChance: parseFloat(document.getElementById('appearChance').value) / 100,
        flipChance: parseFloat(document.getElementById('flipChance').value) / 100,
        customImg: document.getElementById('customImg').checked,
        customImgURL: document.getElementById('customImgURL').value,
    };

    chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving settings:", chrome.runtime.lastError);
        } else {
            console.log("Settings saved successfully.");
        }
    });

    // Get the page and refresh it
    if (data.customImg && !data.customImgURL) {
        console.log("Not refreshing.");
    } else {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.reload(tabs[0].id);
        });
    }
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.overlayCounter) {
        updateCounterDisplay();
    }
});

function ChangeNameInHeading() {
    // Get the extension name
    let extensionName = chrome.runtime.getManifest().name;

    // Remove "youtube" (case-insensitive) from the extension name and trim
    extensionName = extensionName.replace(/youtube/i, '').trim();

    // Replace "MrBeastify" in the title with the cleaned extension name
    const titleElement = document.getElementById('extension-title');
    titleElement.textContent = titleElement.textContent.replace('TITLE', extensionName);
}

// Call loadSettings() when the page loads
document.addEventListener('DOMContentLoaded', loadSettings);

// Add input event listeners to all input fields to trigger autosave
document.getElementById('disableExtension').addEventListener('input', saveSettings);
document.getElementById('appearChance').addEventListener('input', saveSettings);
document.getElementById('flipChance').addEventListener('input', saveSettings);
document.getElementById('customImg').addEventListener('input', saveSettings);
document.getElementById('customImgURL').addEventListener('change', handleImageUpload);

document.addEventListener('DOMContentLoaded', ChangeNameInHeading);
