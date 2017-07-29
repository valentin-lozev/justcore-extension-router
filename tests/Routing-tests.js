describe("Routing", function () {
    function getConfig() {
        var core = new dcore.Application();
        core.useRouting();
        return core.routing;
    }
    it("should has null default url by default", function () {
        var config = getConfig();
        expect(config.defaultUrl).toBeNull();
    });
    it("should has not any registered routes by default", function () {
        var config = getConfig();
        expect(config.anyRoutes()).toBeFalsy();
    });
    it("should return empty array when there arent any registered routes", function () {
        var routes = getConfig().getRoutes();
        expect(Array.isArray(routes)).toBeTruthy();
        expect(routes.length).toEqual(0);
    });
    it("should register a route", function () {
        var config = getConfig();
        var pattern = "/home";
        config.register(pattern, function () { return; });
        expect(config.anyRoutes()).toBeTruthy();
        expect(config.getRoutes().length).toEqual(1);
        expect(config.getRoutes()[0]).toEqual(pattern);
    });
    it("should throw an error when register route witout pattern", function () {
        var config = getConfig();
        expect(function () { config.register(null, function () { return; }); }).toThrow();
    });
    it("should throw an error when register route without callback", function () {
        var config = getConfig();
        expect(function () { config.register("", null); }).toThrow();
    });
    it("should throw an error when register an already registered route", function () {
        var config = getConfig();
        var pattern = "/home";
        config.register(pattern, function () { return; });
        expect(function () { return config.register(pattern, function () { return; }); }).toThrow();
        expect(config.getRoutes().length).toEqual(1);
    });
    it("should not trow an error when start not registered route", function () {
        var config = getConfig();
        expect(function () { return config.startRoute("home"); }).not.toThrow();
    });
    it("should start route when route is registered", function () {
        var config = getConfig();
        var pattern = "/home";
        var handler = {
            handle: function (routeParams) {
                return;
            }
        };
        spyOn(handler, "handle");
        config.register(pattern, handler.handle);
        config.startRoute(pattern + "?search=");
        var currentRoute = config.getCurrentRoute();
        expect(handler.handle).toHaveBeenCalled();
        expect(currentRoute.pattern).toEqual(pattern);
        expect(currentRoute.params).toEqual({ search: "" });
    });
    it("should start default url when start not registered route", function () {
        var config = getConfig();
        config.defaultUrl = "home";
        var pattern = "/home";
        var handler = {
            handle: function (routeParams) {
                return;
            }
        };
        spyOn(handler, "handle");
        config.register(pattern, handler.handle);
        config.startRoute("invalid");
        var currentRoute = config.getCurrentRoute();
        expect(currentRoute.pattern).toEqual(pattern);
        expect(handler.handle).toHaveBeenCalled();
    });
    it("should start routes when url matches multiple ones with priority by their registration", function () {
        var config = getConfig();
        var handler = {
            handle: function (routeParams) {
                return;
            }
        };
        spyOn(handler, "handle");
        var expectedPattern = "{id}";
        var expectedParams = { id: "1" };
        config.register(expectedPattern, handler.handle);
        config.register("page", handler.handle);
        config.register("home", handler.handle);
        config.startRoute("1");
        expect(handler.handle).toHaveBeenCalledTimes(1);
        expect(handler.handle).toHaveBeenCalledWith(expectedParams, expectedPattern);
    });
    it("should start listening for hashchange on DOMContentLoaded", function () {
        var core = new dcore.Application();
        core.useRouting();
        core.routing.register("", function () { return; });
        spyOn(core.routing, "startRoute");
        core.run();
        document.dispatchEvent(new Event("DOMContentLoaded"));
        window.dispatchEvent(new Event("hashchange"));
        expect(core.routing.startRoute).toHaveBeenCalledTimes(1);
    });
});
