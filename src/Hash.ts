export interface SearchParam {
	key: string;
	value: string;
}

function parseSearch(hash: string, searchIndex: number): SearchParam[] {
	if (searchIndex < 0) {
		return [];
	}

	return hash
		.substring(searchIndex + 1)
		.split("&")
		.map(parseSearchPair);
}

function parseSearchPair(keyValuePair: string): SearchParam {
	const args = keyValuePair.split("=");
	return {
		key: args[0],
		value: args[1] || ""
	};
}

function parseTokens(hash: string, searchIndex: number): string[] {
	return hashWithoutSearch(hash, searchIndex)
		.split("/")
		.filter(token => token !== "");
}

function hashWithoutSearch(hash: string, searchIndex: number): string {
	return searchIndex < 0 ? hash : hash.substring(0, searchIndex);
}

/**
 *  Represents the hash string in a url.
 */
export class Hash {

	private _value = "";
	private _searchParams: SearchParam[] = [];
	private _tokens: string[] = [];

	get value(): string {
		return this._value;
	}

	set value(hash: string) {
		hash = hash || "";
		hash = hash[0] !== "#" ? hash : hash.substring(1);
		const searchIndex = hash.indexOf("?");

		this._value = hash;
		this._searchParams = parseSearch(hash, searchIndex);
		this._tokens = parseTokens(hash, searchIndex);
	}

	get tokens(): string[] {
		return this._tokens.slice(0);
	}

	get search(): SearchParam[] {
		return this._searchParams.slice(0);
	}
}