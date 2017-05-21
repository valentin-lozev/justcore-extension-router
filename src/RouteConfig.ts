namespace dcore.plugins.routing {
    "use strict";

    function findRoute(): Route {
        for (let i = 0, len = this.routes.length; i < len; i++) {
            let route = this.routes[i];
            if (route.equals(this.urlHash)) {
                return route;
            }
        }

        return null;
    }

    function startDefaultRoute(invalidHash: string): void {
        window.history.replaceState(
            null,
            null,
            window.location.pathname + "#" + this.defaultUrl
        );

        this.urlHash.value = this.defaultUrl;
        this.currentRoute = findRoute.call(this);
        if (this.currentRoute) {
            this.currentRoute.start(this.urlHash);
        } else {
            console.warn("No route handler for " + invalidHash);
        }
    }

    /**
     *  @class RouteConfig - Handles window hash change.
     */
    export class RouteConfig {
        private routes: Route[] = [];
        private urlHash: UrlHash = new UrlHash();
        private currentRoute: Route;

        public defaultUrl: string = null;

        /**
         *  Registers a route by given url pattern.
         *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
         *  Dynamic route param can be registered with {yourParam}.
         */
        register(pattern: string, callback: (routeParams: any, currentPattern?: string) => void): this {
            if (this.routes.some(r => r.pattern === pattern)) {
                throw new Error("register(): Route " + pattern + " has been already registered.");
            }

            this.routes.push(new Route(pattern, callback));
            return this;
        }

        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        startRoute(hash: string): void {
            this.urlHash.value = hash;
            this.currentRoute = findRoute.call(this);
            if (this.currentRoute) {
                this.currentRoute.start(this.urlHash);
                return;
            }

            if (typeof this.defaultUrl === "string") {
                startDefaultRoute.call(this, hash);
            } else {
                console.warn("No route matches " + hash);
            }
        }

        getCurrentRoute(): DRouteState {
            return {
                pattern: this.currentRoute ? this.currentRoute.pattern : null,
                params: this.currentRoute ? this.currentRoute.queryParams: null
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
        hasRoutes(): boolean {
            return this.routes.length > 0;
        }
    }
}

interface DRouteState {
    pattern: string;
    params: any;
}