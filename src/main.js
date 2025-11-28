import './style.css';
import { Router } from './router.js';
import { onAuthStateChange, getCurrentUser } from './auth.js';
import { renderLogin } from './pages/Login.js';
import { renderRegister } from './pages/Register.js';
import { renderForgotPassword } from './pages/ForgotPassword.js';
import { renderResetPassword } from './pages/ResetPassword.js';
import { renderDashboard } from './pages/Dashboard.js';
import { renderAdminDashboard } from './pages/AdminDashboard.js';
import { insertPlatformAds } from './components/PlatformAds.js';

const routes = [
  { path: '/', handler: handleHome },
  { path: '/register', handler: renderRegister },
  { path: '/forgot-password', handler: renderForgotPassword },
  { path: '/reset-password', handler: renderResetPassword },
  { path: '/dashboard', handler: renderDashboard },
  { path: '/admin', handler: renderAdminDashboard },
  { path: '*', handler: handleHome }
];

async function handleHome() {
  try {
    const user = await getCurrentUser();
    if (user) {
      window.history.pushState(null, null, '/dashboard');
      await renderDashboard();
    } else {
      await renderLogin();
    }
  } catch (error) {
    await renderLogin();
  }
}

const router = new Router(routes);

onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    if (window.location.pathname === '/' || window.location.pathname === '/register') {
      window.history.pushState(null, null, '/dashboard');
      router.handleRoute();
    }
  } else if (event === 'SIGNED_OUT') {
    if (window.location.pathname !== '/' && window.location.pathname !== '/register' && window.location.pathname !== '/forgot-password') {
      window.history.pushState(null, null, '/');
      router.handleRoute();
    }
  }
});

router.start();

setTimeout(() => {
  insertPlatformAds();
}, 500);
