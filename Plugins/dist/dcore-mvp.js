var dcore;
(function (dcore) {
    var plugins;
    (function (plugins) {
        var mvp;
        (function (mvp) {
            "use strict";
            mvp.ModelEvents = {
                Change: "change",
                Destroy: "destroy"
            };
            function asModel(target) {
                if (typeof target !== "object" || target === null) {
                    return null;
                }
                var model = new Model();
                for (var key in model) {
                    target[key] = model[key];
                }
                return target;
            }
            mvp.asModel = asModel;
            /**
             *  @class dcore.Model
             */
            var Model = (function () {
                function Model() {
                    this.listeners = {};
                }
                /**
                 *  Attaches an event handler to model raised events.
                 *  @param {String} eventType The name of the event.
                 *  @param {Function} handler The event's handler.
                 *  @param {Object} [context] The Handler's context.
                 */
                Model.prototype.on = function (eventType, handler, context) {
                    if (!eventType) {
                        return false;
                    }
                    this.listeners[eventType] = this.listeners[eventType] || [];
                    this.listeners[eventType].push({
                        handler: handler,
                        context: context
                    });
                    return true;
                };
                /**
                 *  Detaches an event handler.
                 *  @param {String} eventType The name of the event.
                 *  @param {Function} handler The handler which must be detached.
                 *  @param {Object} [context] The Handler's context.
                 */
                Model.prototype.off = function (eventType, handler, context) {
                    var listeners = this.listeners[eventType] || [];
                    for (var i = 0, len = listeners.length; i < len; i++) {
                        var listener = listeners[i];
                        if (listener.handler === handler &&
                            listener.context === context) {
                            listener = listeners[len - 1];
                            listeners.length--;
                            return true;
                        }
                    }
                    return false;
                };
                /**
                 *  Notifies the listeners attached for specific event.
                 */
                Model.prototype.notify = function (type, data) {
                    if (!Array.isArray(this.listeners[type])) {
                        return;
                    }
                    this.listeners[type]
                        .slice(0)
                        .forEach(function (listener) { return listener.handler.call(listener.context, data); });
                };
                /**
                 *  Notifies for change event.
                 */
                Model.prototype.change = function () {
                    this.notify(mvp.ModelEvents.Change, this);
                };
                /**
                 *  Notifies for destroy event.
                 */
                Model.prototype.destroy = function () {
                    this.notify(mvp.ModelEvents.Destroy, this);
                };
                return Model;
            }());
            mvp.Model = Model;
        })(mvp = plugins.mvp || (plugins.mvp = {}));
    })(plugins = dcore.plugins || (dcore.plugins = {}));
})(dcore || (dcore = {}));
//# sourceMappingURL=Model.js.map
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var dcore;
(function (dcore) {
    var plugins;
    (function (plugins) {
        var mvp;
        (function (mvp) {
            "use strict";
            mvp.CollectionEvents = {
                AddedItems: "added-items",
                DeletedItems: "deleted-items",
                UpdatedItem: "updated-item"
            };
            function onItemChange(item) {
                this.notify(mvp.CollectionEvents.UpdatedItem, item);
            }
            function onItemDestroy(item) {
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
            var Collection = (function (_super) {
                __extends(Collection, _super);
                function Collection(models) {
                    _super.call(this);
                    this.modelList = [];
                    if (Array.isArray(models)) {
                        this.addRange(models);
                    }
                }
                Object.defineProperty(Collection.prototype, "size", {
                    get: function () {
                        return this.modelList.length;
                    },
                    enumerable: true,
                    configurable: true
                });
                /**
                 *  Adds new model to the list.
                 *  @returns {Boolean}
                 */
                Collection.prototype.add = function (model) {
                    if (model) {
                        this.addRange([model]);
                    }
                };
                /**
                 *  Adds range of models to the list.
                 *  @returns {Boolean}
                 */
                Collection.prototype.addRange = function (models) {
                    var _this = this;
                    if (!Array.isArray(models)) {
                        return;
                    }
                    models.forEach(function (m) {
                        m.on(mvp.ModelEvents.Change, onItemChange, _this);
                        m.on(mvp.ModelEvents.Destroy, onItemDestroy, _this);
                        _this.modelList.push(m);
                    });
                    this.notify(mvp.CollectionEvents.AddedItems, models);
                };
                /**
                 *  Removes a model from the list.
                 *  @returns {Boolean}
                 */
                Collection.prototype.remove = function (model) {
                    this.removeRange([model]);
                };
                /**
                 *  Removes range of models from the list.
                 *  @returns {Boolean}
                 */
                Collection.prototype.removeRange = function (models) {
                    if (!Array.isArray(models)) {
                        return;
                    }
                    var deleted = [];
                    for (var i = 0, len = models.length; i < len; i++) {
                        var model = models[i];
                        var atIndex = this.modelList.indexOf(model);
                        if (atIndex < 0) {
                            continue;
                        }
                        model.off(mvp.ModelEvents.Change, onItemChange, this);
                        model.off(mvp.ModelEvents.Destroy, onItemDestroy, this);
                        this.modelList[atIndex] = this.modelList[this.size - 1];
                        this.modelList.length--;
                        deleted.push(model);
                    }
                    var isModified = deleted.length > 0;
                    if (isModified) {
                        this.notify(mvp.CollectionEvents.DeletedItems, deleted);
                    }
                };
                /**
                 *  Removes all models from the list.
                 *  @returns {Boolean}
                 */
                Collection.prototype.clear = function () {
                    this.removeRange(this.toArray());
                };
                /**
                 *  Determines whether a model is in the list.
                 *  @returns {Boolean}
                 */
                Collection.prototype.contains = function (model) {
                    return this.modelList.indexOf(model) >= 0;
                };
                /**
                 *  Determines whether the list is not empty.
                 *  @returns {Boolean}
                 */
                Collection.prototype.any = function () {
                    return this.size > 0;
                };
                /**
                 *  Returns the models as Array.
                 *  @returns {Array}
                 */
                Collection.prototype.toArray = function () {
                    return this.modelList.slice(0);
                };
                /**
                 *  Performs an action on each model in the list.
                 */
                Collection.prototype.forEach = function (action, context) {
                    this.modelList.forEach(action, context);
                };
                return Collection;
            }(mvp.Model));
            mvp.Collection = Collection;
        })(mvp = plugins.mvp || (plugins.mvp = {}));
    })(plugins = dcore.plugins || (dcore.plugins = {}));
})(dcore || (dcore = {}));
//# sourceMappingURL=Collection.js.map
var dcore;
(function (dcore) {
    var plugins;
    (function (plugins) {
        var mvp;
        (function (mvp) {
            "use strict";
            /**
             *  Author: Martin Chaov
             *  github: https://github.com/mchaov/JSEventsManager
             *  Smart events managing by altering the properties of a HTML element
             */
            // 'use strict'; -> issues with iOS Safari on tablet devices: 09.11.2015
            Element.prototype.trigger = function () { return false; };
            Element.prototype.hasEvent = function () { return false; };
            Element.prototype.detach = function () { return false; };
            Element.prototype.events = false;
            function removeEvent(name) {
                var ev, type, handler, useCapture;
                ev = this.events[name];
                useCapture = ev.useCapture;
                type = ev.eventType;
                handler = ev.handler;
                this.removeEventListener(type, handler, useCapture);
                delete this.eventsList[name];
            }
            function detachEvent(name) {
                var i;
                if (name === undefined || name === '') {
                    for (i in this.eventsList) {
                        removeEvent.call(this, i);
                    }
                    this.eventsList = {};
                }
                else if (this.hasEvent(name)) {
                    removeEvent.call(this, name);
                }
                return this.eventsList;
            }
            function hasEvent(name) {
                return typeof this.eventsList[name] === 'object' ? this.eventsList[name] : false;
            }
            function triggerEvent(name) {
                var evt = this.hasEvent(name);
                if (typeof evt.handler === 'function') {
                    return evt.handler();
                }
                return false;
            }
            function UIEvent(config) {
                if (!(this instanceof UIEvent)) {
                    return new UIEvent(config);
                }
                this.htmlElement = config.htmlElement;
                this.eventConfig = {
                    name: config.name,
                    eventType: config.eventType,
                    handler: config.handler === undefined ? false : config.handler,
                    useCapture: config.useCapture === undefined ? false : config.useCapture,
                    context: config.context === undefined ? null : config.context
                };
                this.init();
            }
            mvp.UIEvent = UIEvent;
            UIEvent.prototype.init = function () {
                if (this.htmlElement.eventsList === undefined) {
                    Object.defineProperties(this.htmlElement, {
                        'eventsList': {
                            writable: true,
                            enumerable: false,
                            configurable: false,
                            value: {}
                        },
                        'events': {
                            enumerable: false,
                            configurable: false,
                            get: function () {
                                return this.eventsList;
                            },
                            set: function (e) {
                                return this.eventsList[e.name] = e;
                            }
                        },
                        'trigger': {
                            writable: false,
                            enumerable: false,
                            configurable: false,
                            value: triggerEvent
                        },
                        'hasEvent': {
                            writable: false,
                            enumerable: false,
                            configurable: false,
                            value: hasEvent
                        },
                        'detach': {
                            writable: false,
                            enumerable: false,
                            configurable: false,
                            value: detachEvent
                        }
                    });
                }
                else if (this.htmlElement.hasEvent(this.eventConfig.name)) {
                    return false;
                }
                this.eventConfig.handler = this.eventConfig.handler.bind(this.eventConfig.context || this);
                this.htmlElement.addEventListener(this.eventConfig.eventType, this.eventConfig.handler, this.eventConfig.useCapture);
                this.htmlElement.events = this.eventConfig;
            };
            Object.defineProperties(UIEvent.prototype, {
                'detach': {
                    writable: false,
                    enumerable: false,
                    configurable: false,
                    value: function (name) {
                        return detachEvent.call(this.htmlElement, name);
                    }
                },
                'trigger': {
                    writable: false,
                    enumerable: false,
                    configurable: false,
                    value: function (name) {
                        return triggerEvent.call(this.htmlElement, name || this.eventConfig.name);
                    }
                }
            });
        })(mvp = plugins.mvp || (plugins.mvp = {}));
    })(plugins = dcore.plugins || (dcore.plugins = {}));
})(dcore || (dcore = {}));
//# sourceMappingURL=UIEvent.js.map
var dcore;
(function (dcore) {
    var plugins;
    (function (plugins) {
        var mvp;
        (function (mvp) {
            "use strict";
            function eventHandler(ev) {
                var target = ev.target;
                var dataset = target.dataset;
                if (!dataset.hasOwnProperty(ev.type)) {
                    return;
                }
                var callbackName = dataset[ev.type];
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
            var View = (function () {
                function View(root, template) {
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
                View.prototype.map = function (eventType, useCapture, selector) {
                    if (useCapture === void 0) { useCapture = false; }
                    mvp.UIEvent({
                        name: eventType,
                        htmlElement: !selector ? this.root : this.root.querySelector(selector),
                        handler: eventHandler,
                        eventType: eventType,
                        context: this,
                        useCapture: useCapture
                    });
                    return this;
                };
                /**
                 *  Renders the view.
                 *  @param {any} [model]
                 *  @returns {HTMLElement}
                 */
                View.prototype.render = function (model) {
                    if (typeof this.template === "function") {
                        this.root.innerHTML = this.template.call(this, model);
                    }
                    return this.root;
                };
                /**
                 *  Removes all elements and mapped events.
                 */
                View.prototype.destroy = function () {
                    if (typeof this.root.detach === "function") {
                        this.root.detach();
                    }
                    this.root = null;
                };
                /**
                 *  Finds an element by given selector.
                 *  @param {String} selector
                 *  @returns {Element}
                 */
                View.prototype.query = function (selector) {
                    return this.root.querySelector(selector);
                };
                /**
                 *  Removes an element by given selector.
                 *  @param {String} selector
                 */
                View.prototype.removeElement = function (selector) {
                    var element = this.query(selector);
                    if (element) {
                        element.parentElement.removeChild(element);
                    }
                    return this;
                };
                /**
                 *  Removes all elements.
                 *  @returns {dcore.View}
                 */
                View.prototype.removeAllElements = function () {
                    while (this.root.firstElementChild) {
                        this.root.removeChild(this.root.firstElementChild);
                    }
                    return this;
                };
                return View;
            }());
            mvp.View = View;
        })(mvp = plugins.mvp || (plugins.mvp = {}));
    })(plugins = dcore.plugins || (dcore.plugins = {}));
})(dcore || (dcore = {}));
//# sourceMappingURL=View.js.map
var dcore;
(function (dcore) {
    var plugins;
    (function (plugins) {
        var mvp;
        (function (mvp) {
            "use strict";
            /**
             *  @class dcore.Presenter
             */
            var Presenter = (function () {
                function Presenter() {
                    this._view = null;
                    this._model = null;
                    this._modelHandlers = {};
                }
                Object.defineProperty(Presenter.prototype, "view", {
                    get: function () {
                        return this._view;
                    },
                    set: function (value) {
                        if (this.view === value) {
                            return;
                        }
                        if (this.view) {
                            this.view.destroy();
                        }
                        this._view = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Presenter.prototype, "model", {
                    get: function () {
                        return this._model;
                    },
                    set: function (model) {
                        var _this = this;
                        if (this._model === model) {
                            return;
                        }
                        Object.keys(this._modelHandlers).forEach(function (type) {
                            var eventHandler = _this._modelHandlers[type];
                            if (_this._model) {
                                _this._model.off(type, eventHandler, _this);
                            }
                            if (model) {
                                model.on(type, eventHandler, _this);
                            }
                        });
                        this._model = model;
                        this.render();
                    },
                    enumerable: true,
                    configurable: true
                });
                /**
                 *  Determins which events to handle when model notifies.
                 */
                Presenter.prototype.onModel = function (eventType, handler) {
                    if (eventType && handler) {
                        this._modelHandlers[eventType] = handler;
                    }
                    return this;
                };
                /**
                 *  Renders its view.
                 */
                Presenter.prototype.render = function () {
                    if (this.view) {
                        return this.view.render(this.model);
                    }
                    return null;
                };
                /**
                 *  Destroys its view and model.
                 */
                Presenter.prototype.destroy = function () {
                    this.view = null;
                    this.model = null;
                };
                return Presenter;
            }());
            mvp.Presenter = Presenter;
        })(mvp = plugins.mvp || (plugins.mvp = {}));
    })(plugins = dcore.plugins || (dcore.plugins = {}));
})(dcore || (dcore = {}));
//# sourceMappingURL=Presenter.js.map
var dcore;
(function (dcore) {
    "use strict";
    var mvp = dcore.plugins.mvp;
    dcore.Instance.prototype.useMVP = function () {
        var that = this;
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
})(dcore || (dcore = {}));
//# sourceMappingURL=install.js.map