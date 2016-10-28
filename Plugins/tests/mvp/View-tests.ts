/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("View", () => {

    let core = dcore.createOne();
    core.useMVP();

    function createDiv(): HTMLElement {
        let div = document.createElement("div");
        div.innerHTML = '<div data-click="handleClick"></div>';
        return <HTMLElement>div.firstElementChild;
    }

    function template(model: any): string {
        return "<h1>" + model + "</h1>";
    }

    class TestView extends core.mvp.View {
        constructor() {
            super(createDiv(), template);
            this.map("click");
        }

        handleClick(ev: Event): void {
            return;
        }
    }

    function getView(): TestView {
        return new TestView();
    }

    it("should return its root when render", () => {
        let view = getView();

        expect(view.render()).toBe(view.root);
    });

    it("should render when having template", () => {
        let view = getView();
        view.render("Heading");

        expect(view.root.innerText).toEqual("Heading");
        expect(view.root.firstElementChild.nodeName).toEqual("H1");
    });

    it("should return an html element when query its root", () => {
        let view = getView();
        view.render();

        let result = view.query("h1");
        let nullElement = view.query("span");

        expect(result.tagName).toEqual("H1");
        expect(nullElement).toBeNull();
    });

    it("should return null when query unexisting element", () => {
        let view = getView();

        let result = view.query("span");

        expect(result).toBeNull();
    });

    it("should remove element", () => {
        let view = getView();
        view.render();

        view.removeElement("h1");

        expect(view.query("h1")).toBeNull();
    });

    it("should remove all elements", () => {
        let view = getView();
        view.render();

        view.removeAllElements();

        expect(view.root.childElementCount).toEqual(0);
    });

    it("should map event to its container", () => {
        let view = getView();

        expect(view.root.hasEvent("click")).toBeTruthy();
    });

    it("should map event to custom element", () => {
        let view = getView();
        view.render();

        view.map("click", false, "h1");

        expect(view.query("h1").hasEvent("click")).toBeTruthy();
    });

    it("should handle mapped event", () => {
        let view = getView();
        spyOn(view, "handleClick");

        let ev = new Event("click");
        view.root.dispatchEvent(ev);

        expect(view.handleClick).toHaveBeenCalledWith(ev);
        expect(view.handleClick).toHaveBeenCalledTimes(1);
    });

    it("should remove events when destroy", () => {
        let view = getView();
        spyOn(view, "handleClick");
        let root = view.root;

        view.destroy();
        root.dispatchEvent(new Event("click"));

        expect(view.handleClick).not.toHaveBeenCalled();
        expect(view.root).toBeNull();
        expect(root.hasEvent("click")).toBeFalsy();
    });

    it("should support chaining for all methods that return nothing", () => {
        let view = getView();

        let chaining = () => {
            view.map("change")
                .removeElement("div")
                .removeAllElements()
                .destroy();
        };

        expect(chaining).not.toThrow();
    });
});