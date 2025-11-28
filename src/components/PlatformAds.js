import { getPlatformAds, trackAdView, trackAdClick, isAdmin } from '../platformAds.js';

let currentAdIndex = 0;
let allAds = [];
let rotationInterval = null;
let trackedViews = new Set();
let userIsAdmin = false;

export async function insertPlatformAds() {
  const adsContainer = document.querySelector('#platform-ads-container');
  if (!adsContainer) {
    return;
  }

  if (rotationInterval) {
    clearInterval(rotationInterval);
    rotationInterval = null;
  }

  try {
    userIsAdmin = await isAdmin();
    allAds = await getPlatformAds();
    if (allAds.length === 0) {
      adsContainer.innerHTML = '';
      return;
    }

    currentAdIndex = Math.floor(Math.random() * allAds.length);

    const bannerContainer = document.createElement('div');
    bannerContainer.className = 'biscuits-ad-banner';
    adsContainer.innerHTML = '';
    adsContainer.appendChild(bannerContainer);

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

  if (!userIsAdmin && !trackedViews.has(ad.id)) {
    trackAdView(ad.id);
    trackedViews.add(ad.id);
  }

  container.innerHTML = `
    <a href="${ad.link_url}" target="_blank" rel="noopener noreferrer" data-ad-id="${ad.id}" class="ad-link">
      <img src="${ad.image_url}" alt="${ad.title}" />
    </a>
  `;

  const adLink = container.querySelector('.ad-link');
  if (adLink) {
    adLink.addEventListener('click', () => {
      if (!userIsAdmin) {
        trackAdClick(ad.id);
      }
    });
  }
}
