export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentRoute = null;

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
      await route.handler();
    }
  }

  start() {
    this.handleRoute();
  }
}
