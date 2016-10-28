interface MVPView {
    render(model: any): HTMLElement;
    destroy(): void;
}

namespace dcore.plugins.mvp {
    "use strict";

    function eventHandler(ev: Event): void {
        let target = <HTMLElement>ev.target;
        let dataset = target.dataset;
        if (!dataset.hasOwnProperty(ev.type)) {
            return;
        }

        let callbackName = dataset[ev.type];
        if (typeof this[callbackName] === "function") {
            this[callbackName](ev);
            return;
        }
    }

    /**
     *  @class dcore.View
     *  @param {HTMLElement} domNode The view's html element.
     *  @param {Function} [template] A function which renders view's html element.
     *  @property {HTMLElement} root
     *  @property {Function} [template]
     */
    export class View implements MVPView {
        public template: (model: any) => string;
        public root: HTMLElement;

        constructor(root: HTMLElement, template?: (model: any) => string) {
            if (!root) {
                throw new Error("Root must be an html element.");
            }

            this.root = root;
            this.template = template;
        }

        /**
         *  Maps a view action to given ui event disptached from html element.
         *  Mapping works by using the dataset - e.g data-click="handleClick" maps to handleClick.
         * @param eventType
         * @param useCapture
         * @param selector
         */
        map(eventType: string, useCapture: boolean = false, selector?: string): this {
            UIEvent({
                name: eventType,
                htmlElement: !selector ? this.root : this.root.querySelector(selector),
                handler: eventHandler,
                eventType: eventType,
                context: this,
                useCapture: useCapture
            });

            return this;
        }

        /**
         *  Renders the view.
         *  @param {any} [model]
         *  @returns {HTMLElement}
         */
        render(model?: any): HTMLElement {
            if (typeof this.template === "function") {
                this.root.innerHTML = this.template.call(this, model);
            }

            return this.root;
        }

        /**
         *  Removes all elements and mapped events.
         */
        destroy(): void {
            if (typeof this.root.detach === "function") {
                this.root.detach();
            }
            
            this.root = null;
        }

        /**
         *  Finds an element by given selector.
         *  @param {String} selector
         *  @returns {Element}
         */
        query(selector: string): Element {
            return this.root.querySelector(selector);
        }

        /**
         *  Removes an element by given selector.
         *  @param {String} selector
         */
        removeElement(selector: string): this {
            let element = this.query(selector);
            if (element) {
                element.parentElement.removeChild(element);
            }

            return this;
        }

        /**
         *  Removes all elements.
         *  @returns {dcore.View}
         */
        removeAllElements(): this {
            while (this.root.firstElementChild) {
                this.root.removeChild(this.root.firstElementChild);
            }

            return this;
        }
    }
}