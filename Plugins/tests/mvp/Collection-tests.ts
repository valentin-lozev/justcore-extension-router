/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("Collection", () => {

    let core = dcore.createOne();
    core.useMVP();

    class Book extends core.mvp.Model {
        constructor() {
            super();
        }
    }

    function getBooks(count: number): Book[] {
        let result = new Array(count);
        for (let i = 0; i < count; i++) {
            result[i] = new Book();
        }

        return result;
    }

    function getCollection(booksCount: number = 0): MVPCollection<Book> {
        return new core.mvp.Collection<Book>(getBooks(booksCount));
    }

    it("should be an instance of Model", () => {
        expect(getCollection() instanceof core.mvp.Model).toBeTruthy();
    });

    it("should be empty when instantiated", () => {
        expect(getCollection().size).toEqual(0);
    });

    describe("Adding", () => {
        it("should add a new item", () => {
            let collection = getCollection();
            let book = new Book();

            collection.add(book);

            expect(collection.size).toEqual(1);
            expect(collection.toArray()[0]).toBe(book);
        });

        it("should notify when add an item", () => {
            let collection = getCollection();
            let book = new Book();
            let spy = jasmine.createSpyObj("spy", ["handler"]);
            collection.on(core.mvp.CollectionEvents.AddedItems, spy.handler);

            collection.add(book);

            expect(spy.handler).toHaveBeenCalledWith([book]);
        });

        it("should add range of items", () => {
            let collection = getCollection();
            let books = getBooks(10);

            collection.addRange(books);

            expect(collection.size).toEqual(books.length);
            expect(collection.toArray()).toEqual(books);
        });

        it("should notify when add range of items", () => {
            let collection = getCollection();
            let books = getBooks(20);
            let spy = jasmine.createSpyObj("spy", ["handler"]);
            collection.on(core.mvp.CollectionEvents.AddedItems, spy.handler);

            collection.addRange(books);

            expect(spy.handler).toHaveBeenCalledWith(books);
            expect(spy.handler).toHaveBeenCalledTimes(1);
        });

        it("should returns an array of its items", () => {
            let collection = getCollection(10);

            let books = collection.toArray();

            expect(books.length).toEqual(10);
            books.forEach(b => expect(collection.contains(b)).toBeTruthy());
        });
    });

    describe("Deleting", () => {
        it("should remove an existing item", () => {
            let collection = getCollection(1);
            let book = collection.toArray()[0];

            collection.remove(book);

            expect(collection.size).toEqual(0);
        });

        it("should notify when delete an item", () => {
            let collection = getCollection(1);
            let book = collection.toArray()[0];
            let spy = jasmine.createSpyObj("spy", ["handler"]);
            collection.on(core.mvp.CollectionEvents.DeletedItems, spy.handler);

            collection.remove(book);

            expect(spy.handler).toHaveBeenCalledWith([book]);
            expect(spy.handler).toHaveBeenCalledTimes(1);
        });

        it("should remove a range of items", () => {
            let collection = getCollection(10);
            let books = collection.toArray();

            collection.removeRange(books);

            expect(collection.size).toEqual(0);
        });

        it("should notify when delete items", () => {
            let collection = getCollection(10);
            let books = collection.toArray();
            let spy = jasmine.createSpyObj("spy", ["handler"]);
            collection.on(core.mvp.CollectionEvents.DeletedItems, spy.handler);

            collection.removeRange(books);

            expect(spy.handler).toHaveBeenCalledWith(books);
            expect(spy.handler).toHaveBeenCalledTimes(1);
        });

        it("should detach an item when it was deleted", () => {
            let collection = getCollection(1);
            let book = collection.toArray()[0];
            let spy = jasmine.createSpyObj("spy", ["handler"]);
            collection.on(core.mvp.CollectionEvents.UpdatedItem, spy.handler);
            collection.remove(book);

            book.change();

            expect(spy.handler).not.toHaveBeenCalled();
        });

        it("should remove all items when clear is being invoked", () => {
            let collection = getCollection(20);
            let spy = jasmine.createSpyObj("spy", ["handler"]);
            collection.on(core.mvp.CollectionEvents.DeletedItems, spy.handler);

            collection.clear();

            expect(spy.handler).toHaveBeenCalledTimes(1);
            expect(collection.size).toEqual(0);
        });

        it("should delete an item on item destroy", () => {
            let collection = getCollection(20);
            let books = collection.toArray();
            let spy = jasmine.createSpyObj("spy", ["handler"]);
            collection.on(core.mvp.CollectionEvents.DeletedItems, spy.handler);

            books.forEach(book => {
                let size = collection.size;
                book.destroy();
                expect(spy.handler).toHaveBeenCalledWith([book]);
                expect(collection.size).toEqual(size - 1);
            });

            expect(spy.handler).toHaveBeenCalledTimes(books.length);
            expect(collection.size).toBe(0);
        });
    });

    describe("Updating", () => {
        it("should notify when item was updated", () => {
            let collection = getCollection(10);
            let books = collection.toArray();
            let spy = jasmine.createSpyObj("spy", ["handler"]);
            collection.on(core.mvp.CollectionEvents.UpdatedItem, spy.handler);

            books.forEach(book => {
                book.change();
                expect(spy.handler).toHaveBeenCalledWith(book);
            });
            expect(spy.handler).toHaveBeenCalledTimes(books.length);
        });
    });

    it("should return false when does not constain given item", () => {
        let collection = getCollection();
        let book = new Book();

        expect(collection.contains(book)).toBeFalsy();
    });

    it("should return true when constains a given item", () => {
        let collection = getCollection(1);
        let book = collection.toArray()[0];

        expect(collection.contains(book)).toBeTruthy();
    });

    it("any should return false when constains no items", () => {
        let collection = getCollection();

        expect(collection.any()).toBeFalsy();
    });

    it("any should return true when constains at least one item", () => {
        let collection = getCollection(1);

        expect(collection.any()).toBeTruthy();
    });
});