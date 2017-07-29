var dcore;
(function (dcore) {
    var routing;
    (function (routing) {
        "use strict";
        /**
         *  Represents the string after "#" in a url.
         */
        var UrlHash = (function () {
            function UrlHash() {
                this.tokens = [];
                this.queryParams = [];
                this.questionMarkIndex = -1;
                this.url = "";
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
    })(routing = dcore.routing || (dcore.routing = {}));
})(dcore || (dcore = {}));

var dcore;
(function (dcore) {
    var routing;
    (function (routing) {
        "use strict";
        var routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}
        /**
         *  Accepts a pattern and split it by / (slash).
         *  It also supports dynamic params - {yourDynamicParam}.
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
                        this.callback(this.queryParams, this.pattern);
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
    })(routing = dcore.routing || (dcore.routing = {}));
})(dcore || (dcore = {}));

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

var dcore;
(function (dcore) {
    "use strict";
    function sandboxGetCurrentRoute() {
        return this.core.routing.getCurrentRoute();
    }
    function sandboxGo(url) {
        location.hash = url;
    }
    function handleRoute() {
        this.routing.startRoute(window.location.hash.substring(1));
    }
    function runRouting(next) {
        if (this.routing.anyRoutes()) {
            window.addEventListener("hashchange", handleRoute.bind(this));
        }
        next.call(this);
    }
    dcore.Application.prototype.useRouting = function () {
        if (!this.routing) {
            this.routing = new dcore.Routing();
            (function (sb) {
                sb.getCurrentRoute = sandboxGetCurrentRoute;
                sb.go = sandboxGo;
            }(this.Sandbox.prototype));
            this.hook(dcore.hooks.CORE_RUN, runRouting);
        }
        return this;
    };
})(dcore || (dcore = {}));
