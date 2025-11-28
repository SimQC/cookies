import { signUp } from '../auth.js';
import { showToast } from '../utils.js';

export async function renderRegister() {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <h1>🍪 Biscuits</h1>
          <p>Créez votre compte</p>
        </div>

        <form id="register-form">
          <div class="form-group">
            <label class="form-label">Nom complet</label>
            <input
              type="text"
              class="form-input"
              id="fullName"
              placeholder="Jean Dupont"
              required
            />
          </div>

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
            Créer mon compte
          </button>
        </form>

        <div class="auth-links">
          <p>
            Déjà un compte ?
            <a href="/" class="auth-link" data-link>Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('register-form');
  const errorDiv = document.getElementById('error-message');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.innerHTML = '';

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
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
    submitBtn.textContent = 'Création du compte...';

    try {
      await signUp(email, password, fullName);
      showToast('Compte créé avec succès !', 'success');
    } catch (error) {
      errorDiv.innerHTML = `<p class="form-error">✗ ${error.message}</p>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Créer mon compte';
    }
  });
}
