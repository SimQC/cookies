import { getCurrentUser, getProfile, signOut } from '../auth.js';
import { getAllPlatformAds, createPlatformAd, updatePlatformAd, deletePlatformAd, isAdmin, getGlobalStats } from '../platformAds.js';
import { showToast, formatDate } from '../utils.js';

let currentUser = null;
let currentProfile = null;
let platformAds = [];
let userIsAdmin = false;
let globalStats = null;

export async function renderAdminDashboard() {
  try {
    currentUser = await getCurrentUser();
    if (!currentUser) {
      window.history.pushState(null, null, '/');
      const event = new PopStateEvent('popstate');
      window.dispatchEvent(event);
      return;
    }

    userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      window.history.pushState(null, null, '/dashboard');
      const event = new PopStateEvent('popstate');
      window.dispatchEvent(event);
      return;
    }

    currentProfile = await getProfile(currentUser.id);
    platformAds = await getAllPlatformAds();
    globalStats = await getGlobalStats();

    render();
  } catch (error) {
    showToast('Erreur lors du chargement du dashboard admin', 'error');
    console.error(error);
  }
}

function render() {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="app-container">
      ${renderHeader()}
      ${renderAdminContent()}
    </div>
  `;

  attachEventListeners();
}

function renderHeader() {
  return `
    <header class="header">
      <div class="header-left">
        <div class="logo">🍪 Biscuits Admin</div>
      </div>
      <div class="header-right">
        <button class="btn btn-secondary btn-small" id="user-dashboard-btn" style="margin-right: 1rem;">
          Tableau de bord utilisateur
        </button>
        <span class="user-info">${currentProfile?.full_name || currentProfile?.email || ''} (Admin)</span>
        <button class="btn-logout" id="logout-btn">Déconnexion</button>
      </div>
    </header>
  `;
}

function renderAdminContent() {
  const totalViews = globalStats?.totalViews || 0;
  const totalClicks = globalStats?.totalClicks || 0;
  const averageCTR = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;

  return `
    <div class="panel" style="margin-bottom: 1.5rem;">
      <div class="panel-header">
        <h2 class="panel-title">📊 Statistiques globales de la plateforme</h2>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius); border: 1px solid var(--border);">
          <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">👥 Utilisateurs</div>
          <div style="font-size: 1.75rem; font-weight: 700; color: var(--chocolate);">
            ${globalStats?.totalUsers || 0}
          </div>
        </div>
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius); border: 1px solid var(--border);">
          <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">⚙️ Configurations</div>
          <div style="font-size: 1.75rem; font-weight: 700; color: var(--chocolate);">
            ${globalStats?.totalConfigurations || 0}
          </div>
        </div>
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius); border: 1px solid var(--border);">
          <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">📢 Bannières actives</div>
          <div style="font-size: 1.75rem; font-weight: 700; color: var(--chocolate);">
            ${platformAds.filter(ad => ad.is_active).length}
          </div>
        </div>
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius); border: 1px solid var(--border);">
          <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">👁️ Vues totales</div>
          <div style="font-size: 1.75rem; font-weight: 700; color: var(--chocolate);">
            ${totalViews.toLocaleString()}
          </div>
        </div>
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius); border: 1px solid var(--border);">
          <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">🖱️ Clics totaux</div>
          <div style="font-size: 1.75rem; font-weight: 700; color: var(--chocolate);">
            ${totalClicks.toLocaleString()}
          </div>
        </div>
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius); border: 1px solid var(--border);">
          <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">📈 CTR moyen</div>
          <div style="font-size: 1.75rem; font-weight: 700; color: var(--chocolate);">
            ${averageCTR}%
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">📢 Gestion des bannières publicitaires</h2>
        <button class="btn btn-primary btn-small" id="add-ad-btn">
          + Ajouter une bannière
        </button>
      </div>
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
        Ces bannières sont affichées de manière aléatoire et tournent automatiquement toutes les 5 secondes.
      </p>
      ${platformAds.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📢</div>
          <p>Aucune bannière publicitaire</p>
        </div>
      ` : `
        <div class="banner-list">
          ${platformAds.map(ad => `
            <div class="banner-item">
              <img src="${ad.image_url}" alt="${ad.title}" class="banner-preview" />
              <div class="banner-info">
                <div style="font-weight: 600; color: var(--chocolate); margin-bottom: 0.25rem;">
                  ${ad.title}
                </div>
                <span class="banner-position" style="background: ${ad.is_active ? '#16a34a' : '#dc2626'}; color: white;">
                  ${ad.is_active ? 'Active' : 'Inactive'}
                </span>
                <a href="${ad.link_url}" target="_blank" class="banner-link">
                  ${ad.link_url}
                </a>
                <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                  👁️ ${ad.views || 0} vues • 🖱️ ${ad.clicks || 0} clics • CTR: ${ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(2) : 0}%
                </div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">
                  Créée ${formatDate(ad.created_at)}
                </div>
              </div>
              <div class="banner-actions">
                <button class="btn-icon" data-edit-ad="${ad.id}" title="Modifier">
                  ✏️
                </button>
                <button class="btn-icon" data-toggle-ad="${ad.id}" title="${ad.is_active ? 'Désactiver' : 'Activer'}">
                  ${ad.is_active ? '👁️' : '🚫'}
                </button>
                <button class="btn-icon" data-delete-ad="${ad.id}" title="Supprimer">
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

  const userDashboardBtn = document.getElementById('user-dashboard-btn');
  if (userDashboardBtn) {
    userDashboardBtn.addEventListener('click', () => {
      window.history.pushState(null, null, '/dashboard');
      const event = new PopStateEvent('popstate');
      window.dispatchEvent(event);
    });
  }

  const addAdBtn = document.getElementById('add-ad-btn');
  if (addAdBtn) {
    addAdBtn.addEventListener('click', () => showAdModal());
  }

  document.querySelectorAll('[data-edit-ad]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const adId = e.currentTarget.dataset.editAd;
      const ad = platformAds.find(a => a.id === adId);
      if (ad) showAdModal(ad);
    });
  });

  document.querySelectorAll('[data-toggle-ad]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const adId = e.currentTarget.dataset.toggleAd;
      const ad = platformAds.find(a => a.id === adId);
      if (ad) {
        try {
          await updatePlatformAd(adId, { is_active: !ad.is_active });
          showToast(`Bannière ${ad.is_active ? 'désactivée' : 'activée'}`, 'success');
          await renderAdminDashboard();
        } catch (error) {
          showToast('Erreur lors de la modification', 'error');
        }
      }
    });
  });

  document.querySelectorAll('[data-delete-ad]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const adId = e.currentTarget.dataset.deleteAd;
      if (confirm('Supprimer cette bannière publicitaire ?')) {
        try {
          await deletePlatformAd(adId);
          showToast('Bannière supprimée', 'success');
          await renderAdminDashboard();
        } catch (error) {
          showToast('Erreur lors de la suppression', 'error');
        }
      }
    });
  });
}

function showAdModal(ad = null) {
  const isEdit = !!ad;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">${isEdit ? 'Modifier' : 'Ajouter'} une bannière publicitaire</h2>
        <button class="modal-close">×</button>
      </div>
      <form id="ad-form">
        <div class="form-group">
          <label class="form-label">Titre</label>
          <input
            type="text"
            class="form-input"
            id="ad-title"
            placeholder="Nom de la bannière"
            value="${ad?.title || ''}"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label">URL de l'image</label>
          <input
            type="url"
            class="form-input"
            id="ad-image-url"
            placeholder="https://example.com/banner.gif"
            value="${ad?.image_url || ''}"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label">URL de destination</label>
          <input
            type="url"
            class="form-input"
            id="ad-link-url"
            placeholder="https://example.com"
            value="${ad?.link_url || ''}"
            required
          />
        </div>
        <div class="form-group">
          <label class="checkbox-wrapper">
            <input
              type="checkbox"
              class="checkbox-input"
              id="ad-active"
              ${ad?.is_active !== false ? 'checked' : ''}
            />
            <span class="option-label">Bannière active</span>
          </label>
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

  modal.querySelector('#ad-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const adData = {
      title: document.getElementById('ad-title').value,
      image_url: document.getElementById('ad-image-url').value,
      link_url: document.getElementById('ad-link-url').value,
      is_active: document.getElementById('ad-active').checked
    };

    try {
      if (isEdit) {
        await updatePlatformAd(ad.id, adData);
        showToast('Bannière modifiée !', 'success');
      } else {
        await createPlatformAd(adData);
        showToast('Bannière ajoutée !', 'success');
      }
      modal.remove();
      await renderAdminDashboard();
    } catch (error) {
      showToast('Erreur lors de l\'enregistrement', 'error');
      console.error(error);
    }
  });
}
