import { updatePassword } from '../auth.js';
import { showToast } from '../utils.js';

export async function renderResetPassword() {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <h1>🍪 Biscuit</h1>
          <p>Nouveau mot de passe</p>
        </div>

        <form id="reset-form">
          <div class="form-group">
            <label class="form-label">Nouveau mot de passe</label>
            <input
              type="password"
              class="form-input"
              id="password"
              placeholder="••••••••"
              required
              minlength="6"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Confirmer le mot de passe</label>
            <input
              type="password"
              class="form-input"
              id="confirmPassword"
              placeholder="••••••••"
              required
              minlength="6"
            />
          </div>

          <div id="error-message"></div>

          <button type="submit" class="btn btn-primary" id="submit-btn">
            Réinitialiser le mot de passe
          </button>
        </form>

        <div class="auth-links">
          <p>
            <a href="/" class="auth-link" data-link>← Retour à la connexion</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('reset-form');
  const errorDiv = document.getElementById('error-message');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.innerHTML = '';

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      errorDiv.innerHTML = `<p class="form-error">✗ Les mots de passe ne correspondent pas</p>`;
      return;
    }

    if (password.length < 6) {
      errorDiv.innerHTML = `<p class="form-error">✗ Le mot de passe doit contenir au moins 6 caractères</p>`;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Réinitialisation...';

    try {
      await updatePassword(password);
      showToast('Mot de passe modifié avec succès !', 'success');
      window.history.pushState(null, null, '/dashboard');
      const event = new PopStateEvent('popstate');
      window.dispatchEvent(event);
    } catch (error) {
      errorDiv.innerHTML = `<p class="form-error">✗ ${error.message}</p>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Réinitialiser le mot de passe';
    }
  });
}
