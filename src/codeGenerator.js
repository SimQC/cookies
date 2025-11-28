export function generateCode(config, selectedServices) {
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

  return `<!-- Biscuits - Bannière de consentement -->
<script src="https://cdn.jsdelivr.net/gh/AmauriC/tarteaucitron.js@1.27.1/tarteaucitron.min.js"></script>
<script>
tarteaucitron.init(${configString});${servicesCode}
</script>`;
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
