const imagesPath = "images/";
var useAlternativeImages
var extensionName = chrome.runtime.getManifest().name;

// Config
var extensionIsDisabled = false
var appearChance = 1.00//%
var flipChance = 0.50//%

// Apply the overlay
function applyOverlay(thumbnailElement, overlayImageURL, flip = false) {
    // Create a new img element for the overlay
    const overlayImage = document.createElement("img");
    overlayImage.id = extensionName;
    overlayImage.src = overlayImageURL;
    overlayImage.style.position = "absolute";
    overlayImage.style.top = overlayImage.style.left = "50%";
    overlayImage.style.width = "100%";
    overlayImage.style.transform = `translate(-50%, -50%) ${flip ? 'scaleX(-1)' : ''}`; // Center and flip the image
    overlayImage.style.zIndex = "0"; // Ensure overlay is on top but below the time indicator
    thumbnailElement.parentElement.insertBefore(overlayImage, thumbnailElement.nextSibling /*Makes sure the image doesn't cover any info, but still overlays the original thumbnail*/ );
};

function FindThumbnails() {
    var thumbnailImages = document.querySelectorAll("ytd-thumbnail a > yt-image > img.yt-core-image");
    var notificationImages = document.querySelectorAll('img.style-scope.yt-img-shadow[width="86"]');

    const allImages = [ // Put all the selected images into an array
        ...Array.from(thumbnailImages),
        ...Array.from(notificationImages),
    ];

    // Check whether the aspect ratio matches that of a thumbnail
    const targetAspectRatio = [16 / 9, 4 / 3];
    const errorMargin = 0.02; // Allows for 4:3, since YouTube is badly coded

    var listAllThumbnails = allImages.filter(image => {
        // Check if the height is not 0 before calculating the aspect ratio
        if (image.height === 0) {
            return false;
        }

        const aspectRatio = image.width / image.height;
        let isCorrectAspectRatio = (Math.abs(aspectRatio - targetAspectRatio[0]) < errorMargin) || (Math.abs(aspectRatio - targetAspectRatio[1]) < errorMargin);
        return isCorrectAspectRatio;
    });

    // Select all images from the recommended video screen
    var videowallImages = document.querySelectorAll(".ytp-videowall-still-image"); // Because youtube video wall images are not properly classified as images

    listAllThumbnails = listAllThumbnails.concat(Array.from(videowallImages));

    return listAllThumbnails.filter(image => {
        const parent = image.parentElement;

        // Checks whether it's a video preview
        const isVideoPreview = parent.closest("#video-preview") !== null || parent.tagName == "YTD-MOVING-THUMBNAIL-RENDERER"

        // Checks whether it's a chapter thumbnail
        const isChapter = parent.closest("#endpoint") !== null

        // Check if thumbnails have already been processed
        const processed = Array.from(parent.children).filter(child => {
            const alreadyHasAThumbnail =
                child.id && // Child has ID
                child.id.includes(extensionName);

            return (
                alreadyHasAThumbnail
                || isVideoPreview
                || isChapter
            )
        });

        return processed.length == 0;
    });
}

// Looks for all thumbnails and applies overlay
function applyOverlayToThumbnails() {
    thumbnailElements = FindThumbnails()

    // Apply overlay to each thumbnail
    thumbnailElements.forEach((thumbnailElement) => {
        // Apply overlay and add to processed thumbnails
        const loops = Math.random() > 0.001 ? 1 : 20; // Easter egg

        for (let i = 0; i < loops; i++) {
            // Determine the image URL and whether it should be flipped
            let flip = Math.random() < flipChance;
            const overlayImageURL = chrome.runtime.getURL(`images/1.png`); // Just set the url to "" if we don't want MrBeast to appear lol

            applyOverlay(thumbnailElement, overlayImageURL, flip);
        }
    });

}

async function LoadConfig() {
    const df /* default */ = {
        extensionIsDisabled: extensionIsDisabled,
        appearChance: appearChance,
        flipChance: flipChance
    }

    try {
        const config = await new Promise((resolve, reject) => {
            chrome.storage.local.get({
                extensionIsDisabled,
                appearChance,
                flipChance
            }, (result) => {
                chrome.runtime.lastError ? // Check for errors
                    reject(chrome.runtime.lastError) : // Reject if errors
                    resolve(result) // Resolve if no errors
            });
        });

        // Initialize variables based on loaded configuration
        extensionIsDisabled = config.extensionIsDisabled || df.extensionIsDisabled;
        appearChance = config.appearChance || df.appearChance;
        flipChance = config.flipChance || df.flipChance;

        if (Object.keys(config).length === 0 && config.constructor === Object /* config doesn't exist */) {
            await new Promise((resolve, reject) => {
                chrome.storage.local.set(df, () => {
                    chrome.runtime.lastError ? // Check for errors
                        reject(chrome.runtime.lastError) : // Reject if errors
                        resolve() // Resolve if no errors
                })
            }
            )
        }
    } catch (error) { console.error("Guhh?? Error loading configuration:", error); }
}

async function Main() {
    await LoadConfig()

    if (extensionIsDisabled) {
        console.log(`${extensionName} is disabled.`)
        return // Exit the function if Fabiofy is disabled
    }
    setInterval(applyOverlayToThumbnails, 100);
}

Main()