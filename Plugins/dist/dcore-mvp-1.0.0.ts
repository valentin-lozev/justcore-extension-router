interface MVPModel {
    on(eventType: string, handler: (data?: any) => void, context?: Object): boolean;
    off(eventType: string, handler: (data?: any) => void, context?: Object): boolean;
    notify(type: string, data?: any): void;
    change(): void;
    destroy(): void;
}

namespace dcore.plugins.mvp {
    "use strict";

    export const ModelEvents = {
        Change: "change",
        Destroy: "destroy"
    };

    export function asModel<T>(target: T): T & MVPModel {
        if (typeof target !== "object" || target === null) {
            return null;
        }

        let model = new Model();
        for (let key in model) {
            target[key] = model[key];
        }

        return <T & MVPModel>target;
    }

    /**
     *  @class dcore.Model
     */
    export class Model implements MVPModel {
        private listeners: Object = {};

        /**
         *  Attaches an event handler to model raised events.
         *  @param {String} eventType The name of the event.
         *  @param {Function} handler The event's handler.
         *  @param {Object} [context] The Handler's context.
         */
        on(eventType: string, handler: (data?: any) => void, context?: Object): boolean {
            if (!eventType) {
                return false;
            }

            this.listeners[eventType] = this.listeners[eventType] || [];
            this.listeners[eventType].push({
                handler: handler,
                context: context
            });
            return true;
        }

        /**
         *  Detaches an event handler.
         *  @param {String} eventType The name of the event.
         *  @param {Function} handler The handler which must be detached.
         *  @param {Object} [context] The Handler's context.
         */
        off(eventType: string, handler: (data?: any) => void, context?: Object): boolean {
            let listeners = this.listeners[eventType] || [];
            for (let i = 0, len = listeners.length; i < len; i++) {
                let listener = listeners[i];
                if (listener.handler === handler &&
                    listener.context === context) {
                    listener = listeners[len - 1];
                    listeners.length--;
                    return true;
                }
            }

            return false;
        }

        /**
         *  Notifies the listeners attached for specific event.
         */
        notify(type: string, data?: any): void {
            if (!Array.isArray(this.listeners[type])) {
                return;
            }

            this.listeners[type]
                .slice(0)
                .forEach(listener => listener.handler.call(listener.context, data));
        }

        /**
         *  Notifies for change event.
         */
        change(): void {
            this.notify(ModelEvents.Change, this);
        }

        /**
         *  Notifies for destroy event.
         */
        destroy(): void {
            this.notify(ModelEvents.Destroy, this);
        }
    }
}
interface MVPCollection<TModel extends MVPModel> extends MVPModel {
    size: number;
    add(model: TModel): void;
    addRange(models: TModel[]): void;
    remove(model: TModel): void;
    removeRange(models: TModel[]): void;
    clear(): void;
    contains(model: TModel): boolean;
    any(): boolean;
    toArray(): TModel[];
    forEach(action: (item: TModel, index: number, array: TModel[]) => void, context: any): void;
}

namespace dcore.plugins.mvp {
    "use strict";

    export const CollectionEvents = {
        AddedItems: "added-items",
        DeletedItems: "deleted-items",
        UpdatedItem: "updated-item"
    };

    function onItemChange(item): void {
        this.notify(CollectionEvents.UpdatedItem, item);
    }

    function onItemDestroy(item): void {
        this.removeRange([item]);
    }

    /**
     *  Composite pattern on dcore.Model.
     *  Holds the models in list.
     *  Iterating over the models is not in the order of their insertion.
     *  It is usefull when you want to listen for collection of models.
     *  @class dcore.Collection
     *  @augments dcore.Model
     */
    export class Collection<TModel extends MVPModel> extends Model implements MVPCollection<TModel> {
        private modelList: TModel[] = [];

        constructor(models?: TModel[]) {
            super();
            if (Array.isArray(models)) {
                this.addRange(models);
            }
        }

        get size(): number {
            return this.modelList.length;
        }

        /**
         *  Adds new model to the list.
         *  @returns {Boolean}
         */
        add(model: TModel): void {
            if (model) {
                this.addRange([model]);
            }
        }

        /**
         *  Adds range of models to the list.
         *  @returns {Boolean}
         */
        addRange(models: TModel[]): void {
            if (!Array.isArray(models)) {
                return;
            }

            models.forEach(m => {
                m.on(ModelEvents.Change, onItemChange, this);
                m.on(ModelEvents.Destroy, onItemDestroy, this);
                this.modelList.push(m);
            });

            this.notify(CollectionEvents.AddedItems, models);
        }

        /**
         *  Removes a model from the list.
         *  @returns {Boolean}
         */
        remove(model: TModel): void {
            this.removeRange([model]);
        }

