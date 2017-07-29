interface DRouteState {
    pattern: string;
    params: any;
}

namespace dcore {
    "use strict";

    import plugin = routing;

    export class Routing {

        defaultUrl: string = null;
        private routes: plugin.Route[] = [];
        private urlHash: plugin.UrlHash = new plugin.UrlHash();
        private currentRoute: plugin.Route;

        /**
         *  Registers a route by given url pattern.
         *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
         *  Dynamic route param can be registered with {yourParam}.
         */
        register(pattern: string, callback: (routeParams: any, currentPattern?: string) => void): void {
            if (this.routes.some(r => r.pattern === pattern)) {
                throw new Error("register(): Route " + pattern + " has been already registered.");
            }

            this.routes.push(new plugin.Route(pattern, callback));
        }

        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        startRoute(hash: string): void {
            this.urlHash.value = hash;
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

        getCurrentRoute(): DRouteState {
            return {
                pattern: this.currentRoute ? this.currentRoute.pattern : null,
                params: this.currentRoute ? this.currentRoute.queryParams : null
            };
        }

        /**
         *  Returns all registered patterns.
         */
        getRoutes(): string[] {
            return this.routes.map(route => route.pattern);
        }

        /**
         *  Determines if there are any registered routes.
         */
        anyRoutes(): boolean {
            return this.routes.length > 0;
        }

        private __findRoute(): plugin.Route {
            for (let i = 0, len = this.routes.length; i < len; i++) {
                let route = this.routes[i];
                if (route.equals(this.urlHash)) {
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

            this.urlHash.value = this.defaultUrl;
            this.currentRoute = this.__findRoute();
            if (this.currentRoute) {
                this.currentRoute.start(this.urlHash);
            } else {
                console.warn("No route handler for " + invalidHash);
            }
        }
    }
}