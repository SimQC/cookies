import { getPlatformAds } from '../platformAds.js';

export async function renderPlatformAds() {
  try {
    const ads = await getPlatformAds();
    if (ads.length === 0) return '';

    return ads.map(ad => `
      <div class="biscuits-ad biscuits-ad-${ad.position}" data-ad-id="${ad.id}">
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

export function initPlatformAds() {
  renderPlatformAds().then(adsHTML => {
    if (adsHTML) {
      const container = document.createElement('div');
      container.id = 'biscuits-ads-container';
      container.innerHTML = adsHTML;
      document.body.appendChild(container);
    }
  });
}
