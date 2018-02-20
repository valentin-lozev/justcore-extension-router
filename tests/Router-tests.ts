import { Router } from "../src/Router";
import { Core } from "justcore";

interface TestsContext {
	createHook: jasmine.Spy;
	router: jc.Router;
	noop: jc.Func;
}

describe("Router", () => {

	beforeEach(function (this: TestsContext): void {
		this.noop = function noop(): any { };
		const core = new Core();
		this.createHook = spyOn(core, "createHook").and.callThrough();
		this.router = new Router(core);
	});

	it("should create two hooks", function (this: TestsContext): void {
		expect(this.createHook).toHaveBeenCalledTimes(2);
	});

	it("should pass router as context to hooks", function (this: TestsContext): void {
		expect(this.createHook.calls.argsFor(0)[2]).toBe(this.router);
		expect(this.createHook.calls.argsFor(1)[2]).toBe(this.router);
	});

	it("should create onRouteAdd pipeline", function (this: TestsContext): void {
		expect((this.router.route as jc.Hook)._withPipeline).toEqual(true);
		expect((this.router.route as jc.Hook)._hookType).toEqual("onRouteAdd");
	});

	it("should create onRouteStart pipeline", function (this: TestsContext): void {
		expect((this.router.start as jc.Hook)._withPipeline).toEqual(true);
		expect((this.router.start as jc.Hook)._hookType).toEqual("onRouteStart");
	});

	it("should has null as default url by default", function (this: TestsContext): void {
		expect(this.router.defaultHash).toBeNull();
	});

	it("paths must be an empty array by default", function (this: TestsContext): void {
		const paths = this.router.paths;

		expect(Array.isArray(paths)).toBeTruthy();
		expect(paths.length).toEqual(0);
	});

	it("should throw an error when register route witout path", function (this: TestsContext): void {
		expect(() => { this.router.route(null, this.noop) }).toThrow();
	});

	it("should throw an error when register route without callback", function (this: TestsContext): void {
		expect(() => { this.router.route("/books", null); }).toThrow();
	});

	it("should register a route", function (this: TestsContext): void {
		const path = "/home";

		this.router.route(path, this.noop);

		expect(this.router.paths.length).toEqual(1);
		expect(this.router.paths[0]).toEqual(path);
	});

	it("should throw an error when register an already registered route", function (this: TestsContext): void {
		const path = "/home";
		this.router.route(path, this.noop);

		expect(() => this.router.route(path, this.noop)).toThrow();
		expect(this.router.paths.length).toEqual(1);
	});

	it("should start route", function (this: TestsContext): void {
		const path = "/home";
		const handler = {
			handle: (routeParams: any): void => {
				return;
			}
		};
		spyOn(handler, "handle");
		this.router.route(path, handler.handle);

		this.router.start(path + "?search=1");

		expect(handler.handle).toHaveBeenCalledTimes(1);
		expect(this.router.current.path).toEqual(path);
		expect(this.router.current.params).toEqual({ search: "1" });
	});

	it("should start default url when start not registered route", function (this: TestsContext): void {
		this.router.defaultHash = "home";
		const expectedPattern = "/home";
		const handler = {
			handle: (routeParams: any): void => {
				return;
			}
		};
		spyOn(handler, "handle");
		this.router.route(expectedPattern, handler.handle);

		this.router.start("#/invalid");

		expect(this.router.current.path).toEqual(expectedPattern);
		expect(handler.handle).toHaveBeenCalledTimes(1);
	});

	it("should start routes with priority by their registration when hash matches multiple paths", function (this: TestsContext): void {
		const handler = {
			handle: (routeParams: any): void => {
				return;
			}
		};
		spyOn(handler, "handle");
		const expectedPath = "/{id}";
		const expectedParams = { id: "1" };
		this.router.route(expectedPath, handler.handle);
		this.router.route("page", handler.handle);
		this.router.route("home", handler.handle);

		this.router.start("1");

		expect(handler.handle).toHaveBeenCalledTimes(1);
		expect(handler.handle).toHaveBeenCalledWith({
			path: expectedPath,
			params: expectedParams
		});
	});
});