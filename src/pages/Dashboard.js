import { getCurrentUser, getProfile, signOut } from '../auth.js';
import {
  getConfigurations,
  getConfiguration,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner
} from '../database.js';
import { defaultConfig, configOptions } from '../defaultConfig.js';
import { availableServices, serviceCategories } from '../services.js';
import { generateCode } from '../codeGenerator.js';
import { showToast, formatDate, copyToClipboard, escapeHtml } from '../utils.js';

let currentUser = null;
let currentProfile = null;
let configurations = [];
let selectedConfigId = null;
let currentConfig = { ...defaultConfig };
let selectedServices = [];
let currentBanners = [];
let activeTab = 'config';

export async function renderDashboard() {
  try {
    currentUser = await getCurrentUser();
    if (!currentUser) {
      window.history.pushState(null, null, '/');
      const event = new PopStateEvent('popstate');
      window.dispatchEvent(event);
      return;
    }

    currentProfile = await getProfile(currentUser.id);
    configurations = await getConfigurations(currentUser.id);

    if (configurations.length > 0 && !selectedConfigId) {
      selectedConfigId = configurations[0].id;
      await loadConfiguration(selectedConfigId);
    }

    render();
  } catch (error) {
    showToast('Erreur lors du chargement du dashboard', 'error');
    console.error(error);
  }
}

