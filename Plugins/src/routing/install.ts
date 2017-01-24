interface DCore {
    useRouting(): void;
    routing: dcore.plugins.routing.RouteConfig;
}

namespace dcore {
    "use strict";

    import routing = plugins.routing;

    let global = window;

    export interface Instance {
        useRouting(): void;
        routing: routing.RouteConfig;
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
        that.hook(dcore.HookType.Core_DOMReady, () => {
            if (!that.routing.hasRoutes()) {
                return;
            }

            global.addEventListener("hashchange", handleRoute.bind(that));
        });
    };
}