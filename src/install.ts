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