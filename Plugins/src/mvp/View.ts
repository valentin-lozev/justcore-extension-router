interface MVPView {
    root: HTMLElement;
    render(data?: any): HTMLElement;
    destroy(): void;
}

interface MVPViewEventListenerConfig {
    type: string;
    selector: string;
    listener: (ev: Event) => void;
    useCapture?: boolean;
}

interface Event {
    delegateTarget: HTMLElement;
}

// pollyfill
if (!Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype["matchesSelector"] ||
        Element.prototype["mozMatchesSelector"] ||
        Element.prototype["msMatchesSelector"] ||
        Element.prototype["oMatchesSelector"] ||
        Element.prototype["webkitMatchesSelector"] ||
        function (s: string): boolean {
            let matches = (this.document || this.ownerDocument).querySelectorAll(s);
            let i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {
                continue;
            }
            return i > -1;
        };
}

namespace dcore.plugins.mvp {
    "use strict";

    interface EventListenersMap {
        [type: string]: EventListenerConfig;
    }

    let hasOwnProperty = Object.prototype.hasOwnProperty;

    class EventListenerConfig {
        public type: string;
        public selector: string;
        public listener: (ev: Event) => void;
        public useCapture: boolean;
        public context: MVPView;

        constructor(
            type: string,
            selector: string,
            listener: (ev: Event) => void,
            useCapture: boolean,
            context: MVPView) {
            this.type = type;
            this.selector = selector;
            this.listener = listener;
            this.useCapture = useCapture;
            this.context = context;
        }

        handleEvent(ev: Event): void {
            let target = <HTMLElement>ev.target;
            do {
                if (!target.matches(this.selector)) {
                    target = target.parentElement;
                    continue;
                }

                ev.delegateTarget = target;
                this.listener.call(this.context, ev);
                return;
            } while (target && target !== this.context.root);
        }
    }

    /**
     *  @class dcore.View
     *  @property {HTMLElement} root
     */
    export class View implements MVPView {
        private eventListeners: EventListenersMap = {};
        public root: HTMLElement;

        constructor(root: HTMLElement) {
            this.root = root;
        }

        /**
         *  Renders the view.
         *  @returns {HTMLElement}
         */
        render(data?: any): HTMLElement {
            return this.root;
        }

        /**
         *  Adds event listeners to its root element by delegating to given selectors.
         * @param {Array} configs
         */
        addEventListeners(configs: MVPViewEventListenerConfig[]): this {
            if (Array.isArray(configs)) {
                configs.forEach(c => this.addEventListener(c));
            }

            return this;
        }

        /**
         *  Adds an event listener to its root element by delegating to given selector.
         * @param {Object} config
         */
        addEventListener(config: MVPViewEventListenerConfig): this {
            if (typeof config !== "object" || config === null) {
                throw new TypeError("Listener config must be passed as object.");
            }

            let eventType = config.type;
            if (typeof eventType !== "string") {
                throw new TypeError("Event type must be a string.");
            }

            let configObj = new EventListenerConfig(
                eventType,
                config.selector,
                config.listener,
                !!config.useCapture,
                this
            );

            let key = `${eventType} ${configObj.selector} ${configObj.useCapture}`;
            if (hasOwnProperty.call(this.eventListeners, key)) {
                return this;
            }

            configObj.handleEvent = configObj.handleEvent.bind(configObj);
            this.root.addEventListener(eventType, configObj.handleEvent, configObj.useCapture);
            this.eventListeners[key] = configObj;
            return this;
        }

        /**
         *  Destroys the view.
         */
        destroy(): void {
            Object
                .keys(this.eventListeners)
                .forEach(type => {
                    let listener = this.eventListeners[type];
                    this.root.removeEventListener(listener.type, listener.handleEvent, listener.useCapture);
                    delete this.eventListeners[type];
                });;

            this.eventListeners = {};
            this.root = null;
        }
    }
}