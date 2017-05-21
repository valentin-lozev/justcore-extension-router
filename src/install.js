var dcore;
(function (dcore) {
    "use strict";
    var routing = dcore.plugins.routing;
    var global = window;
    function sandboxGetCurrentRoute() {
        return this.core.routing.getCurrentRoute();
    }
    function sandboxGo(url) {
        location.hash = url;
    }
    function handleRoute() {
        this.routing.startRoute(global.location.hash.substring(1));
    }
    dcore.Instance.prototype.useRouting = function () {
        var _this = this;
        if (this.routing) {
            return this;
        }
        this.routing = new routing.RouteConfig();
        this.Sandbox.prototype.getCurrentRoute = sandboxGetCurrentRoute;
        this.Sandbox.prototype.go = sandboxGo;
        this.hook(dcore.HOOK_DOM_READY, function () {
            if (_this.routing.hasRoutes()) {
                global.addEventListener("hashchange", handleRoute.bind(_this));
            }
            return true;
        });
        return this;
    };
})(dcore || (dcore = {}));
//# sourceMappingURL=install.js.map