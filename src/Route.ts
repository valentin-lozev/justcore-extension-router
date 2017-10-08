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