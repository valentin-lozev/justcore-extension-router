namespace dcore.routing {
  "use strict";

  export interface QueryParam {
    key: string;
    value: string;
  }

  function hasQuery(queryIndex: number): boolean {
    return queryIndex > -1;
  }

  function extractQueryParams(url: string, queryIndex: number): QueryParam[] {
    if (!hasQuery(queryIndex)) {
      return [];
    }

    return url
      .substring(queryIndex + 1)
      .split("&")
      .map(extractQueryParam);
  }

  function extractQueryParam(keyValuePair: string): QueryParam {
    const args = keyValuePair.split("=");
    return {
      key: args[0],
      value: args[1] || ""
    };
  }

  function extractTokens(url: string, queryIndex: number): string[] {
    return urlWithoutQuery(url, queryIndex)
      .split("/")
      .filter(token => token !== "");
  }

  function urlWithoutQuery(url: string, queryIndex: number): string {
    if (!hasQuery(queryIndex)) {
      return url;
    }

    return url.substring(0, url.length - (url.length - queryIndex));
  }

  /**
   *  Represents the string after "#" in a url.
   */
  export class UrlHash {

    public tokens: string[] = [];
    public queryParams: QueryParam[] = [];

    private __url: string = "";

    get url(): string {
      return this.__url;
    }

    set url(url: string) {
      url = url || "";
      const queryIndex = url.indexOf("?");

      this.__url = url;
      this.queryParams = extractQueryParams(url, queryIndex);
      this.tokens = extractTokens(url, queryIndex);
    }
  }
}
namespace dcore.routing {
  "use strict";

  interface RouteToken {
    name: string;
    isDynamic: boolean;
  }

  const routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}

  /**
   *  Accepts a pattern and split it by / (slash).
   *  It also supports dynamic params - {yourDynamicParam}.
   */
  export class Route {

    public pattern: string;
    public params: { [key: string]: string; };
    private callback: (routeParams: { [key: string]: string; }, currentPattern?: string) => void;
    private tokens: RouteToken[] = [];

    constructor(pattern: string, onStart: (routeParams: { [key: string]: string; }, currentPattern?: string) => void) {
      const errorMsg = "Route registration failed:";
      if (typeof pattern !== "string") {
        throw new TypeError(`${errorMsg} pattern should be non empty string.`);
      }

      if (typeof onStart !== "function") {
        throw new TypeError(`${errorMsg} callback should be a function.`);
      }

      this.params = {};
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
     *  Determines whether it matches an UrlHash.
     */
    matches(hashUrl: UrlHash): boolean {
      if (this.tokens.length !== hashUrl.tokens.length) {
        return false;
      }

      for (let i = 0, len = this.tokens.length; i < len; i++) {
        const token = this.tokens[i];
        const urlToken = hashUrl.tokens[i];
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
      this.params = this.extractRotueParams(urlHash);
      if (this.callback) {
        try {
          this.callback(this.params, this.pattern);
        } catch (error) {
          console.error(`Couldn't start ${urlHash.url} route due to:`);
          console.error(error);
        }
      }
    }

    private populateTokens(): void {
      this.tokens = [];
      this.pattern
        .split("/")
        .forEach(urlFragment => {
          if (urlFragment !== "") {
            this.tokens.push(this.parseToken(urlFragment));
          }
        });
    }

    private parseToken(urlFragment: string): RouteToken {
      const paramMatchGroups = routeParamRegex.exec(urlFragment);
      const isDynamic = !!paramMatchGroups;
      return {
        name: isDynamic ? paramMatchGroups[1] : urlFragment,
        isDynamic: isDynamic
      };
    }

    private extractRotueParams(url: UrlHash): { [key: string]: string; } {
      // route params are with higher priority than query params
      return this.tokens.reduce((prevResult, token, index) => {
        if (token.isDynamic) {
          prevResult[token.name] = url.tokens[index];
        }

        return prevResult;
      }, this.extractQueryParams(url));
    }

    private extractQueryParams(url: UrlHash): { [key: string]: string; } {
      return url.queryParams.reduce((prevResult, param: QueryParam) => {
        prevResult[param.key] = param.value;
        return prevResult;
      }, {});
    }
  }
}
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
interface DCore {
  useRouting(): DCore;
  routing: dcore.Routing;
}

interface DSandbox {
  getCurrentRoute(): DRouteState;
  go(hash: string): void;
}

namespace dcore {
  "use strict";

  export interface Application {
    useRouting(): DCore;
    routing: Routing;
  }

  export interface Sandbox {
    getCurrentRoute(): DRouteState;
    go(hash: string): void;
  }

  function sandboxGetCurrentRoute(this: DSandbox): DRouteState {
    return (<DCore>this["core"]).routing.current();
  }

  function sandboxGo(this: DSandbox, hash: string): void {
    location.hash = hash;
  }

  function handleRoute(this: DCore): void {
    this.routing.startRoute(window.location.hash.substring(1));
  }

  function runRouting(this: DCore, next: Function): void {
    next();

    if (this.routing.any()) {
      window.addEventListener("hashchange", handleRoute.bind(this));
      handleRoute.call(this);
    }
  }

  Application.prototype.useRouting = function (this: DCore): DCore {
    if (!this.routing) {
      this.routing = new Routing(this);

      (function (sb: DSandbox) {
        sb.getCurrentRoute = sandboxGetCurrentRoute;
        sb.go = sandboxGo;
      }(this.Sandbox.prototype));

      this.pipeline.hook(hooks.CORE_RUN, runRouting);
    }

    return this;
  };
}