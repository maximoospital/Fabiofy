const imagesPath = "images/";
var useAlternativeImages
var extensionName = chrome.runtime.getManifest().name;

// Config
var extensionIsDisabled = false
var appearChance = 1.00//%
var flipChance = 0.50//%
var customImg = false
var customImgURL = ''

// Apply the overlay
function applyOverlay(thumbnailElement, overlayImageURL, flip = false) {
    // Create a new img element for the overlay
    const overlayImage = document.createElement("img");
    overlayImage.id = extensionName;
    overlayImage.src = overlayImageURL;
    overlayImage.style.position = "absolute";
    if (customImg){
        overlayImage.style.top = "50%";
        if (flip){
            overlayImage.style.left = "25%";
        } else {
            overlayImage.style.left = "75%";
        }
    } else {
        overlayImage.style.top = overlayImage.style.left = "50%";
    }
    overlayImage.style.height = "100%";
    overlayImage.style.width = "auto";
    overlayImage.style.objectFit = "contain";
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
    var overlays = 0;
    // Apply overlay to each thumbnail
    thumbnailElements.forEach((thumbnailElement) => {
        if(Math.random() < appearChance){
            overlays++;
            // Apply overlay and add to processed thumbnails
            const loops = Math.random() > 0.001 ? 1 : 20; // Easter egg
            for (let i = 0; i < loops; i++) {
                // Determine the image URL and whether it should be flipped
                let flip = Math.random() < flipChance;
                let overlayImageURL;
                if(customImg) {
                    overlayImageURL = customImgURL;
                } else {
                    overlayImageURL = chrome.runtime.getURL(`images/${Math.floor(Math.random() * 15) + 1}.png`);
                }
                applyOverlay(thumbnailElement, overlayImageURL, flip);    
        }
        }
    });
    chrome.storage.local.get('overlayCounter', function (result) {
        const overlayCounter = result.overlayCounter || 0;
        chrome.storage.local.set({ overlayCounter: overlayCounter + overlays });
    });
}

function applyOverlayToShorts() {
    const shorts = document.querySelectorAll('img.yt-core-image.ShortsLockupViewModelHostThumbnail');
    shorts.forEach((short) => {
        // Check if overlay already exists
        if (short.parentElement.querySelector(`#${extensionName}-shorts-overlay`)) {
            return;
        }

        // Create overlay
        const overlayImage = document.createElement("img");
        overlayImage.id = `${extensionName}-shorts-overlay`;
        overlayImage.src = chrome.runtime.getURL(`images/shorts.png`);
        overlayImage.style.position = "absolute";
        overlayImage.style.top = overlayImage.style.left = "50%";
        overlayImage.style.width = "100%";
        overlayImage.style.transform = `translate(-50%, -40%)`; // Center and flip the image
        overlayImage.style.zIndex = "16"; // Ensure overlay is on top but below the time indicator

        // In order to save memory, remove the overlay when it's covered by the thumbnail-container


        // Insert overlay in video
        short.parentElement.insertBefore(overlayImage, short.firstChild /*Makes sure the image doesn't cover any info, but still overlays the original thumbnail*/ );
    });
}

function handleIntersection(entries, observer) {
    entries.forEach(entry => {
        const overlay = entry.target.querySelector(`#${extensionName}-video-overlay`);
        if (overlay) {
            if (entry.isIntersecting) {
                overlay.style.display = 'block';
            } else {
                overlay.style.display = 'none';
            }
        }
    });
}

function recolorProgressBar(){
    // Find the element with the classes .ytp-cairo-refresh-signature-moments .ytp-play-progress 
    // Find the element with the classes .ytp-cairo-refresh-signature-moments .ytp-play-progress
    const progressBar = document.querySelector('.ytp-play-progress.ytp-swatch-background-color'); 
    if (progressBar){
        progressBar.style.background = 'linear-gradient(to right, #b127ff, #b127ff)';
        progressBar.style.backgroundColor = '#b127ff';
    };
}

function applyOverlayToVideos() {
    const videos = document.querySelectorAll('#inline-preview-player > div.html5-video-container');
    
    videos.forEach((video) => {
        // Check if overlay already exists
        if (video.parentElement.querySelector(`#${extensionName}-video-overlay`)) {
            return;
        }

        // Create overlay
        const overlayImage = document.createElement("img");
        overlayImage.id = `${extensionName}-video-overlay`;
        overlayImage.src = chrome.runtime.getURL(`images/animated.gif`);
        overlayImage.style.position = "absolute";
        overlayImage.style.top = overlayImage.style.left = "50%";
        overlayImage.style.width = "100%";
        overlayImage.style.transform = `translate(-50%, 0%)`; // Center and flip the image
        overlayImage.style.zIndex = "16"; // Ensure overlay is on top but below the time indicator
        // Insert overlay in video
        video.insertBefore(overlayImage, video.firstChild /*Makes sure the image doesn't cover any info, but still overlays the original thumbnail*/ );
    });
}

async function LoadConfig() {
    const df /* default */ = {
        extensionIsDisabled: extensionIsDisabled,
        appearChance: appearChance,
        flipChance: flipChance,
        customImg: customImg,
        customImgURL: customImgURL,
    }

    try {
        const config = await new Promise((resolve, reject) => {
            chrome.storage.local.get({
                extensionIsDisabled,
                appearChance,
                flipChance,
                customImg,
                customImgURL,
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
        customImg = config.customImg || df.customImg;
        customImgURL = config.customImgURL || df.customImgURL;

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
    recolorProgressBar();
    recolorLogo();
    if(!customImg){
        setInterval(applyOverlayToVideos, 100);
        setInterval(applyOverlayToShorts, 100);    
    }
}

Main()