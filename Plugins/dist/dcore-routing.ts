namespace dcore.plugins.routing {
    "use strict";

    export interface QueryParam {
        key: string;
        value: string;
    }

    /**
     *  @class UrlHash - Represents the string after "#" in a url.
     *  @property {String} value - The string after # in a url.
     *  @property {Array} tokens - The array of string tokens after splitint its value by / (slash).
     *  @property {Array} queryParams - The array of key-value pairs parsed from the query string in its value.
     */
    export class UrlHash {
        private questionMarkIndex: number = -1;
        private url: string = "";
        public tokens: string[] = [];
        public queryParams: QueryParam[] = [];

        get value(): string {
            return this.url;
        }

        set value(url: string) {
            url = url || "";
            this.url = url;
            this.questionMarkIndex = url.indexOf("?");
            this.queryParams = [];
            this.tokens = [];
            this.populateQueryParams();
            this.populateTokens();
        }

        private anyQueryParams(): boolean {
            return this.questionMarkIndex > -1;
        }

        private populateQueryParams(): void {
            if (!this.anyQueryParams()) {
                return;
            }

            this.queryParams = this.value
                .substring(this.questionMarkIndex + 1)
                .split("&")
                .map(keyValuePairString => this.parseQueryParam(keyValuePairString));
        }

        private parseQueryParam(keyValuePair: string): QueryParam {
            let args = keyValuePair.split("=");
            return {
                key: args[0],
                value: args[1] || ""
            };
        }

        private populateTokens(): void {
            let valueWithoutQuery = this.getValueWithoutQuery();
            this.tokens = valueWithoutQuery
                .split("/")
                .filter(token => token !== "");
        }

        private getValueWithoutQuery(): string {
            if (!this.anyQueryParams()) {
                return this.value;
            }

            return this.value.substring(0, this.value.length - (this.value.length - this.questionMarkIndex));
        }
    }
}
namespace dcore.plugins.routing {
    "use strict";

    interface RouteToken {
        name: string;
        isDynamic: boolean;
    }

    let routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}

    /**
     *  @class Route - Accepts a pattern and split it by / (slash).
     *  It also supports dynamic params - {yourDynamicParam}.
     *  @property {String} pattern
     */
    export class Route {
        private callback: (routeParams: any) => void;
        private tokens: RouteToken[] = [];
        public pattern: string;

        constructor(pattern: string, onStart: (routeParams: any) => void) {
            let errorMsg = "Route registration failed:";
            if (typeof pattern !== "string") {
                throw new TypeError(`${errorMsg} pattern should be non empty string.`);
            }

            if (typeof onStart !== "function") {
                throw new TypeError(`${errorMsg} callback should be a function.`);
            }

            this.pattern = pattern;
            this.callback = onStart;
            this.populateTokens();
        }

        /**
         *  The array of tokens after its pattern is splitted by / (slash).
         */
        getTokens(): RouteToken[] {
            return this.tokens.slice(0);
        }

        /**
         *  Determines whether it equals UrlHash.
         */
        equals(hashUrl: UrlHash): boolean {
            if (this.tokens.length !== hashUrl.tokens.length) {
                return false;
            }

            for (let i = 0, len = this.tokens.length; i < len; i++) {
                let token = this.tokens[i];
                let urlToken = hashUrl.tokens[i];
                if (token.isDynamic) {
                    continue;
                }

                if (token.name.toLowerCase() !== urlToken.toLowerCase()) {
                    return false;
                }
            }

            return true;
        }

        /**
         *  Populate the dynamic params from the UrlHash if such exist
         *  and executes the registered callback.
         */
        start(urlHash: UrlHash): void {
            let queryParams = this.getParamsFromUrl(urlHash);
            if (this.callback) {
                this.callback(queryParams);
            }
        }

        private populateTokens(): void {
            this.tokens = [];
            this.pattern.split("/").forEach((urlFragment: string) => {
                if (urlFragment !== "") {
                    this.tokens.push(this.parseToken(urlFragment));
                }
            });
        }

        private parseToken(urlFragment: string): RouteToken {
            let paramMatchGroups = routeParamRegex.exec(urlFragment);
            let isDynamic = !!paramMatchGroups;
            return {
                name: isDynamic ? paramMatchGroups[1] : urlFragment,
                isDynamic: isDynamic
            };
        }

        private getParamsFromUrl(url: UrlHash): Object {
            let result = this.getQueryParamsFromUrl(url);
            // route params are with higher priority than query params
            this.tokens.forEach((token, index) => {
                if (token.isDynamic) {
                    result[token.name] = url.tokens[index];
                }
            });

            return result;
        }

        private getQueryParamsFromUrl(url: UrlHash): Object {
            let result = {};
            url.queryParams.forEach((param: QueryParam) => result[param.key] = param.value);
            return result;
        }
    }
}
interface DRoutingPlugin {
    defaultUrl: string;
    register(pattern: string, callback: (routeParams: any) => void): this;
    startRoute(hash: string): void;
    getRoutes(): string[];
    hasRoutes(): boolean;
}

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
        let nextRoute = findRoute.call(this);
        if (nextRoute) {
            nextRoute.start(this.urlHash);
        } else {
            console.warn("No route handler for " + invalidHash);
        }
    }

    /**
     *  @class RouteConfig - Handles window hash change.
     */
    export class RouteConfig implements DRoutingPlugin {
        private routes: Route[] = [];
        private urlHash: UrlHash = new UrlHash();
        public defaultUrl: string = null;

        /**
         *  Registers a route by given url pattern.
         *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
         *  Dynamic route param can be registered with {yourParam}.
         */
        register(pattern: string, callback: (routeParams: any) => void): this {
            if (this.routes.some(r => r.pattern === pattern)) {
                throw new Error("Route " + pattern + " has been already registered.");
            }

            this.routes.push(new Route(pattern, callback));
            return this;
        }

        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        startRoute(hash: string): void {
            this.urlHash.value = hash;
            let nextRoute = findRoute.call(this);
            if (nextRoute) {
                nextRoute.start(this.urlHash);
                return;
            }

            if (typeof this.defaultUrl === "string") {
                startDefaultRoute.call(this, hash);
            } else {
                console.warn("No route matches " + hash);
            }
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
interface DCore {
    useRouting(): void;
    routing: DRoutingPlugin;
}

namespace dcore {
    "use strict";

    import routing = plugins.routing;

    export interface Instance {
        useRouting(): void;
        routing: DRoutingPlugin;
    }

    Instance.prototype.useRouting = function (): void {
        let that = <DCore>this;
        if (that.routing) {
            return;
        }

        that.routing = new routing.RouteConfig();
        that.hook(dcore.HookType.Core_DOMReady, () => {
            if (!that.routing.hasRoutes()) {
                return;
            }

            let global = window;
            that.routing.startRoute(global.location.hash.substring(1));
            global.addEventListener("hashchange", () => {
                that.routing.startRoute(global.location.hash.substring(1));
            });
        });
    };
}