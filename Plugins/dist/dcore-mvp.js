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
// pollyfill
if (!Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype["matchesSelector"] ||
            Element.prototype["mozMatchesSelector"] ||
            Element.prototype["msMatchesSelector"] ||
            Element.prototype["oMatchesSelector"] ||
            Element.prototype["webkitMatchesSelector"] ||
            function (s) {
                var matches = (this.document || this.ownerDocument).querySelectorAll(s);
                var i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) {
                    continue;
                }
                return i > -1;
            };
}
var dcore;
(function (dcore) {
    var plugins;
    (function (plugins) {
        var mvp;
        (function (mvp) {
            "use strict";
            var hasOwnProperty = Object.prototype.hasOwnProperty;
            var EventListenerConfig = (function () {
                function EventListenerConfig(type, selector, listener, useCapture, context) {
                    this.type = type;
                    this.selector = selector;
                    this.listener = listener;
                    this.useCapture = useCapture;
                    this.context = context;
                }
                EventListenerConfig.prototype.handleEvent = function (ev) {
                    var target = ev.target;
                    do {
                        if (!target.matches(this.selector)) {
                            target = target.parentElement;
                            continue;
                        }
                        ev.delegateTarget = target;
                        this.listener(ev);
                        return;
                    } while (target && target !== this.context.root);
                };
                return EventListenerConfig;
            }());
            /**
             *  @class dcore.View
             *  @property {HTMLElement} root
             */
            var View = (function () {
                function View(root) {
                    this.eventListeners = {};
                    this.root = root;
                }
                /**
                 *  Renders the view.
                 *  @returns {HTMLElement}
                 */
                View.prototype.render = function (data) {
                    return this.root;
                };
                /**
                 *  Adds event listeners to its root element by delegating to given selectors.
                 * @param {Array} configs
                 */
                View.prototype.addEventListeners = function (configs) {
                    var _this = this;
                    if (Array.isArray(configs)) {
                        configs.forEach(function (c) { return _this.addEventListener(c); });
                    }
                    return this;
                };
                /**
                 *  Adds an event listener to its root element by delegating to given selector.
                 * @param {Object} config
                 */
                View.prototype.addEventListener = function (config) {
                    if (typeof config !== "object" || config === null) {
                        throw new TypeError("Listener config must be passed as object.");
                    }
                    var eventType = config.type;
                    if (typeof eventType !== "string") {
                        throw new TypeError("Event type must be a string.");
                    }
                    var configObj = new EventListenerConfig(eventType, config.selector, config.listener, !!config.useCapture, this);
                    var key = eventType + " " + configObj.selector + " " + configObj.useCapture;
                    if (hasOwnProperty.call(this.eventListeners, key)) {
                        return this;
                    }
                    configObj.handleEvent = configObj.handleEvent.bind(configObj);
                    this.root.addEventListener(eventType, configObj.handleEvent, configObj.useCapture);
                    this.eventListeners[key] = configObj;
                    return this;
                };
                /**
                 *  Destroys the view.
                 */
                View.prototype.destroy = function () {
                    var _this = this;
                    Object
                        .keys(this.eventListeners)
                        .forEach(function (type) {
                        var listener = _this.eventListeners[type];
                        _this.root.removeEventListener(listener.type, listener.handleEvent, listener.useCapture);
                        delete _this.eventListeners[type];
                    });
                    ;
                    this.eventListeners = {};
                    this.root = null;
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
                function Presenter(view, model) {
                    this._model = null;
                    this._view = null;
                    this._modelHandlers = {};
                    this._view = view;
                    this.model = model;
                }
                Object.defineProperty(Presenter.prototype, "view", {
                    get: function () {
                        return this._view;
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
                        if (this.model === model) {
                            return;
                        }
                        var shouldDetach = this.model instanceof mvp.Model;
                        var shouldAttach = model instanceof mvp.Model;
                        Object
                            .keys(this._modelHandlers)
                            .forEach(function (type) {
                            var eventHandler = _this._modelHandlers[type];
                            if (shouldDetach) {
                                _this.model["off"](type, eventHandler, _this);
                            }
                            if (shouldAttach) {
                                model["on"](type, eventHandler, _this);
                            }
                        });
                        this._model = model;
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
                    return this.view.render(this.model);
                };
                /**
                 *  Destroys its model and view.
                 */
                Presenter.prototype.destroy = function () {
                    this.model = null;
                    this._view.destroy();
                    this._view = null;
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