import { router } from "../src/index";
import { Router } from "../src/Router";
import { DCore } from "dcore";

interface TestsContext {
	dcore: dcore.Core;
	extension: dcore.Extension;
	noop: dcore.Func;
}

describe("index", () => {

	beforeEach(function (this: TestsContext): void {
		this.dcore = new DCore();
		this.extension = router();
		this.noop = function (): any { };
	});

	it("should have router as name", function (this: TestsContext): void {
		expect(this.extension.name).toEqual("router");
	});

	describe("dcore", () => {
		it("should be extended with router func", function (this: TestsContext): void {
			this.extension.install(this.dcore);

			expect(this.dcore.router instanceof Router).toEqual(true);
		});
	});

	describe("sandbox", () => {
		it("should be extended with matchedRoute func", function (this: TestsContext): void {
			this.extension.install(this.dcore);

			const sandbox = new this.dcore.Sandbox(this.dcore, "module", "instance");

			expect(typeof sandbox.matchedRoute).toEqual("function");
			expect(sandbox.matchedRoute()).toEqual(this.dcore.router.current);
		});
	});

	describe("onCoreInit", () => {

		it("should be defined", function (this: TestsContext): void {
			const plugins = this.extension.install(this.dcore);

			expect(typeof plugins.onCoreInit).toEqual("function");
		});

		it("should call next", function (this: TestsContext): void {
			const next = spyOn(this, "noop");

			const plugins = this.extension.install(this.dcore);
			plugins.onCoreInit.call(this.dcore, next);

			expect(next).toHaveBeenCalledTimes(1);
		});

		it("should start listening for hashchange", function (this: TestsContext): void {
			window.location.hash = "/home";
			const plugins = this.extension.install(this.dcore);
			const router = this.dcore.router;
			const start = spyOn(router, "start");
			const addEventListener = spyOn(window, "addEventListener");

			plugins.onCoreInit.call(this.dcore, this.noop);
			start.calls.reset();

			const args = addEventListener.calls.argsFor(0);
			const eventType = args[0] as string;
			const handler = args[1] as Function;
			expect(addEventListener).toHaveBeenCalledTimes(1);
			expect(eventType).toEqual("hashchange");
			expect(typeof handler).toEqual("function");
			handler();

			expect(start).toHaveBeenCalledWith(window.location.hash);
		});

		it("should start current location hash", function (this: TestsContext): void {
			window.location.hash = "/home";
			const plugins = this.extension.install(this.dcore);
			const router = this.dcore.router;
			const start = spyOn(router, "start");

			plugins.onCoreInit.call(this.dcore, this.noop);

			expect(start).toHaveBeenCalledTimes(1);
			expect(start).toHaveBeenCalledWith(window.location.hash);
		});
	});
});