        /**
         *  Removes range of models from the list.
         *  @returns {Boolean}
         */
        removeRange(models: TModel[]): void {
            if (!Array.isArray(models)) {
                return;
            }

            let deleted = [];
            for (let i = 0, len = models.length; i < len; i++) {
                let model = models[i];
                let atIndex = this.modelList.indexOf(model);
                if (atIndex < 0) {
                    continue;
                }

                model.off(ModelEvents.Change, onItemChange, this);
                model.off(ModelEvents.Destroy, onItemDestroy, this);
                this.modelList[atIndex] = this.modelList[this.size - 1];
                this.modelList.length--;
                deleted.push(model);
            }

            let isModified = deleted.length > 0;
            if (isModified) {
                this.notify(CollectionEvents.DeletedItems, deleted);
            }
        }

        /**
         *  Removes all models from the list.
         *  @returns {Boolean}
         */
        clear(): void {
            this.removeRange(this.toArray());
        }

        /**
         *  Determines whether a model is in the list.
         *  @returns {Boolean}
         */
        contains(model: TModel): boolean {
            return this.modelList.indexOf(model) >= 0;
        }

        /**
         *  Determines whether the list is not empty.
         *  @returns {Boolean}
         */
        any(): boolean {
            return this.size > 0;
        }

        /**
         *  Returns the models as Array.
         *  @returns {Array}
         */
        toArray(): TModel[] {
            return this.modelList.slice(0);
        }

        /**
         *  Performs an action on each model in the list.
         */
        forEach(action: (item: TModel, index: number, array: TModel[]) => void, context: any): void {
            this.modelList.forEach(action, context);
        }
    }
}
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
namespace dcore.plugins.mvp {
    "use strict";

    /**
     *  @class dcore.Presenter
     */
    export class Presenter<TView extends MVPView, TModel> {
        private _model: TModel = null;
        private _view: TView = null;
        private _modelHandlers: Object = {};

        constructor(view: TView) {
            this._view = view;
        }

        get view(): TView {
            return this._view;
        }

        get model(): TModel {
            return this._model;
        }

        set model(model: TModel) {
            if (this.model === model) {
                return;
            }

            let shouldDetach = this.model instanceof Model;
            let shouldAttach = model instanceof Model;
            Object
                .keys(this._modelHandlers)
                .forEach(type => {
                    let eventHandler = this._modelHandlers[type];
                    if (shouldDetach) {
                        this.model["off"](type, eventHandler, this);
                    }

                    if (shouldAttach) {
                        model["on"](type, eventHandler, this);
                    }
                });

            this._model = model;
        }

        /**
         *  Determins which events to handle when model notifies. 
         */
        onModel(eventType: string, handler: (data?: any) => void): this {
            if (eventType && handler) {
                this._modelHandlers[eventType] = handler;
            }

            return this;
        }

        /**
         *  Renders its view.
         */
        render(): HTMLElement {
            return this.view.render(this.model);
        }

        /**
         *  Destroys its model and view.
         */
        destroy(): void {
            this.model = null;
            this._view.destroy();
            this._view = null;
        }
    }
}
interface DCore {
    useMVP(): void;
    mvp: MVPPlugin;
}

interface DSandbox {
    asMVPModel<T>(target: T): T & dcore.plugins.mvp.Model;
}

interface MVPPlugin {
    Model: typeof dcore.plugins.mvp.Model;
    asMVPModel<T>(target: T): T & MVPModel;
    ModelEvents: {
        Change: string,
        Destroy: string
    };
    Collection: typeof dcore.plugins.mvp.Collection;
    CollectionEvents: {
        AddedItems: string,
        DeletedItems: string,
        UpdatedItem: string
    };
    View: typeof dcore.plugins.mvp.View;
    Presenter: typeof dcore.plugins.mvp.Presenter;
}

namespace dcore {
    "use strict";

    import mvp = plugins.mvp;

    export interface Instance {
        useMVP(): void;
        mvp: MVPPlugin;
    }

    export interface DefaultSandbox {
        asMVPModel<T>(target: T): T & MVPModel;
    }

    Instance.prototype.useMVP = function (): void {
        let that = <DCore>this;
        if (that.mvp) {
            return;
        }

        that.mvp = {
            Model: mvp.Model,
            asMVPModel: mvp.asModel,
            ModelEvents: mvp.ModelEvents,
            Collection: mvp.Collection,
            CollectionEvents: mvp.CollectionEvents,
            View: mvp.View,
            Presenter: mvp.Presenter,
        };
        that.Sandbox.prototype.asMVPModel = mvp.asModel;
    };
}