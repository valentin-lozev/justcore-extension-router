var dcore;
(function (dcore) {
    var routing;
    (function (routing) {
        "use strict";
        function hasQuery(queryIndex) {
            return queryIndex > -1;
        }
        function extractQueryParams(url, queryIndex) {
            if (!hasQuery(queryIndex)) {
                return [];
            }
            return url
                .substring(queryIndex + 1)
                .split("&")
                .map(extractQueryParam);
        }
        function extractQueryParam(keyValuePair) {
            var args = keyValuePair.split("=");
            return {
                key: args[0],
                value: args[1] || ""
            };
        }
        function extractTokens(url, queryIndex) {
            return urlWithoutQuery(url, queryIndex)
                .split("/")
                .filter(function (token) { return token !== ""; });
        }
        function urlWithoutQuery(url, queryIndex) {
            if (!hasQuery(queryIndex)) {
                return url;
            }
            return url.substring(0, url.length - (url.length - queryIndex));
        }
        /**
         *  Represents the string after "#" in a url.
         */
        var UrlHash = (function () {
            function UrlHash() {
                this.tokens = [];
                this.queryParams = [];
                this.__url = "";
            }
            Object.defineProperty(UrlHash.prototype, "url", {
                get: function () {
                    return this.__url;
                },
                set: function (url) {
                    url = url || "";
                    var queryIndex = url.indexOf("?");
                    this.__url = url;
                    this.queryParams = extractQueryParams(url, queryIndex);
                    this.tokens = extractTokens(url, queryIndex);
                },
                enumerable: true,
                configurable: true
            });
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
                this.params = {};
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
             *  Determines whether it matches an UrlHash.
             */
            Route.prototype.matches = function (hashUrl) {
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
                this.params = this.extractRotueParams(urlHash);
                if (this.callback) {
                    try {
                        this.callback(this.params, this.pattern);
                    }
                    catch (error) {
                        console.error("Couldn't start " + urlHash.url + " route due to:");
                        console.error(error);
                    }
                }
            };
            Route.prototype.populateTokens = function () {
                var _this = this;
                this.tokens = [];
                this.pattern
                    .split("/")
                    .forEach(function (urlFragment) {
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
            Route.prototype.extractRotueParams = function (url) {
                // route params are with higher priority than query params
                return this.tokens.reduce(function (prevResult, token, index) {
                    if (token.isDynamic) {
                        prevResult[token.name] = url.tokens[index];
                    }
                    return prevResult;
                }, this.extractQueryParams(url));
            };
            Route.prototype.extractQueryParams = function (url) {
                return url.queryParams.reduce(function (prevResult, param) {
                    prevResult[param.key] = param.value;
                    return prevResult;
                }, {});
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
    var hooks;
    (function (hooks) {
        hooks.ROUTING_REGISTER = "routing.register";
        hooks.ROUTING_START = "routing.start";
    })(hooks = dcore.hooks || (dcore.hooks = {}));
    var Routing = (function () {
        function Routing(core) {
            this.defaultUrl = null;
            this.routes = [];
            this.urlHash = new plugin.UrlHash();
            this.core = core;
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
            this.core.pipeline.pipe(hooks.ROUTING_REGISTER, this.__register, this, pattern, callback);
        };
        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        Routing.prototype.startRoute = function (hash) {
            this.core.pipeline.pipe(hooks.ROUTING_START, this.__startRoute, this, hash);
        };
        Routing.prototype.current = function () {
            return {
                pattern: this.currentRoute ? this.currentRoute.pattern : null,
                params: this.currentRoute ? this.currentRoute.params : null
            };
        };
        /**
         *  Returns all registered patterns.
         */
        Routing.prototype.patterns = function () {
            return this.routes.map(function (route) { return route.pattern; });
        };
        /**
         *  Determines if there are any registered routes.
         */
        Routing.prototype.any = function () {
            return this.routes.length > 0;
        };
        Routing.prototype.__register = function (pattern, callback) {
            this.routes.push(new plugin.Route(pattern, callback));
        };
        Routing.prototype.__startRoute = function (hash) {
            this.urlHash.url = hash;
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
        Routing.prototype.__findRoute = function () {
            for (var i = 0, len = this.routes.length; i < len; i++) {
                var route = this.routes[i];
                if (route.matches(this.urlHash)) {
                    return route;
                }
            }
            return null;
        };
        Routing.prototype.__startDefaultRoute = function (invalidHash) {
            window.history.replaceState(null, null, window.location.pathname + "#" + this.defaultUrl);
            this.urlHash.url = this.defaultUrl;
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
        return this["core"].routing.current();
    }
    function sandboxGo(hash) {
        location.hash = hash;
    }
    function handleRoute() {
        this.routing.startRoute(window.location.hash.substring(1));
    }
    function runRouting(next) {
        next();
        if (this.routing.any()) {
            window.addEventListener("hashchange", handleRoute.bind(this));
            handleRoute.call(this);
        }
    }
    dcore.Application.prototype.useRouting = function () {
        if (!this.routing) {
            this.routing = new dcore.Routing(this);
            (function (sb) {
                sb.getCurrentRoute = sandboxGetCurrentRoute;
                sb.go = sandboxGo;
            }(this.Sandbox.prototype));
            this.pipeline.hook(dcore.hooks.CORE_RUN, runRouting);
        }
        return this;
    };
})(dcore || (dcore = {}));
