var dcore;
(function (dcore) {
    var plugins;
    (function (plugins) {
        var routing;
        (function (routing) {
            "use strict";
            /**
             *  @class UrlHash - Represents the string after "#" in a url.
             *  @property {String} value - The string after # in a url.
             *  @property {Array} tokens - The array of string tokens after splitint its value by / (slash).
             *  @property {Array} queryParams - The array of key-value pairs parsed from the query string in its value.
             */
            var UrlHash = (function () {
                function UrlHash() {
                    this.questionMarkIndex = -1;
                    this.url = "";
                    this.tokens = [];
                    this.queryParams = [];
                }
                Object.defineProperty(UrlHash.prototype, "value", {
                    get: function () {
                        return this.url;
                    },
                    set: function (url) {
                        url = url || "";
                        this.url = url;
                        this.questionMarkIndex = url.indexOf("?");
                        this.queryParams = [];
                        this.tokens = [];
                        this.populateQueryParams();
                        this.populateTokens();
                    },
                    enumerable: true,
                    configurable: true
                });
                UrlHash.prototype.anyQueryParams = function () {
                    return this.questionMarkIndex > -1;
                };
                UrlHash.prototype.populateQueryParams = function () {
                    var _this = this;
                    if (!this.anyQueryParams()) {
                        return;
                    }
                    this.queryParams = this.value
                        .substring(this.questionMarkIndex + 1)
                        .split("&")
                        .map(function (keyValuePairString) { return _this.parseQueryParam(keyValuePairString); });
                };
                UrlHash.prototype.parseQueryParam = function (keyValuePair) {
                    var args = keyValuePair.split("=");
                    return {
                        key: args[0],
                        value: args[1] || ""
                    };
                };
                UrlHash.prototype.populateTokens = function () {
                    var valueWithoutQuery = this.getValueWithoutQuery();
                    this.tokens = valueWithoutQuery
                        .split("/")
                        .filter(function (token) { return token !== ""; });
                };
                UrlHash.prototype.getValueWithoutQuery = function () {
                    if (!this.anyQueryParams()) {
                        return this.value;
                    }
                    return this.value.substring(0, this.value.length - (this.value.length - this.questionMarkIndex));
                };
                return UrlHash;
            }());
            routing.UrlHash = UrlHash;
        })(routing = plugins.routing || (plugins.routing = {}));
    })(plugins = dcore.plugins || (dcore.plugins = {}));
})(dcore || (dcore = {}));
//# sourceMappingURL=UrlHash.js.map
var dcore;
(function (dcore) {
    var plugins;
    (function (plugins) {
        var routing;
        (function (routing) {
            "use strict";
            var routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}
            /**
             *  @class Route - Accepts a pattern and split it by / (slash).
             *  It also supports dynamic params - {yourDynamicParam}.
             *  @property {String} pattern
             */
            var Route = (function () {
                function Route(pattern, onStart) {
                    this.tokens = [];
                    var errorMsg = "Route registration failed:";
                    if (typeof pattern !== "string") {
                        throw new TypeError(errorMsg + " pattern should be non empty string.");
                    }
                    if (typeof onStart !== "function") {
                        throw new TypeError(errorMsg + " callback should be a function.");
                    }
                    this.pattern = pattern;
                    this.callback = onStart;
                    this.populateTokens();
                }
                /**
                 *  The array of tokens after its pattern is splitted by / (slash).
                 */
                Route.prototype.getTokens = function () {
                    return this.tokens.slice(0);
                };
                /**
                 *  Determines whether it equals UrlHash.
                 */
                Route.prototype.equals = function (hashUrl) {
                    if (this.tokens.length !== hashUrl.tokens.length) {
                        return false;
                    }
                    for (var i = 0, len = this.tokens.length; i < len; i++) {
                        var token = this.tokens[i];
                        var urlToken = hashUrl.tokens[i];
                        if (token.isDynamic) {
                            continue;
                        }
                        if (token.name.toLowerCase() !== urlToken.toLowerCase()) {
                            return false;
                        }
                    }
                    return true;
                };
                /**
                 *  Populate the dynamic params from the UrlHash if such exist
                 *  and executes the registered callback.
                 */
                Route.prototype.start = function (urlHash) {
                    this.queryParams = Object.freeze(this.getParamsFromUrl(urlHash));
                    if (this.callback) {
                        try {
                            this.callback(this.queryParams);
                        }
                        catch (error) {
                            console.error("Couldn't start " + urlHash.value + " route due to:");
                            console.error(error);
                        }
                    }
                };
                Route.prototype.populateTokens = function () {
                    var _this = this;
                    this.tokens = [];
                    this.pattern.split("/").forEach(function (urlFragment) {
                        if (urlFragment !== "") {
                            _this.tokens.push(_this.parseToken(urlFragment));
                        }
                    });
                };
                Route.prototype.parseToken = function (urlFragment) {
                    var paramMatchGroups = routeParamRegex.exec(urlFragment);
                    var isDynamic = !!paramMatchGroups;
                    return {
                        name: isDynamic ? paramMatchGroups[1] : urlFragment,
                        isDynamic: isDynamic
                    };
                };
                Route.prototype.getParamsFromUrl = function (url) {
                    var result = this.getQueryParamsFromUrl(url);
                    // route params are with higher priority than query params
                    this.tokens.forEach(function (token, index) {
                        if (token.isDynamic) {
                            result[token.name] = url.tokens[index];
                        }
                    });
                    return result;
                };
                Route.prototype.getQueryParamsFromUrl = function (url) {
                    var result = {};
                    url.queryParams.forEach(function (param) { return result[param.key] = param.value; });
                    return result;
                };
                return Route;
            }());
            routing.Route = Route;
        })(routing = plugins.routing || (plugins.routing = {}));
    })(plugins = dcore.plugins || (dcore.plugins = {}));
})(dcore || (dcore = {}));
//# sourceMappingURL=Route.js.map
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
                        throw new Error("Route " + pattern + " has been already registered.");
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
var dcore;
(function (dcore) {
    "use strict";
    var routing = dcore.plugins.routing;
    var global = window;
    function sandboxGetCurrentRoute() {
        return this.core.routing.getCurrentRoute();
    }
    function sandboxGo(url) {
        location.hash = url;
    }
    function handleRoute() {
        this.routing.startRoute(global.location.hash.substring(1));
    }
    dcore.Instance.prototype.useRouting = function () {
        var that = this;
        if (that.routing) {
            return;
        }
        that.routing = new routing.RouteConfig();
        that.Sandbox.prototype.getCurrentRoute = sandboxGetCurrentRoute;
        that.Sandbox.prototype.go = sandboxGo;
        that.hook(dcore.HookType.Core_DOMReady, function () {
            if (!that.routing.hasRoutes()) {
                return;
            }
            global.addEventListener("hashchange", handleRoute.bind(that));
        });
    };
})(dcore || (dcore = {}));
//# sourceMappingURL=install.js.map