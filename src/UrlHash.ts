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