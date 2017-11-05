import { Router } from "./Router";

function matchedRoute(this: dcore.Sandbox): router.RouteMatch {
	return this._extensionsOnlyCore.router.current;
}

function onCoreInitPlugin(this: dcore.Core, next: dcore.Func<void>): void {
	next();

	window.addEventListener("hashchange", () => this.router.start(window.location.hash));
	this.router.start(window.location.hash);
}

export function router(): dcore.Extension {
	return {
		name: "router",
		install: (dcore: dcore.Core) => {
			(function (dcore: dcore.Core, sandbox: dcore.Sandbox) {
				dcore.router = new Router(dcore);
				sandbox.matchedRoute = matchedRoute;
			}(dcore, dcore.Sandbox.prototype));

			return {
				onCoreInit: onCoreInitPlugin
			};
		}
	};
}