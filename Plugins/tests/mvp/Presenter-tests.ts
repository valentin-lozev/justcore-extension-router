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
            super(
                new core.mvp.View(document.createElement("div")),
                new Book()
            );
        }

        onBookChanged(book: Book): void {
            this.calledContext = this;
        }
    }

    function getPresenter(): BookPresenter {
        return new BookPresenter();
    }

    it("should map to model when a new one is set", () => {
        let presenter = getPresenter();
        spyOn(presenter, "onBookChanged").and.callThrough();
        presenter.onModel(core.mvp.ModelEvents.Change, presenter.onBookChanged);

        let book = new Book();
        presenter.model = book;
        book.change();

        expect(presenter.onBookChanged).toHaveBeenCalledWith(book);
        expect(presenter.calledContext).toBe(presenter);
    });

    it("should not replace its model when the same is set", () => {
        let presenter = getPresenter();
        let book = presenter.model;
        spyOn(book, "off");

        presenter.model = book;

        expect(book.off).not.toHaveBeenCalled();
    });

    it("should remove mapping from its model when a new one is set", () => {
        let presenter = getPresenter();
        presenter.onModel(core.mvp.ModelEvents.Change, presenter.onBookChanged);
        let book = presenter.model;
        spyOn(presenter, "onBookChanged");
        spyOn(book, "off");

        presenter.model = null;
        book.change();

        expect(presenter.onBookChanged).not.toHaveBeenCalled();
        expect(book.off).toHaveBeenCalled();
    });

    it("should return view's dom node when render", () => {
        let presenter = getPresenter();
        spyOn(presenter, "render").and.callThrough();

        let result = presenter.render();

        expect(result).toBe(presenter.view.root);
    });

    it("should reset its model and view when destroy", () => {
        let presenter = getPresenter();
        spyOn(presenter.view, "destroy");

        presenter.destroy();

        expect(presenter.model).toBeNull();
        expect(presenter.view).toBeNull();
    });
});