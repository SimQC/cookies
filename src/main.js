import './style.css';
import { defaultConfig, configOptions } from './defaultConfig.js';
import { availableServices, serviceCategories } from './services.js';
import { generateCode, copyToClipboard } from './codeGenerator.js';

let currentConfig = { ...defaultConfig };
let selectedServices = [];

function init() {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="app-container">
      <header class="header">
        <h1>🍪 Tarteaucitron.js - Générateur de Bannière</h1>
        <p>Configurez votre bannière de consentement en quelques clics et obtenez le code prêt à l'emploi</p>
      </header>

      <div class="main-grid">
        <div class="config-section">
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">
                <span class="panel-icon">⚙️</span>
                Configuration
              </h2>
            </div>
            <div class="scrollable">
              ${renderConfigSections()}
            </div>
          </div>

          <div class="panel" style="margin-top: 2rem;">
            <div class="panel-header">
              <h2 class="panel-title">
                <span class="panel-icon">🔌</span>
                Services
              </h2>
            </div>
            <div class="scrollable">
              ${renderServices()}
            </div>
          </div>
        </div>

        <div class="code-section">
          <div class="panel code-output">
            <div class="panel-header">
              <h2 class="panel-title">
                <span class="panel-icon">💻</span>
                Code généré
              </h2>
            </div>
            <div class="code-container">
              <pre class="code-pre"><code id="generated-code">${escapeHtml(generateCode(currentConfig, selectedServices))}</code></pre>
            </div>
            <div class="code-actions">
              <button class="btn btn-primary" id="copy-btn">
                📋 Copier le code
              </button>
              <button class="btn btn-secondary" id="reset-btn">
                🔄 Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  attachEventListeners();
}

function renderConfigSections() {
  return configOptions.map(section => `
    <div class="section">
      <h3 class="section-title">${section.section}</h3>
      <div class="option-group">
        ${section.options.map(option => renderOption(option)).join('')}
      </div>
    </div>
  `).join('');
}

function renderOption(option) {
  const value = currentConfig[option.key];

  if (option.type === 'checkbox') {
    return `
      <div class="option-item">
        <label class="checkbox-wrapper">
          <input
            type="checkbox"
            class="checkbox-input"
            data-key="${option.key}"
            ${value ? 'checked' : ''}
          />
          <span class="option-label">${option.label}</span>
        </label>
        ${option.description ? `<p class="option-description">${option.description}</p>` : ''}
      </div>
    `;
  }

  if (option.type === 'select') {
    return `
      <div class="option-item">
        <label class="option-label">${option.label}</label>
        ${option.description ? `<p class="option-description">${option.description}</p>` : ''}
        <select class="input-select" data-key="${option.key}">
          ${option.options.map(opt => `
            <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
              ${opt.label}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  if (option.type === 'text') {
    return `
      <div class="option-item">
        <label class="option-label">${option.label}</label>
        ${option.description ? `<p class="option-description">${option.description}</p>` : ''}
        <input
          type="text"
          class="input-text"
          data-key="${option.key}"
          value="${value || ''}"
          placeholder="${option.placeholder || ''}"
        />
      </div>
    `;
  }

  return '';
}

function renderServices() {
  return `
    <div class="services-grid">
      ${serviceCategories.map(category => {
        const categoryServices = availableServices.filter(s => s.category === category.id);
        if (categoryServices.length === 0) return '';

        return `
          <div class="category-group">
            <div class="category-header">
              <span class="category-icon">${category.icon}</span>
              <span>${category.name}</span>
            </div>
            <div class="services-list">
              ${categoryServices.map(service => `
                <label class="service-item ${selectedServices.includes(service.id) ? 'selected' : ''}" data-service="${service.id}">
                  <input
                    type="checkbox"
                    class="service-checkbox"
                    data-service-id="${service.id}"
                    ${selectedServices.includes(service.id) ? 'checked' : ''}
                  />
                  <span class="service-name">${service.name}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function attachEventListeners() {
  document.querySelectorAll('.checkbox-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const key = e.target.dataset.key;
      currentConfig[key] = e.target.checked;
      updateCode();
    });
  });

  document.querySelectorAll('.input-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const key = e.target.dataset.key;
      currentConfig[key] = e.target.value;
      updateCode();
    });
  });

  document.querySelectorAll('.input-text').forEach(input => {
    input.addEventListener('input', (e) => {
      const key = e.target.dataset.key;
      currentConfig[key] = e.target.value;
      updateCode();
    });
  });

  document.querySelectorAll('.service-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const serviceId = e.target.dataset.serviceId;
      const serviceItem = e.target.closest('.service-item');

      if (e.target.checked) {
        if (!selectedServices.includes(serviceId)) {
          selectedServices.push(serviceId);
        }
        serviceItem.classList.add('selected');
      } else {
        selectedServices = selectedServices.filter(id => id !== serviceId);
        serviceItem.classList.remove('selected');
      }

      updateCode();
    });
  });

  document.getElementById('copy-btn').addEventListener('click', async () => {
    const code = generateCode(currentConfig, selectedServices);
    try {
      await copyToClipboard(code);
      showToast('Code copié dans le presse-papier !', 'success');
    } catch (err) {
      showToast('Erreur lors de la copie', 'error');
    }
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    currentConfig = { ...defaultConfig };
    selectedServices = [];
    init();
    showToast('Configuration réinitialisée', 'success');
  });
}

function updateCode() {
  const code = generateCode(currentConfig, selectedServices);
  document.getElementById('generated-code').textContent = code;
}

function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '✗'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

init();
