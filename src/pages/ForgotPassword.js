import { resetPassword } from '../auth.js';
import { showToast } from '../utils.js';

export async function renderForgotPassword() {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <h1>🍪 Biscuit</h1>
          <p>Réinitialisation du mot de passe</p>
        </div>

        <form id="forgot-form">
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

          <div id="message"></div>

          <button type="submit" class="btn btn-primary" id="submit-btn">
            Envoyer le lien de réinitialisation
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

  const form = document.getElementById('forgot-form');
  const messageDiv = document.getElementById('message');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageDiv.innerHTML = '';

    const email = document.getElementById('email').value;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';

    try {
      await resetPassword(email);
      messageDiv.innerHTML = `<p class="form-success">✓ Un email de réinitialisation a été envoyé à ${email}</p>`;
      showToast('Email envoyé avec succès !', 'success');
      submitBtn.textContent = 'Email envoyé';
    } catch (error) {
      messageDiv.innerHTML = `<p class="form-error">✗ ${error.message}</p>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer le lien de réinitialisation';
    }
  });
}
