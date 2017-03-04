interface DCore {
    useRouting(): DCore;
    routing: dcore.plugins.routing.RouteConfig;
}

interface DSandbox {
    getCurrentRoute(): DRouteState;
    go(url: string): void;
}

namespace dcore {
    "use strict";

    import routing = plugins.routing;

    let global = window;

    export interface Instance {
        useRouting(): DCore;
        routing: routing.RouteConfig;
    }

    export interface DefaultSandbox {
        getCurrentRoute(): DRouteState;
        go(url: string): void;
    }

    function sandboxGetCurrentRoute() {
        return this.core.routing.getCurrentRoute();
    }

    function sandboxGo(url: string) {
        location.hash = url;
    }

    function handleRoute() {
        this.routing.startRoute(global.location.hash.substring(1));
    }

    Instance.prototype.useRouting = function (this: DCore): DCore {
        if (this.routing) {
            return this;
        }

        this.routing = new routing.RouteConfig();
        this.Sandbox.prototype.getCurrentRoute = sandboxGetCurrentRoute;
        this.Sandbox.prototype.go = sandboxGo;

        this.hook(dcore.HookType.Core_DOMReady, () => {
            if (this.routing.hasRoutes()) {
                global.addEventListener("hashchange", handleRoute.bind(this));
            }
        });
        return this;
    };
}