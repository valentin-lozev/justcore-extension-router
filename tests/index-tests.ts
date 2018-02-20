import { router } from "../src/index";
import { Router } from "../src/Router";
import { Core } from "justcore";

interface TestsContext {
	core: jc.Core;
	extension: jc.Extension;
	noop: jc.Func;
}

describe("index", () => {

	beforeEach(function (this: TestsContext): void {
		this.core = new Core();
		this.extension = router();
		this.noop = function (): any { };
	});

	it("should have router as name", function (this: TestsContext): void {
		expect(this.extension.name).toEqual("router");
	});

	describe("core", () => {
		it("should be extended with router func", function (this: TestsContext): void {
			this.extension.install(this.core);

			expect(this.core.router instanceof Router).toEqual(true);
		});
	});

	describe("sandbox", () => {
		it("should be extended with matchedRoute func", function (this: TestsContext): void {
			this.extension.install(this.core);

			const sandbox = new this.core.Sandbox(this.core, "module", "instance");

			expect(typeof sandbox.matchedRoute).toEqual("function");
			expect(sandbox.matchedRoute()).toEqual(this.core.router.current);
		});
	});

	describe("onCoreInit", () => {

		it("should be defined", function (this: TestsContext): void {
			const plugins = this.extension.install(this.core);

			expect(typeof plugins.onCoreInit).toEqual("function");
		});

		it("should call next", function (this: TestsContext): void {
			const next = spyOn(this, "noop");

			const plugins = this.extension.install(this.core);
			plugins.onCoreInit.call(this.core, next);

			expect(next).toHaveBeenCalledTimes(1);
		});

		it("should start listening for hashchange", function (this: TestsContext): void {
			window.location.hash = "/home";
			const plugins = this.extension.install(this.core);
			const router = this.core.router;
			const start = spyOn(router, "start");
			const addEventListener = spyOn(window, "addEventListener");

			plugins.onCoreInit.call(this.core, this.noop);
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
			const plugins = this.extension.install(this.core);
			const router = this.core.router;
			const start = spyOn(router, "start");

			plugins.onCoreInit.call(this.core, this.noop);

			expect(start).toHaveBeenCalledTimes(1);
			expect(start).toHaveBeenCalledWith(window.location.hash);
		});
	});
});