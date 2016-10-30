/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("View", () => {

    let core = dcore.createOne();
    core.useMVP();

    class TestView extends core.mvp.View {
        constructor() {
            super(document.createElement("div"));
        }

        static getHeadingHTML(): string {
            return "<h1>Heading</h1>";
        }

        render(): HTMLElement {
            this.root.innerHTML = TestView.getHeadingHTML();
            return this.root;
        }

        handleClick(ev: Event): void {
            return;
        }
    }

    it("should return its root when render", () => {
        let view = new TestView();

        expect(view.render()).toBe(view.root);
    });

    it("should handle added event listener", () => {
        let view = new TestView();
        spyOn(view, "handleClick");
        view.addEventListener({
            type: "click",
            selector: "div",
            listener: view.handleClick
        });

        let ev = new Event("click");
        view.root.dispatchEvent(ev);

        expect(view.handleClick).toHaveBeenCalledWith(ev);
        expect(ev.delegateTarget).toBe(view.root);
    });

    it("should handle added event listener in capturing phase", () => {
        let view = new TestView();
        spyOn(view, "handleClick");
        view.addEventListener({
            type: "click",
            selector: "h1",
            listener: view.handleClick,
            useCapture: true
        });
        view.render();

        let ev = new Event("click", {
            bubbles: false
        });
        let heading = view.root.querySelector("h1");
        heading.dispatchEvent(ev);

        expect(view.handleClick).toHaveBeenCalledWith(ev);
        expect(ev.delegateTarget).toBe(heading);
    });

    it("should not add already added event listener", () => {
        let view = new TestView();
        spyOn(view, "handleClick");
        let config = {
            type: "click",
            selector: "div",
            listener: view.handleClick
        };

        view.addEventListeners([config, config, config]);
        let ev = new Event("click");
        view.root.dispatchEvent(ev);

        expect(view.handleClick).toHaveBeenCalledTimes(1);
    });

    it("should handle added event by delegating", () => {
        let view = new TestView();
        spyOn(view, "handleClick");
        view.addEventListener({
            type: "click",
            selector: "h1",
            listener: view.handleClick
        });
        view.render();

        let ev = new Event("click", {
            bubbles: true
        });
        let heading = view.root.querySelector("h1");
        heading.dispatchEvent(ev);

        expect(view.handleClick).toHaveBeenCalledWith(ev);
        expect(view.handleClick).toHaveBeenCalledTimes(1);
        expect(ev.delegateTarget).toBe(heading);
    });

    it("should remove events when destroy", () => {
        let view = new TestView();
        spyOn(view, "handleClick");
        let root = view.root;
        view.addEventListeners([
            {
                type: "click",
                selector: "div",
                listener: view.handleClick
            },
            {
                type: "click",
                selector: "h1",
                listener: view.handleClick
            }
        ]);
        view.render();

        view.destroy();
        root.dispatchEvent(new Event("click"));

        expect(view.handleClick).not.toHaveBeenCalled();
        expect(view.root).toBeNull();
    });
});