interface DCore {
    useRouting(): void;
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
        useRouting(): void;
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

    Instance.prototype.useRouting = function (): void {
        let that = <DCore>this;
        if (that.routing) {
            return;
        }

        that.routing = new routing.RouteConfig();
        that.Sandbox.prototype.getCurrentRoute = sandboxGetCurrentRoute;
        that.Sandbox.prototype.go = sandboxGo;

        that.hook(dcore.HookType.Core_DOMReady, () => {
            if (!that.routing.hasRoutes()) {
                return;
            }

            global.addEventListener("hashchange", handleRoute.bind(that));
        });
    };
}