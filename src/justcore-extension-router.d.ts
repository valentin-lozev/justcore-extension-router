declare global {

	namespace jc {
		interface Core {
			router?: Router;
		}

		interface Sandbox {
			matchedRoute?(): RouteMatch;
		}

		interface PluginsMap {
			onRouteAdd?(next: () => void, path: string, onStart: (match: RouteMatch) => void): void;
			onRouteStart?(next: () => void, hash: string): void;
		}

		interface RouteMatch {
			path: string;
			params: { [key: string]: string; };
		}

		interface Router {
			/**
			 *  A default hash.
			 */
			defaultHash?: string;

			/**
			 *  Returns all registered paths.
			 */
			paths: string[];

			/**
			 *  Returns the current route.
			 */
			current: RouteMatch;

			/**
			 *  Registers a route by given url path.
			 *  When url's hash is changed it executes a callback with populated dynamic routes and search parameters.
			 *  Dynamic route param can be registered with {yourParam}.
			 */
			route(path: string, onStart: (match: RouteMatch) => void): void;

			/**
			 *  Starts hash url if such is registered, if not, it starts the default one.
			 */
			start(hash: string): void;
		}
	}
}

export function router(): jc.Extension;