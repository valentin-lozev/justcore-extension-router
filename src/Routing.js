var dcore;
(function (dcore) {
    "use strict";
    var plugin = dcore.routing;
    var Routing = (function () {
        function Routing() {
            this.defaultUrl = null;
            this.routes = [];
            this.urlHash = new plugin.UrlHash();
        }
        /**
         *  Registers a route by given url pattern.
         *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
         *  Dynamic route param can be registered with {yourParam}.
         */
        Routing.prototype.register = function (pattern, callback) {
            if (this.routes.some(function (r) { return r.pattern === pattern; })) {
                throw new Error("register(): Route " + pattern + " has been already registered.");
            }
            this.routes.push(new plugin.Route(pattern, callback));
        };
        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        Routing.prototype.startRoute = function (hash) {
            this.urlHash.value = hash;
            this.currentRoute = this.__findRoute();
            if (this.currentRoute) {
                this.currentRoute.start(this.urlHash);
                return;
            }
            if (typeof this.defaultUrl === "string") {
                this.__startDefaultRoute(hash);
            }
            else {
                console.warn("No route matches " + hash);
            }
        };
        Routing.prototype.getCurrentRoute = function () {
            return {
                pattern: this.currentRoute ? this.currentRoute.pattern : null,
                params: this.currentRoute ? this.currentRoute.queryParams : null
            };
        };
        /**
         *  Returns all registered patterns.
         */
        Routing.prototype.getRoutes = function () {
            return this.routes.map(function (route) { return route.pattern; });
        };
        /**
         *  Determines if there are any registered routes.
         */
        Routing.prototype.anyRoutes = function () {
            return this.routes.length > 0;
        };
        Routing.prototype.__findRoute = function () {
            for (var i = 0, len = this.routes.length; i < len; i++) {
                var route = this.routes[i];
                if (route.equals(this.urlHash)) {
                    return route;
                }
            }
            return null;
        };
        Routing.prototype.__startDefaultRoute = function (invalidHash) {
            window.history.replaceState(null, null, window.location.pathname + "#" + this.defaultUrl);
            this.urlHash.value = this.defaultUrl;
            this.currentRoute = this.__findRoute();
            if (this.currentRoute) {
                this.currentRoute.start(this.urlHash);
            }
            else {
                console.warn("No route handler for " + invalidHash);
            }
        };
        return Routing;
    }());
    dcore.Routing = Routing;
})(dcore || (dcore = {}));
