export class Router {
  constructor(routes, onRouteChange = null) {
    this.routes = routes;
    this.currentRoute = null;
    this.onRouteChange = onRouteChange;
    this.skipTransition = false;

    window.addEventListener('popstate', () => this.handleRoute());
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-link]')) {
        e.preventDefault();
        this.navigate(e.target.href);
      }
    });
  }

  async navigate(path, skipTransition = false) {
    this.skipTransition = skipTransition;
    window.history.pushState(null, null, path);
    await this.handleRoute();
  }

  async handleRoute() {
    const path = window.location.pathname;
    const route = this.routes.find(r => r.path === path) || this.routes.find(r => r.path === '*');

    if (route) {
      this.currentRoute = route;

      const app = document.querySelector('#app');

      if (app && !this.skipTransition) {
        app.style.transition = 'opacity 0.15s ease-out';
        app.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      await route.handler();

      if (this.onRouteChange) {
        await this.onRouteChange();
      }

      if (app) {
        if (!this.skipTransition) {
          app.style.transition = 'opacity 0.15s ease-in';
          requestAnimationFrame(() => {
            app.style.opacity = '1';
          });
        } else {
          app.style.opacity = '1';
        }
      }

      this.skipTransition = false;
    }
  }

  start() {
    this.handleRoute();
  }
}
