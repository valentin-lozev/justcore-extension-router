var dcore;
(function (dcore) {
    "use strict";
    function sandboxGetCurrentRoute() {
        return this.core.routing.getCurrentRoute();
    }
    function sandboxGo(url) {
        location.hash = url;
    }
    function handleRoute() {
        this.routing.startRoute(window.location.hash.substring(1));
    }
    function runRouting(next) {
        if (this.routing.anyRoutes()) {
            window.addEventListener("hashchange", handleRoute.bind(this));
        }
        next.call(this);
    }
    dcore.Application.prototype.useRouting = function () {
        if (!this.routing) {
            this.routing = new dcore.Routing();
            (function (sb) {
                sb.getCurrentRoute = sandboxGetCurrentRoute;
                sb.go = sandboxGo;
            }(this.Sandbox.prototype));
            this.hook(dcore.hooks.CORE_RUN, runRouting);
        }
        return this;
    };
})(dcore || (dcore = {}));
