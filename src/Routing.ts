interface DRouteState {
  pattern: string;
  params: any;
}

namespace dcore {
  "use strict";

  import plugin = routing;

  export namespace hooks {
    export const ROUTING_REGISTER = "routing.register";
    export const ROUTING_START = "routing.start";
  }

  export class Routing {

    defaultUrl: string = null;
    private core: DCore;
    private routes: plugin.Route[] = [];
    private urlHash: plugin.UrlHash = new plugin.UrlHash();
    private currentRoute: plugin.Route;

    constructor(core: DCore) {
      this.core = core;
    }

    /**
     *  Registers a route by given url pattern.
     *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
     *  Dynamic route param can be registered with {yourParam}.
     */
    register(pattern: string, callback: (routeParams: any, currentPattern?: string) => void): void {
      if (this.routes.some(r => r.pattern === pattern)) {
        throw new Error("register(): Route " + pattern + " has been already registered.");
      }

      this.core.pipeline.pipe(
        hooks.ROUTING_REGISTER,
        this.__register,
        this,
        pattern, callback);
    }

    /**
     *  Starts hash url if such is registered, if not, it starts the default one.
     */
    startRoute(hash: string): void {
      this.core.pipeline.pipe(
        hooks.ROUTING_START,
        this.__startRoute,
        this,
        hash);
    }

    current(): DRouteState {
      return {
        pattern: this.currentRoute ? this.currentRoute.pattern : null,
        params: this.currentRoute ? this.currentRoute.params : null
      };
    }

    /**
     *  Returns all registered patterns.
     */
    patterns(): string[] {
      return this.routes.map(route => route.pattern);
    }

    /**
     *  Determines if there are any registered routes.
     */
    any(): boolean {
      return this.routes.length > 0;
    }

    private __register(pattern: string, callback: (routeParams: any, currentPattern?: string) => void): void {
      this.routes.push(new plugin.Route(pattern, callback));
    }

    private __startRoute(hash: string): void {
      this.urlHash.url = hash;
      this.currentRoute = this.__findRoute();
      if (this.currentRoute) {
        this.currentRoute.start(this.urlHash);
        return;
      }

      if (typeof this.defaultUrl === "string") {
        this.__startDefaultRoute(hash);
      } else {
        console.warn("No route matches " + hash);
      }
    }

    private __findRoute(): plugin.Route {
      for (let i = 0, len = this.routes.length; i < len; i++) {
        let route = this.routes[i];
        if (route.matches(this.urlHash)) {
          return route;
        }
      }

      return null;
    }

    private __startDefaultRoute(invalidHash: string): void {
      window.history.replaceState(
        null,
        null,
        window.location.pathname + "#" + this.defaultUrl
      );

      this.urlHash.url = this.defaultUrl;
      this.currentRoute = this.__findRoute();
      if (this.currentRoute) {
        this.currentRoute.start(this.urlHash);
      } else {
        console.warn("No route handler for " + invalidHash);
      }
    }
  }
}