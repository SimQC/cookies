export class Router {
  constructor(routes, onRouteChange = null) {
    this.routes = routes;
    this.currentRoute = null;
    this.onRouteChange = onRouteChange;

    window.addEventListener('popstate', () => this.handleRoute());
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-link]')) {
        e.preventDefault();
        this.navigate(e.target.href);
      }
    });
  }

  navigate(path) {
    window.history.pushState(null, null, path);
    this.handleRoute();
  }

  async handleRoute() {
    const path = window.location.pathname;
    const route = this.routes.find(r => r.path === path) || this.routes.find(r => r.path === '*');

    if (route) {
      this.currentRoute = route;

      const app = document.querySelector('#app');
      if (app) {
        app.style.opacity = '0';
        app.style.transition = 'opacity 0.2s ease-in-out';
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      await route.handler();

      if (this.onRouteChange) {
        await this.onRouteChange();
      }

      if (app) {
        requestAnimationFrame(() => {
          app.style.opacity = '1';
        });
      }
    }
  }

  start() {
    this.handleRoute();
  }
}