function render() {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="app-container">
      ${renderHeader()}
      ${configurations.length === 0 ? renderEmptyState() : renderDashboardContent()}
    </div>
  `;

  attachEventListeners();
}

function renderHeader() {
  return `
    <header class="header">
      <div class="header-left">
        <div class="logo">🍪 Biscuit</div>
      </div>
      <div class="header-right">
        <span class="user-info">${currentProfile?.full_name || currentProfile?.email || ''}</span>
        <button class="btn-logout" id="logout-btn">Déconnexion</button>
      </div>
    </header>
  `;
}

function renderEmptyState() {
  return `
    <div class="panel">
      <div class="empty-state">
        <div class="empty-state-icon">🍪</div>
        <h2>Bienvenue sur Biscuit !</h2>
        <p style="margin: 1rem 0 2rem;">Créez votre première configuration de bannière de consentement</p>
        <button class="btn btn-primary btn-small" id="create-first-config">
          Créer ma première configuration
        </button>
      </div>
    </div>
  `;
}

function renderDashboardContent() {
  return `
    <div class="dashboard-grid">
      <div class="sidebar">
        ${renderConfigsList()}
      </div>
      <div class="main-content">
        ${renderTabs()}
        ${renderTabContent()}
      </div>
    </div>
  `;
}

function renderConfigsList() {
  return `
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">Mes configurations</h2>
      </div>
      <div class="config-list">
        ${configurations.map(config => `
          <div
            class="config-item ${config.id === selectedConfigId ? 'active' : ''}"
            data-config-id="${config.id}"
          >
            <div class="config-item-name">${config.name}</div>
            <div class="config-item-date">${formatDate(config.created_at)}</div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-new-config" id="new-config-btn">
        + Nouvelle configuration
      </button>
    </div>
  `;
}

function renderTabs() {
  return `
    <div class="tabs">
      <button class="tab ${activeTab === 'config' ? 'active' : ''}" data-tab="config">
        ⚙️ Configuration
      </button>
      <button class="tab ${activeTab === 'services' ? 'active' : ''}" data-tab="services">
        🔌 Services
      </button>
      <button class="tab ${activeTab === 'banners' ? 'active' : ''}" data-tab="banners">
        📢 Bannières publicitaires
      </button>
      <button class="tab ${activeTab === 'code' ? 'active' : ''}" data-tab="code">
        💻 Code d'intégration
      </button>
    </div>
  `;
}

function renderTabContent() {
  const config = configurations.find(c => c.id === selectedConfigId);
  if (!config) return '';

  switch (activeTab) {
    case 'config':
      return renderConfigTab();
    case 'services':
      return renderServicesTab();
    case 'banners':
      return renderBannersTab();
    case 'code':
      return renderCodeTab();
    default:
      return '';
  }
}

function renderConfigTab() {
  return `
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">⚙️ Configuration</h2>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-small" id="rename-config-btn">
            Renommer
          </button>
          <button class="btn btn-danger btn-small" id="delete-config-btn">
            Supprimer
          </button>
        </div>
      </div>
      <div class="scrollable">
        ${configOptions.map(section => `
          <div class="section">
            <h3 class="section-title">${section.section}</h3>
            <div class="option-group">
              ${section.options.map(option => renderOption(option)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
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

function renderServicesTab() {
  return `
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">🔌 Services</h2>
      </div>
      <div class="scrollable">
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
      </div>
    </div>
  `;
}

function renderBannersTab() {
  return `
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">📢 Bannières publicitaires</h2>
        <button class="btn btn-primary btn-small" id="add-banner-btn">
          + Ajouter une bannière
        </button>
      </div>
      ${currentBanners.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📢</div>
          <p>Aucune bannière publicitaire</p>
          <p style="font-size: 0.875rem; color: var(--text-tertiary); margin-top: 0.5rem;">
            Ajoutez des bannières pour monétiser votre site
          </p>
        </div>
      ` : `
        <div class="banner-list">
          ${currentBanners.map(banner => `
            <div class="banner-item">
              <img src="${banner.image_url}" alt="Banner" class="banner-preview" />
              <div class="banner-info">
                <span class="banner-position">${banner.position}</span>
                <a href="${banner.link_url}" target="_blank" class="banner-link">
                  ${banner.link_url}
                </a>
              </div>
              <div class="banner-actions">
                <button class="btn-icon" data-edit-banner="${banner.id}" title="Modifier">
                  ✏️
                </button>
                <button class="btn-icon" data-delete-banner="${banner.id}" title="Supprimer">
                  🗑️
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function renderCodeTab() {
  const config = configurations.find(c => c.id === selectedConfigId);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const scriptUrl = `${supabaseUrl}/functions/v1/biscuit?id=${config.id}`;

  return `
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">💻 Code d'intégration</h2>
      </div>

      <div class="code-instructions">
        <h3>Comment intégrer Biscuit sur votre site</h3>
        <ol>
          <li>Copiez le code ci-dessous</li>
          <li>Collez-le juste avant la balise <code>&lt;/head&gt;</code> de votre site</li>
          <li>C'est tout ! Votre bannière de consentement est maintenant active</li>
        </ol>
        <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-secondary);">
          💡 Le code est hébergé sur nos serveurs et se met à jour automatiquement avec vos modifications
        </p>
      </div>

      <div class="code-display">
        <code id="hosted-code">${escapeHtml(`<script src="${scriptUrl}"></script>`)}</code>
      </div>

      <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
        <button class="btn btn-primary" id="copy-hosted-code-btn">
          📋 Copier le code
        </button>
      </div>

      <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border);">
        <h3 style="color: var(--chocolate); margin-bottom: 1rem;">Code complet (sans hébergement)</h3>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
          Si vous préférez héberger le code vous-même, voici la version complète :
        </p>
        <div class="code-display">
          <code id="full-code">${escapeHtml(generateCode(currentConfig, selectedServices, currentBanners))}</code>
        </div>
        <button class="btn btn-secondary" id="copy-full-code-btn" style="margin-top: 1rem;">
          📋 Copier le code complet
        </button>
      </div>
    </div>
  `;
}

async function loadConfiguration(configId) {
  try {
    const config = await getConfiguration(configId);
    if (config) {
      selectedConfigId = config.id;
      currentConfig = config.config_data || { ...defaultConfig };
      selectedServices = config.selected_services || [];
      currentBanners = await getBanners(config.id);
    }
  } catch (error) {
    showToast('Erreur lors du chargement de la configuration', 'error');
    console.error(error);
  }
}

function attachEventListeners() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut();
      window.history.pushState(null, null, '/');
      const event = new PopStateEvent('popstate');
      window.dispatchEvent(event);
    });
  }

  const createFirstBtn = document.getElementById('create-first-config');
  if (createFirstBtn) {
    createFirstBtn.addEventListener('click', () => showCreateConfigModal());
  }

  const newConfigBtn = document.getElementById('new-config-btn');
  if (newConfigBtn) {
    newConfigBtn.addEventListener('click', () => showCreateConfigModal());
  }

  document.querySelectorAll('.config-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      const configId = e.currentTarget.dataset.configId;
      await loadConfiguration(configId);
      render();
    });
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      activeTab = e.currentTarget.dataset.tab;
      render();
    });
  });

  const renameBtn = document.getElementById('rename-config-btn');
  if (renameBtn) {
    renameBtn.addEventListener('click', () => showRenameConfigModal());
  }

  const deleteBtn = document.getElementById('delete-config-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => showDeleteConfigModal());
  }

  document.querySelectorAll('.checkbox-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      const key = e.target.dataset.key;
      currentConfig[key] = e.target.checked;
      await saveCurrentConfig();
    });
  });

  document.querySelectorAll('.input-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const key = e.target.dataset.key;
      currentConfig[key] = e.target.value;
      await saveCurrentConfig();
    });
  });

  document.querySelectorAll('.input-text').forEach(input => {
    input.addEventListener('blur', async (e) => {
      const key = e.target.dataset.key;
      currentConfig[key] = e.target.value;
      await saveCurrentConfig();
    });
  });

  document.querySelectorAll('.service-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
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

      await saveCurrentConfig();
    });
  });

  const addBannerBtn = document.getElementById('add-banner-btn');
  if (addBannerBtn) {
    addBannerBtn.addEventListener('click', () => showBannerModal());
  }

  document.querySelectorAll('[data-edit-banner]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bannerId = e.currentTarget.dataset.editBanner;
      const banner = currentBanners.find(b => b.id === bannerId);
      if (banner) showBannerModal(banner);
    });
  });

  document.querySelectorAll('[data-delete-banner]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const bannerId = e.currentTarget.dataset.deleteBanner;
      if (confirm('Supprimer cette bannière ?')) {
        try {
          await deleteBanner(bannerId);
          currentBanners = currentBanners.filter(b => b.id !== bannerId);
          showToast('Bannière supprimée', 'success');
          render();
        } catch (error) {
          showToast('Erreur lors de la suppression', 'error');
        }
      }
    });
  });

  const copyHostedBtn = document.getElementById('copy-hosted-code-btn');
  if (copyHostedBtn) {
    copyHostedBtn.addEventListener('click', async () => {
      const config = configurations.find(c => c.id === selectedConfigId);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const scriptUrl = `${supabaseUrl}/functions/v1/biscuit?id=${config.id}`;
      const code = `<script src="${scriptUrl}"></script>`;
      try {
        await copyToClipboard(code);
        showToast('Code copié !', 'success');
      } catch (error) {
        showToast('Erreur lors de la copie', 'error');
      }
    });
  }

  const copyFullBtn = document.getElementById('copy-full-code-btn');
  if (copyFullBtn) {
    copyFullBtn.addEventListener('click', async () => {
      const code = generateCode(currentConfig, selectedServices, currentBanners);
      try {
        await copyToClipboard(code);
        showToast('Code copié !', 'success');
      } catch (error) {
        showToast('Erreur lors de la copie', 'error');
      }
    });
  }
}

