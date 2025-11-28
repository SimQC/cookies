import { getCurrentUser, getProfile, signOut, updatePassword } from '../auth.js';
import {
  getConfigurations,
  getConfiguration,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration
} from '../database.js';
import { defaultConfig, configOptions } from '../defaultConfig.js';
import { availableServices, serviceCategories } from '../services.js';
import { generateCode } from '../codeGenerator.js';
import { showToast, formatDate, copyToClipboard, escapeHtml } from '../utils.js';
import { getPlatformAds, isAdmin } from '../platformAds.js';
import { insertPlatformAds } from '../components/PlatformAds.js';

let currentUser = null;
let currentProfile = null;
let configurations = [];
let selectedConfigId = null;
let currentConfig = { ...defaultConfig };
let selectedServices = [];
let platformAds = [];
let userIsAdmin = false;
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
    platformAds = await getPlatformAds();
    userIsAdmin = await isAdmin();

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
  insertPlatformAds();
}

function renderHeader() {
  return `
    <header class="header">
      <div class="header-left">
        <div class="logo">🍪 Biscuits</div>
      </div>
      <div class="header-right">
        ${userIsAdmin ? '<button class="btn btn-secondary btn-small" id="admin-dashboard-btn" style="margin-right: 1rem;">Admin</button>' : ''}
        <div class="user-menu">
          <button class="user-info" id="user-menu-btn">
            ${currentProfile?.full_name || currentProfile?.email || ''}
            <span style="margin-left: 0.5rem;">▼</span>
          </button>
          <div class="dropdown-menu" id="user-dropdown" style="display: none;">
            <button class="dropdown-item" id="change-password-btn">Changer le mot de passe</button>
            <button class="dropdown-item" id="logout-btn">Déconnexion</button>
          </div>
        </div>
      </div>
    </header>
  `;
}

function renderEmptyState() {
  return `
    <div class="panel">
      <div class="empty-state">
        <div class="empty-state-icon">🍪</div>
        <h2>Bienvenue sur Biscuits !</h2>
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
        <div id="platform-ads-container"></div>
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
        <h3>Comment intégrer Biscuits sur votre site</h3>
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
          <code id="full-code">${escapeHtml(generateCode(currentConfig, selectedServices))}</code>
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
    }
  } catch (error) {
    showToast('Erreur lors du chargement de la configuration', 'error');
    console.error(error);
  }
}

function attachEventListeners() {
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      userDropdown.style.display = 'none';
    });
  }

  const changePasswordBtn = document.getElementById('change-password-btn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      userDropdown.style.display = 'none';
      showChangePasswordModal();
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut();
      window.history.pushState(null, null, '/');
      const event = new PopStateEvent('popstate');
      window.dispatchEvent(event);
    });
  }

  const adminDashboardBtn = document.getElementById('admin-dashboard-btn');
  if (adminDashboardBtn) {
    adminDashboardBtn.addEventListener('click', () => {
      window.history.pushState(null, null, '/admin');
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
      const code = generateCode(currentConfig, selectedServices);
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

function showChangePasswordModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Changer le mot de passe</h2>
        <button class="modal-close">×</button>
      </div>
      <form id="change-password-form">
        <div class="form-group">
          <label class="form-label">Nouveau mot de passe</label>
          <input
            type="password"
            class="form-input"
            id="new-password"
            placeholder="Minimum 6 caractères"
            required
            minlength="6"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Confirmer le mot de passe</label>
          <input
            type="password"
            class="form-input"
            id="confirm-password"
            placeholder="Confirmez votre mot de passe"
            required
            minlength="6"
          />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancel-btn">Annuler</button>
          <button type="submit" class="btn btn-primary">Changer</button>
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

  modal.querySelector('#change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    try {
      await updatePassword(newPassword);
      showToast('Mot de passe changé avec succès !', 'success');
      modal.remove();
    } catch (error) {
      showToast('Erreur lors du changement de mot de passe', 'error');
      console.error(error);
    }
  });
}

