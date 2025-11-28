import { getPlatformAds } from '../platformAds.js';

export async function renderPlatformAds(position = 'bottom') {
  try {
    const ads = await getPlatformAds();
    if (ads.length === 0) return '';

    const filteredAds = ads.filter(ad => ad.position === position);
    if (filteredAds.length === 0) return '';

    return filteredAds.map(ad => `
      <div class="biscuits-ad" data-ad-id="${ad.id}">
        <a href="${ad.link_url}" target="_blank" rel="noopener noreferrer">
          <img src="${ad.image_url}" alt="${ad.title}" />
        </a>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading platform ads:', error);
    return '';
  }
}

export async function insertPlatformAds() {
  const appContainer = document.querySelector('.app-container');
  if (!appContainer) {
    console.log('No .app-container found');
    return;
  }

  // Remove existing ads
  const existingAds = document.querySelectorAll('.biscuits-ads-top, .biscuits-ads-bottom');
  existingAds.forEach(ad => ad.remove());

  const topAds = await renderPlatformAds('top');
  if (topAds) {
    const topContainer = document.createElement('div');
    topContainer.className = 'biscuits-ads-top';
    topContainer.innerHTML = topAds;
    appContainer.insertBefore(topContainer, appContainer.firstChild);
  }

  const bottomAds = await renderPlatformAds('bottom');
  if (bottomAds) {
    const bottomContainer = document.createElement('div');
    bottomContainer.className = 'biscuits-ads-bottom';
    bottomContainer.innerHTML = bottomAds;
    appContainer.appendChild(bottomContainer);
  }
}
