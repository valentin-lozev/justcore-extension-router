var dcore;
(function (dcore) {
    var plugins;
    (function (plugins) {
        var routing;
        (function (routing) {
            "use strict";
            function findRoute() {
                for (var i = 0, len = this.routes.length; i < len; i++) {
                    var route = this.routes[i];
                    if (route.equals(this.urlHash)) {
                        return route;
                    }
                }
                return null;
            }
            function startDefaultRoute(invalidHash) {
                window.history.replaceState(null, null, window.location.pathname + "#" + this.defaultUrl);
                this.urlHash.value = this.defaultUrl;
                this.currentRoute = findRoute.call(this);
                if (this.currentRoute) {
                    this.currentRoute.start(this.urlHash);
                }
                else {
                    console.warn("No route handler for " + invalidHash);
                }
            }
            /**
             *  @class RouteConfig - Handles window hash change.
             */
            var RouteConfig = (function () {
                function RouteConfig() {
                    this.routes = [];
                    this.urlHash = new routing.UrlHash();
                    this.defaultUrl = null;
                }
                /**
                 *  Registers a route by given url pattern.
                 *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
                 *  Dynamic route param can be registered with {yourParam}.
                 */
                RouteConfig.prototype.register = function (pattern, callback) {
                    if (this.routes.some(function (r) { return r.pattern === pattern; })) {
                        throw new Error("register(): Route " + pattern + " has been already registered.");
                    }
                    this.routes.push(new routing.Route(pattern, callback));
                    return this;
                };
                /**
                 *  Starts hash url if such is registered, if not, it starts the default one.
                 */
                RouteConfig.prototype.startRoute = function (hash) {
                    this.urlHash.value = hash;
                    this.currentRoute = findRoute.call(this);
                    if (this.currentRoute) {
                        this.currentRoute.start(this.urlHash);
                        return;
                    }
                    if (typeof this.defaultUrl === "string") {
                        startDefaultRoute.call(this, hash);
                    }
                    else {
                        console.warn("No route matches " + hash);
                    }
                };
                RouteConfig.prototype.getCurrentRoute = function () {
                    return {
                        pattern: this.currentRoute ? this.currentRoute.pattern : null,
                        params: this.currentRoute ? this.currentRoute.queryParams : null
                    };
                };
                /**
                 *  Returns all registered patterns.
                 */
                RouteConfig.prototype.getRoutes = function () {
                    return this.routes.map(function (route) { return route.pattern; });
                };
                /**
                 *  Determines if there are any registered routes.
                 */
                RouteConfig.prototype.hasRoutes = function () {
                    return this.routes.length > 0;
                };
                return RouteConfig;
            }());
            routing.RouteConfig = RouteConfig;
        })(routing = plugins.routing || (plugins.routing = {}));
    })(plugins = dcore.plugins || (dcore.plugins = {}));
})(dcore || (dcore = {}));
//# sourceMappingURL=RouteConfig.js.map