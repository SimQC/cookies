import { getPlatformAds } from '../platformAds.js';

let currentAdIndex = 0;
let allAds = [];
let rotationInterval = null;

export async function insertPlatformAds() {
  const header = document.querySelector('.header');
  if (!header) {
    return;
  }

  const existingAd = document.querySelector('.biscuits-ad-banner');
  if (existingAd) {
    existingAd.remove();
  }

  if (rotationInterval) {
    clearInterval(rotationInterval);
    rotationInterval = null;
  }

  try {
    allAds = await getPlatformAds();
    if (allAds.length === 0) return;

    const bannerContainer = document.createElement('div');
    bannerContainer.className = 'biscuits-ad-banner';

    if (header.nextSibling) {
      header.parentNode.insertBefore(bannerContainer, header.nextSibling);
    } else {
      header.parentNode.appendChild(bannerContainer);
    }

    showCurrentAd(bannerContainer);

    if (allAds.length > 1) {
      rotationInterval = setInterval(() => {
        currentAdIndex = (currentAdIndex + 1) % allAds.length;
        showCurrentAd(bannerContainer);
      }, 5000);
    }
  } catch (error) {
    console.error('Error loading platform ads:', error);
  }
}

function showCurrentAd(container) {
  if (!allAds.length) return;

  const ad = allAds[currentAdIndex];
  container.innerHTML = `
    <a href="${ad.link_url}" target="_blank" rel="noopener noreferrer">
      <img src="${ad.image_url}" alt="${ad.title}" />
    </a>
  `;
}
