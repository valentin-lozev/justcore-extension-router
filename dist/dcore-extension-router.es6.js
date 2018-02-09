function parseSearch(hash, searchIndex) {
    if (searchIndex < 0) {
        return [];
    }
    return hash
        .substring(searchIndex + 1)
        .split("&")
        .map(parseSearchPair);
}
function parseSearchPair(keyValuePair) {
    var args = keyValuePair.split("=");
    return {
        key: args[0],
        value: args[1] || ""
    };
}
function parseTokens(hash, searchIndex) {
    return hashWithoutSearch(hash, searchIndex)
        .split("/")
        .filter(function (token) { return token !== ""; });
}
function hashWithoutSearch(hash, searchIndex) {
    return searchIndex < 0 ? hash : hash.substring(0, searchIndex);
}
/**
 *  Represents the hash string in a url.
 */
var Hash = /** @class */ (function () {
    function Hash() {
        this._value = "";
        this._searchParams = [];
        this._tokens = [];
    }
    Object.defineProperty(Hash.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (hash) {
            hash = hash || "";
            hash = hash[0] !== "#" ? hash : hash.substring(1);
            var searchIndex = hash.indexOf("?");
            this._value = hash;
            this._searchParams = parseSearch(hash, searchIndex);
            this._tokens = parseTokens(hash, searchIndex);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Hash.prototype, "tokens", {
        get: function () {
            return this._tokens.slice(0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Hash.prototype, "search", {
        get: function () {
            return this._searchParams.slice(0);
        },
        enumerable: true,
        configurable: true
    });
    return Hash;
}());

var routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}
function createTokens(path) {
    return path
        .split("/")
        .reduce(function (prevResult, hashFragment) {
        if (hashFragment !== "") {
            prevResult.push(createToken(hashFragment));
        }
        return prevResult;
    }, []);
}
function createToken(hashFragment) {
    var paramMatchGroups = routeParamRegex.exec(hashFragment);
    var isDynamic = !!paramMatchGroups;
    return {
        name: isDynamic ? paramMatchGroups[1] : hashFragment,
        isDynamic: isDynamic
    };
}
function parseSearch$1(hash) {
    return hash
        .search
        .reduce(function (prevResult, param) {
        prevResult[param.key] = param.value;
        return prevResult;
    }, Object.create(null));
}
/**
 *  Accepts a path and split it by / (slash).
 *  It also supports dynamic params - {yourDynamicParam}.
 */
var Route = /** @class */ (function () {
    function Route(path, callback) {
        this._tokens = [];
        if (typeof path !== "string" || path === "") {
            throw new TypeError("route(): path should be non empty string.");
        }
        if (typeof callback !== "function") {
            throw new TypeError("route(): callback should be a function.");
        }
        this.params = Object.create(null);
        this.path = path;
        this.callback = callback;
        this._tokens = createTokens(this.path);
    }
    Object.defineProperty(Route.prototype, "tokens", {
        /**
         *  The array of tokens after its path is splitted by / (slash).
         */
        get: function () {
            return this._tokens.slice(0);
        },
        enumerable: true,
        configurable: true
    });
    /**
     *  Determines whether it matches an UrlHash.
     */
    Route.prototype.matches = function (hash) {
        if (this._tokens.length !== hash.tokens.length) {
            return false;
        }
        for (var i = 0, len = this._tokens.length; i < len; i++) {
            var token = this._tokens[i];
            var urlToken = hash.tokens[i];
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
    Route.prototype.start = function (hash) {
        this.params = this.parseParams(hash);
        if (this.callback) {
            try {
                this.callback({
                    path: this.path,
                    params: this.params
                });
            }
            catch (error) {
                console.error("start(): Couldn't start \"" + hash.value + "\" hash");
                console.error(error);
            }
        }
    };
    Route.prototype.parseParams = function (hash) {
        // route params are with higher priority than search params
        return this._tokens.reduce(function (prevResult, token, index) {
            if (token.isDynamic) {
                prevResult[token.name] = hash.tokens[index];
            }
            return prevResult;
        }, parseSearch$1(hash));
    };
    return Route;
}());

var Router = /** @class */ (function () {
    function Router(dcore) {
        this.defaultHash = null;
        this.routes = Object.create(null);
        this.hash = new Hash();
        this.currentRoute = null;
        this.route = dcore.createHook("onRouteAdd", this.route, this);
        this.start = dcore.createHook("onRouteStart", this.start, this);
    }
    Object.defineProperty(Router.prototype, "paths", {
        get: function () {
            return Object.keys(this.routes);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Router.prototype, "current", {
        get: function () {
            var current = this.currentRoute;
            return {
                path: current ? current.path : null,
                params: current ? current.params : null
            };
        },
        enumerable: true,
        configurable: true
    });
    Router.prototype.route = function (path, onStart) {
        if (path in this.routes) {
            throw new Error("route(): " + path + " has already been added");
        }
        this.routes[path] = new Route(path, onStart);
    };
    Router.prototype.start = function (hash) {
        this.hash.value = hash;
        this.currentRoute = this.__findRoute();
        if (this.currentRoute) {
            this.currentRoute.start(this.hash);
            return;
        }
        if (typeof this.defaultHash === "string") {
            this.__startDefaultRoute(hash);
        }
        else {
            console.warn("start(): No route matches " + hash);
        }
    };
    Router.prototype.__findRoute = function () {
        var paths = this.paths;
        for (var i = 0, len = paths.length; i < len; i++) {
            var path = paths[i];
            var route = this.routes[path];
            if (route.matches(this.hash)) {
                return route;
            }
        }
        return null;
    };
    Router.prototype.__startDefaultRoute = function (hash) {
        window.history.replaceState(null, null, window.location.pathname + "#" + this.defaultHash);
        this.hash.value = this.defaultHash;
        this.currentRoute = this.__findRoute();
        if (this.currentRoute) {
            this.currentRoute.start(this.hash);
        }
        else {
            console.warn("start(): No route handler for " + hash);
        }
    };
    return Router;
}());

function matchedRoute() {
    return this._extensionsOnlyCore.router.current;
}
function onCoreInitPlugin(next) {
    var _this = this;
    next();
    window.addEventListener("hashchange", function () { return _this.router.start(window.location.hash); });
    this.router.start(window.location.hash);
}
function router() {
    return {
        name: "router",
        install: function (dcore) {
            (function (dcore, sandbox) {
                dcore.router = new Router(dcore);
                sandbox.matchedRoute = matchedRoute;
            }(dcore, dcore.Sandbox.prototype));
            return {
                onCoreInit: onCoreInitPlugin
            };
        }
    };
}

export { router };
