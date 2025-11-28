export function generateCode(config, selectedServices, banners = []) {
  const configString = JSON.stringify(config, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'");

  let servicesCode = '';
  if (selectedServices && selectedServices.length > 0) {
    servicesCode = '\n\n// Services activés\n' +
      selectedServices.map(service => {
        return `// tarteaucitron.user.${service} = 'YOUR_${service.toUpperCase()}_ID';`;
      }).join('\n');
  }

  let bannersCode = '';
  if (banners && banners.length > 0) {
    bannersCode = '\n\n' + generateBannersHTML(banners);
  }

  return `<!-- Biscuit - Bannière de consentement -->
<script src="https://cdn.jsdelivr.net/gh/AmauriC/tarteaucitron.js@1.27.1/tarteaucitron.min.js"></script>
<script>
tarteaucitron.init(${configString});${servicesCode}
</script>${bannersCode}`;
}

function generateBannersHTML(banners) {
  const styles = `
<style>
  .biscuit-banner {
    position: fixed;
    z-index: 999;
    background: #fff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 8px;
    border-radius: 8px;
  }
  .biscuit-banner.top {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
  .biscuit-banner.bottom {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
  .biscuit-banner.left {
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
  }
  .biscuit-banner.right {
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
  }
  .biscuit-banner img {
    display: block;
    max-width: 100%;
    height: auto;
  }
  @media (max-width: 768px) {
    .biscuit-banner.left,
    .biscuit-banner.right {
      left: 10px;
      right: 10px;
      top: auto;
      bottom: 80px;
      transform: none;
    }
  }
</style>`;

  const bannersHTML = banners
    .filter(b => b.is_active)
    .map(banner => `
<div class="biscuit-banner ${banner.position}">
  <a href="${banner.link_url}" target="_blank" rel="noopener noreferrer">
    <img src="${banner.image_url}" alt="Advertisement" />
  </a>
</div>`).join('');

  return styles + bannersHTML;
}

export function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return Promise.resolve();
    } catch (err) {
      document.body.removeChild(textarea);
      return Promise.reject(err);
    }
  }
}
