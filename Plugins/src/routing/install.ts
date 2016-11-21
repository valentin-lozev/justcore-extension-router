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
            global.addEventListener("hashchange", () => {
                that.routing.startRoute(global.location.hash.substring(1));
            });
        });
    };
}