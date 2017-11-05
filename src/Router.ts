import { Hash } from "./Hash";
import { Route, RouteParamsList } from "./Route";

export class Router implements router.Router {

	defaultHash: string;
	private routes: { [path: string]: Route; };
	private hash: Hash;
	private currentRoute: Route;

	constructor(dcore: dcore.Core) {
		this.defaultHash = null;
		this.routes = Object.create(null);
		this.hash = new Hash();
		this.currentRoute = null;

		this.route = dcore.createPipeline("onRouteAdd", this.route);
		this.start = dcore.createPipeline("onRouteStart", this.start);
	}

	get paths(): string[] {
		return Object.keys(this.routes);
	}

	get current(): router.RouteMatch {
		const current = this.currentRoute;
		return {
			path: current ? current.path : null,
			params: current ? current.params : null
		};
	}

	route(path: string, onStart: (match: router.RouteMatch) => void): void {
		if (path in this.routes) {
			throw new Error(`route(): ${path} has already been added`);
		}

		this.routes[path] = new Route(path, onStart);
	}

	start(hash: string): void {
		this.hash.value = hash;
		this.currentRoute = this.__findRoute();
		if (this.currentRoute) {
			this.currentRoute.start(this.hash);
			return;
		}

		if (typeof this.defaultHash === "string") {
			this.__startDefaultRoute(hash);
		} else {
			console.warn(`start(): No route matches ${hash}`);
		}
	}

	private __findRoute(): Route {
		const paths = this.paths;
		for (let i = 0, len = paths.length; i < len; i++) {
			const path = paths[i];
			const route = this.routes[path];
			if (route.matches(this.hash)) {
				return route;
			}
		}

		return null;
	}

	private __startDefaultRoute(hash: string): void {
		window.history.replaceState(
			null,
			null,
			`${window.location.pathname}#${this.defaultHash}`
		);

		this.hash.value = this.defaultHash;
		this.currentRoute = this.__findRoute();
		if (this.currentRoute) {
			this.currentRoute.start(this.hash);
		} else {
			console.warn(`start(): No route handler for ${hash}`);
		}
	}
}