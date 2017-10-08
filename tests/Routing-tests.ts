describe("Routing", () => {

  function getConfig(): dcore.Routing {
    const core = new dcore.Application();
    core.useRouting();
    return core.routing;
  }

  it("should has null default url by default", () => {
    const config = getConfig();

    expect(config.defaultUrl).toBeNull();
  });

  it("should has not any registered routes by default", () => {
    const config = getConfig();

    expect(config.any()).toBeFalsy();
  });

  it("patterns must be an empty array when there arent any registered routes", () => {
    const patterns = getConfig().patterns();

    expect(Array.isArray(patterns)).toBeTruthy();
    expect(patterns.length).toEqual(0);
  });

  it("should register a route", () => {
    const config = getConfig();
    const pattern = "/home";

    config.register(pattern, () => { return; });

    expect(config.any()).toBeTruthy();
    expect(config.patterns().length).toEqual(1);
    expect(config.patterns()[0]).toEqual(pattern);
  });

  it("should throw an error when register route witout pattern", () => {
    const config = getConfig();

    expect(() => { config.register(null, () => { return; }); }).toThrow();
  });

  it("should throw an error when register route without callback", () => {
    const config = getConfig();

    expect(() => { config.register("", null); }).toThrow();
  });

  it("should throw an error when register an already registered route", () => {
    const config = getConfig();
    const pattern = "/home";

    config.register(pattern, () => { return; });

    expect(() => config.register(pattern, () => { return; })).toThrow();
    expect(config.patterns().length).toEqual(1);
  });

  it("should not trow an error when start not registered route", () => {
    const config = getConfig();

    expect(() => config.startRoute("home")).not.toThrow();
  });

  it("should start route when route is registered", () => {
    const config = getConfig();
    const pattern = "/home";
    const handler = {
      handle: (routeParams: any): void => {
        return;
      }
    };
    spyOn(handler, "handle");
    config.register(pattern, handler.handle);

    config.startRoute(pattern + "?search=");
    const currentRoute = config.current();

    expect(handler.handle).toHaveBeenCalled();
    expect(currentRoute.pattern).toEqual(pattern);
    expect(currentRoute.params).toEqual({ search: "" });
  });

  it("should start default url when start not registered route", () => {
    const config = getConfig();
    config.defaultUrl = "home";
    const pattern = "/home";
    const handler = {
      handle: (routeParams: any): void => {
        return;
      }
    };
    spyOn(handler, "handle");
    config.register(pattern, handler.handle);

    config.startRoute("invalid");
    const currentRoute = config.current();

    expect(currentRoute.pattern).toEqual(pattern);
    expect(handler.handle).toHaveBeenCalled();
  });

  it("should start routes when url matches multiple ones with priority by their registration", () => {
    const config = getConfig();
    const handler = {
      handle: (routeParams: any): void => {
        return;
      }
    };
    spyOn(handler, "handle");
    const expectedPattern = "{id}";
    const expectedParams = { id: "1" };
    config.register(expectedPattern, handler.handle);
    config.register("page", handler.handle);
    config.register("home", handler.handle);

    config.startRoute("1");

    expect(handler.handle).toHaveBeenCalledTimes(1);
    expect(handler.handle).toHaveBeenCalledWith(expectedParams, expectedPattern);
  });

  it("should start the current route on core run", () => {
    const core = new dcore.Application();
    core.useRouting();
    core.routing.register("", () => { return; });
    spyOn(core.routing, "startRoute");

    core.run();

    expect(core.routing.startRoute).toHaveBeenCalledTimes(1);
  });

  it("should start listening for hashchange on core run", () => {
    const core = new dcore.Application();
    core.useRouting();
    core.routing.register("", () => { return; });
    spyOn(core.routing, "startRoute");

    core.run();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    window.dispatchEvent(new Event("hashchange"));

    expect(core.routing.startRoute).toHaveBeenCalledTimes(2);
  });
});