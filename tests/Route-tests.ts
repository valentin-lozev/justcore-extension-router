import { Route } from "../src/Route";
import { Hash } from "../src/Hash";

interface TestsContext {
	hash: Hash;
}

describe("Route", () => {

	function noop(): void { }

	beforeEach(function (this: TestsContext): void {
		this.hash = new Hash();
	});

	it("should throw an error when path is invalid", function (this: TestsContext): void {
		expect(() => new Route(null, noop)).toThrow();
		expect(() => new Route(undefined, noop)).toThrow();
		expect(() => new Route("", noop)).toThrow();
	});

	it("should split path without dynamic params by / (slash)", function (this: TestsContext): void {
		const route = new Route("/books/book/edit/", noop);
		const tokens = route.tokens;

		expect(tokens.length).toEqual(3);
		expect(tokens[0]).toEqual({ name: "books", isDynamic: false });
		expect(tokens[1]).toEqual({ name: "book", isDynamic: false });
		expect(tokens[2]).toEqual({ name: "edit", isDynamic: false });
	});

	it("should split path with dynamic params by / (slash)", function (this: TestsContext): void {
		const route = new Route("/books/{id}/edit/{page}", noop);
		const tokens = route.tokens;

		expect(tokens.length).toEqual(4);
		expect(tokens[0]).toEqual({ name: "books", isDynamic: false });
		expect(tokens[1]).toEqual({ name: "id", isDynamic: true });
		expect(tokens[2]).toEqual({ name: "edit", isDynamic: false });
		expect(tokens[3]).toEqual({ name: "page", isDynamic: true });
	});

	it("should parse dynamic params case sensitive", function (this: TestsContext): void {
		const route = new Route("/books/{iD}/{Page}", noop);
		const tokens = route.tokens;

		expect(tokens[1]).toEqual({ name: "iD", isDynamic: true });
		expect(tokens[2]).toEqual({ name: "Page", isDynamic: true });
	});

	it("should not match hash that has different tokens length", function (this: TestsContext): void {
		const route = new Route("/books/{id}/{Page}", noop);
		this.hash.value = "books/1/";

		expect(route.tokens.length).toEqual(3);
		expect(this.hash.tokens.length).toEqual(2);
		expect(route.matches(this.hash)).toBeFalsy();
	});

	it("should not match hash that has different token name", function (this: TestsContext): void {
		const route = new Route("/books/{id}/{Page}", noop);
		this.hash.value = "/book/100/1";

		expect(route.tokens[0].name).toEqual("books");
		expect(this.hash.tokens[0]).toEqual("book");
		expect(route.matches(this.hash)).toBeFalsy();
	});

	it("should match hash tokens when no dynamic params", function (this: TestsContext): void {
		const route = new Route("/books/book/edit", noop);
		this.hash.value = "books/book/edit";

		expect(route.tokens.length).toEqual(3);
		expect(this.hash.tokens.length).toEqual(3);
		expect(route.matches(this.hash)).toBeTruthy();
	});

	it("should match hash tokens when there are dynamic params", function (this: TestsContext): void {
		const route = new Route("/books/{id}/{page}", noop);
		this.hash.value = "books/123/1";

		expect(route.tokens.length).toEqual(3);
		expect(this.hash.tokens.length).toEqual(3);
		expect(route.matches(this.hash)).toBeTruthy();
	});

	it("should match hash tokens when there are dynamic params case insensitive", function (this: TestsContext): void {
		const route = new Route("/BOOKS/{id}/{page}", noop);
		this.hash.value = "/books/123/1";

		expect(route.tokens.length).toEqual(3);
		expect(this.hash.tokens.length).toEqual(3);
		expect(route.matches(this.hash)).toBeTruthy();
	});

	it("should execute callback when no dynamic params and search", function (this: TestsContext): void {
		const callback = { run: noop };
		spyOn(callback, "run");
		const path = "/books";
		const route = new Route(path, callback.run);
		this.hash.value = "/books";

		route.start(this.hash);

		expect(callback.run).toHaveBeenCalledWith({ path: path, params: {} });
	});

	it("should execute callback when there are dynamic params", function (this: TestsContext): void {
		const callback = { run: noop };
		spyOn(callback, "run");
		const path = "/books/{id}/{page}";
		const route = new Route(path, callback.run);
		this.hash.value = "/books/123/1";

		route.start(this.hash);

		expect(callback.run).toHaveBeenCalledWith({ path: path, params: { id: "123", page: "1" } });
	});

	it("should parse dynamic params case sensitive", function (this: TestsContext): void {
		const callback = { run: noop };
		spyOn(callback, "run");
		const path = "/books/{ID}/{Page}";
		const route = new Route(path, callback.run);
		this.hash.value = "/books/123/1";

		route.start(this.hash);

		expect(callback.run).toHaveBeenCalledWith({ path: path, params: { ID: "123", Page: "1" } });
	});

	it("should parse search", function (this: TestsContext): void {
		const callback = { run: noop };
		spyOn(callback, "run");
		const path = "/books";
		const route = new Route(path, callback.run);
		const expectedParams = {
			search: "asd",
			filter: "true"
		};
		this.hash.value = "/books?search=asd&filter=true";

		route.start(this.hash);

		expect(route.params).toEqual(expectedParams);
		expect(callback.run).toHaveBeenCalledWith({ path: path, params: expectedParams });
	});

	it("should execute callback when there are dynamic params and search", function (this: TestsContext): void {
		const callback = { run: noop };
		spyOn(callback, "run");
		const path = "/books/{id}/{page}";
		const route = new Route(path, callback.run);
		this.hash.value = "/books/123/1?search=asd&filter=true";

		route.start(this.hash);

		expect(callback.run).toHaveBeenCalledWith({
			path: path,
			params: {
				id: "123",
				page: "1",
				search: "asd",
				filter: "true"
			}
		});
	});

	it("should parse dynamic params with higher priority than search", function (this: TestsContext): void {
		const callback = { run: noop };
		spyOn(callback, "run");
		const path = "/books/{id}/{page}";
		const route = new Route(path, callback.run);
		this.hash.value = "/books/123/100?id=0&page=0";

		route.start(this.hash);

		expect(callback.run).toHaveBeenCalledWith({
			path: path,
			params: {
				id: "123",
				page: "100"
			}
		});
	});
});