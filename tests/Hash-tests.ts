import { Hash } from "../src/Hash";

interface TestsContext {
	hash: Hash;
}

describe("Hash", () => {

	beforeEach(function (this: TestsContext): void {
		this.hash = new Hash();
	});

	it("should have empty string set by default", function (this: TestsContext): void {
		expect(this.hash.value).toEqual("");
	});

	it("should have an empty array of tokens by default", function (this: TestsContext): void {
		expect(Array.isArray(this.hash.tokens)).toBeTruthy();
		expect(this.hash.tokens.length).toEqual(0);
	});

	it("should have empty array of search params by default", function (this: TestsContext): void {
		expect(Array.isArray(this.hash.search)).toBeTruthy();
		expect(this.hash.search.length).toEqual(0);
	});

	it("should set empty string when value is null", function (this: TestsContext): void {
		this.hash.value = null;

		expect(this.hash.value).toEqual("");
		expect(this.hash.tokens.length).toEqual(0);
	});

	it("should set empty string when value is undefined", function (this: TestsContext): void {
		this.hash.value = undefined;

		expect(this.hash.value).toEqual("");
		expect(this.hash.tokens.length).toEqual(0);
	});

	it("should remove '#' from its value", function (this: TestsContext): void {
		this.hash.value = "#/books";

		expect(this.hash.value).toEqual("/books");
	});

	it("should split hash by slashes when no search", function (this: TestsContext): void {
		const hash = "/books/edit/";

		this.hash.value = hash;

		expect(this.hash.value).toEqual(hash);
		expect(this.hash.tokens.length).toEqual(2);
		expect(this.hash.tokens[0]).toEqual("books");
		expect(this.hash.tokens[1]).toEqual("edit");
	});

	it("should split hash by slashes when there is a search", function (this: TestsContext): void {
		this.hash.value = "/books/edit?page=1&id=-11&title=book";

		expect(this.hash.search.length).toEqual(3);
		expect(this.hash.search[0]).toEqual({ key: "page", value: "1" });
		expect(this.hash.search[1]).toEqual({ key: "id", value: "-11" });
		expect(this.hash.search[2]).toEqual({ key: "title", value: "book" });
	});

	it("should parse search params case sensitive", function (this: TestsContext): void {
		this.hash.value = "/books/?Page=1&id=-11&tiTle=Book";

		expect(this.hash.search[0]).toEqual({ key: "Page", value: "1" });
		expect(this.hash.search[1]).toEqual({ key: "id", value: "-11" });
		expect(this.hash.search[2]).toEqual({ key: "tiTle", value: "Book" });
	});

	it("should parse empty search param value as empty string", function (this: TestsContext): void {
		this.hash.value = "/books?id";

		expect(this.hash.search[0]).toEqual({ key: "id", value: "" });
	});
});