async function saveCurrentConfig() {
  try {
    await updateConfiguration(selectedConfigId, {
      config_data: currentConfig,
      selected_services: selectedServices
    });
  } catch (error) {
    showToast('Erreur lors de la sauvegarde', 'error');
    console.error(error);
  }
}

function showCreateConfigModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Nouvelle configuration</h2>
        <button class="modal-close">×</button>
      </div>
      <form id="create-config-form">
        <div class="form-group">
          <label class="form-label">Nom de la configuration</label>
          <input
            type="text"
            class="form-input"
            id="config-name"
            placeholder="Ma configuration"
            required
          />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancel-btn">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#create-config-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('config-name').value;

    try {
      const newConfig = await createConfiguration(currentUser.id, {
        name,
        config_data: { ...defaultConfig },
        selected_services: []
      });

      configurations.push(newConfig);
      selectedConfigId = newConfig.id;
      await loadConfiguration(newConfig.id);
      showToast('Configuration créée !', 'success');
      modal.remove();
      render();
    } catch (error) {
      showToast('Erreur lors de la création', 'error');
      console.error(error);
    }
  });
}

function showRenameConfigModal() {
  const config = configurations.find(c => c.id === selectedConfigId);
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Renommer la configuration</h2>
        <button class="modal-close">×</button>
      </div>
      <form id="rename-config-form">
        <div class="form-group">
          <label class="form-label">Nom de la configuration</label>
          <input
            type="text"
            class="form-input"
            id="config-name"
            value="${config.name}"
            required
          />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancel-btn">Annuler</button>
          <button type="submit" class="btn btn-primary">Renommer</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#rename-config-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('config-name').value;

    try {
      await updateConfiguration(selectedConfigId, { name });
      const config = configurations.find(c => c.id === selectedConfigId);
      if (config) config.name = name;
      showToast('Configuration renommée !', 'success');
      modal.remove();
      render();
    } catch (error) {
      showToast('Erreur lors du renommage', 'error');
      console.error(error);
    }
  });
}

