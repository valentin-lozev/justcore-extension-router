/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("Presenter", () => {

    let core = dcore.createOne();
    core.useMVP();

    class Book extends core.mvp.Model {
        constructor() {
            super();
        }
    }

    class BookPresenter extends core.mvp.Presenter<MVPView, Book> {
        calledContext: any;
        constructor() {
            super(new core.mvp.View(document.createElement("div")));
        }

        onBookChanged(book: Book): void {
            this.calledContext = this;
        }
    }

    it("should map to model when a new one is set", () => {
        let book = new Book();
        let presenter = new BookPresenter();
        spyOn(presenter, "onBookChanged").and.callThrough();
        presenter.onModel(core.mvp.ModelEvents.Change, presenter.onBookChanged);
        presenter.model = book;

        book.change();

        expect(presenter.onBookChanged).toHaveBeenCalledWith(book);
        expect(presenter.calledContext).toBe(presenter);
    });

    it("should not replace its model when the same is set", () => {
        let book = new Book();
        let presenter = new BookPresenter();
        presenter.onModel(core.mvp.ModelEvents.Change, presenter.onBookChanged);
        presenter.model = book;
        spyOn(book, "off");

        presenter.model = book;

        expect(book.off).not.toHaveBeenCalled();
    });

    it("should remove mapping from its model when a new one is set", () => {
        let book = new Book();
        let presenter = new BookPresenter();
        presenter.onModel(core.mvp.ModelEvents.Change, presenter.onBookChanged);
        presenter.model = book;
        spyOn(presenter, "onBookChanged");
        spyOn(book, "off");

        presenter.model = null;
        book.change();

        expect(presenter.onBookChanged).not.toHaveBeenCalled();
        expect(book.off).toHaveBeenCalled();
    });

    it("should return view's dom node when render", () => {
        let presenter = new BookPresenter();
        spyOn(presenter, "render").and.callThrough();

        let result = presenter.render();

        expect(result).toBe(presenter.view.root);
    });

    it("should reset its model and view when destroy", () => {
        let presenter = new BookPresenter();
        presenter.model = new Book();
        spyOn(presenter.view, "destroy");

        presenter.destroy();

        expect(presenter.model).toBeNull();
        expect(presenter.view).toBeNull();
    });
});