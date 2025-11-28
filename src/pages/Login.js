import { signIn } from '../auth.js';
import { showToast } from '../utils.js';

export async function renderLogin() {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <h1>🍪 Biscuit</h1>
          <p>Gérez vos bannières de consentement</p>
        </div>

        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              type="email"
              class="form-input"
              id="email"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Mot de passe</label>
            <input
              type="password"
              class="form-input"
              id="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div id="error-message"></div>

          <button type="submit" class="btn btn-primary" id="submit-btn">
            Se connecter
          </button>
        </form>

        <div class="auth-links">
          <p>
            <a href="/forgot-password" class="auth-link" data-link>Mot de passe oublié ?</a>
          </p>
          <p style="margin-top: 0.75rem;">
            Pas encore de compte ?
            <a href="/register" class="auth-link" data-link>S'inscrire</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  const errorDiv = document.getElementById('error-message');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.innerHTML = '';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion...';

    try {
      await signIn(email, password);
      showToast('Connexion réussie !', 'success');
      window.history.pushState(null, null, '/dashboard');
      const event = new PopStateEvent('popstate');
      window.dispatchEvent(event);
    } catch (error) {
      errorDiv.innerHTML = `<p class="form-error">✗ ${error.message}</p>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Se connecter';
    }
  });
}
