interface DCore {
    useRouting(): DCore;
    routing: dcore.Routing;
}

interface DSandbox {
    getCurrentRoute(): DRouteState;
    go(url: string): void;
}

namespace dcore {
    "use strict";

    export interface Application {
        useRouting(): DCore;
        routing: Routing;
    }

    export interface Sandbox {
        getCurrentRoute(): DRouteState;
        go(url: string): void;
    }

    function sandboxGetCurrentRoute() {
        return this.core.routing.getCurrentRoute();
    }

    function sandboxGo(url: string) {
        location.hash = url;
    }

    function handleRoute(this: DCore) {
        this.routing.startRoute(window.location.hash.substring(1));
    }

    function runRouting(this: DCore, next: Function): void {
        if (this.routing.anyRoutes()) {
            window.addEventListener("hashchange", handleRoute.bind(this));
        }

        next.call(this);
    }

    Application.prototype.useRouting = function (this: DCore): DCore {
        if (!this.routing) {
            this.routing = new Routing();

            (function (sb: DSandbox) {
                sb.getCurrentRoute = sandboxGetCurrentRoute;
                sb.go = sandboxGo;
            }(this.Sandbox.prototype));

            this.hook(hooks.CORE_RUN, runRouting);
        }

        return this;
    };
}