function showDeleteConfigModal() {
  if (configurations.length === 1) {
    showToast('Vous devez garder au moins une configuration', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Supprimer la configuration</h2>
        <button class="modal-close">×</button>
      </div>
      <p style="margin-bottom: 1.5rem;">Êtes-vous sûr de vouloir supprimer cette configuration ? Cette action est irréversible.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-btn">Annuler</button>
        <button type="button" class="btn btn-danger" id="confirm-btn">Supprimer</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#confirm-btn').addEventListener('click', async () => {
    try {
      await deleteConfiguration(selectedConfigId);
      configurations = configurations.filter(c => c.id !== selectedConfigId);
      selectedConfigId = configurations[0]?.id || null;
      if (selectedConfigId) {
        await loadConfiguration(selectedConfigId);
      }
      showToast('Configuration supprimée !', 'success');
      modal.remove();
      render();
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
      console.error(error);
    }
  });
}

function showBannerModal(banner = null) {
  const isEdit = !!banner;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">${isEdit ? 'Modifier' : 'Ajouter'} une bannière</h2>
        <button class="modal-close">×</button>
      </div>
      <form id="banner-form">
        <div class="form-group">
          <label class="form-label">URL de l'image</label>
          <input
            type="url"
            class="form-input"
            id="image-url"
            placeholder="https://example.com/banner.gif"
            value="${banner?.image_url || ''}"
            required
          />
          <div style="margin-top: 0.75rem;">
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Bannières suggérées :</p>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary btn-small use-banner-btn" data-banner-url="https://annuairelitteraire.com/wp-content/uploads/2025/07/banniere-idee-litteraire.gif" data-banner-link="https://ideelitteraire.com">
                Bannière 1
              </button>
              <button type="button" class="btn btn-secondary btn-small use-banner-btn" data-banner-url="https://annuairelitteraire.com/wp-content/uploads/2025/11/banniere-bd.gif" data-banner-link="https://simonlacroix.net/produit/bandes-annonces-litteraires/">
                Bannière 2
              </button>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">URL de destination</label>
          <input
            type="url"
            class="form-input"
            id="link-url"
            placeholder="https://example.com"
            value="${banner?.link_url || ''}"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label">Position</label>
          <select class="input-select" id="position">
            <option value="top" ${banner?.position === 'top' ? 'selected' : ''}>Haut</option>
            <option value="bottom" ${banner?.position === 'bottom' ? 'selected' : ''}>Bas</option>
            <option value="left" ${banner?.position === 'left' ? 'selected' : ''}>Gauche</option>
            <option value="right" ${banner?.position === 'right' ? 'selected' : ''}>Droite</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancel-btn">Annuler</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Modifier' : 'Ajouter'}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelectorAll('.use-banner-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bannerUrl = e.target.dataset.bannerUrl;
      const bannerLink = e.target.dataset.bannerLink;
      document.getElementById('image-url').value = bannerUrl;
      document.getElementById('link-url').value = bannerLink;
    });
  });

  modal.querySelector('#banner-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const bannerData = {
      config_id: selectedConfigId,
      image_url: document.getElementById('image-url').value,
      link_url: document.getElementById('link-url').value,
      position: document.getElementById('position').value,
      is_active: true,
      display_order: currentBanners.length
    };

    try {
      if (isEdit) {
        await updateBanner(banner.id, bannerData);
        const index = currentBanners.findIndex(b => b.id === banner.id);
        if (index !== -1) {
          currentBanners[index] = { ...currentBanners[index], ...bannerData };
        }
        showToast('Bannière modifiée !', 'success');
      } else {
        const newBanner = await createBanner(bannerData);
        currentBanners.push(newBanner);
        showToast('Bannière ajoutée !', 'success');
      }
      modal.remove();
      render();
    } catch (error) {
      showToast('Erreur lors de l\'enregistrement', 'error');
      console.error(error);
    }
  });
}
