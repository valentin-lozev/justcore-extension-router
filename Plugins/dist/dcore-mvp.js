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
             *  @class spaMVP.Model
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
var dcore;
(function (dcore) {
    var plugins;
    (function (plugins) {
        var mvp;
        (function (mvp) {
            "use strict";
            /**
             *  Creates a collection of unique items.
             *  @class spaMVP.HashSet
             *  @property {Number} size
             */
            var HashSet = (function () {
                function HashSet() {
                    this.items = {};
                    this.size = 0;
                }
                /**
                 *  Determines whether an item is in the set.
                 *  @returns {Boolean}
                 */
                HashSet.prototype.contains = function (item) {
                    var hashCode = item.hash();
                    if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                        return false;
                    }
                    var hashedItems = this.items[hashCode];
                    if (!Array.isArray(hashedItems)) {
                        return hashedItems.equals(item);
                    }
                    for (var i = 0, len = hashedItems.length; i < len; i++) {
                        if (hashedItems[i].equals(item)) {
                            return true;
                        }
                    }
                    return false;
                };
                /**
                 *  Adds a new item to the set.
                 *  @returns {Boolean}
                 */
                HashSet.prototype.add = function (item) {
                    if (item === null ||
                        typeof item === "undefined" ||
                        this.contains(item)) {
                        return false;
                    }
                    var hashCode = item.hash();
                    // the first item with this hash
                    if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                        this.items[hashCode] = item;
                    }
                    else if (!Array.isArray(this.items[hashCode])) {
                        // the second item with this hash
                        this.items[hashCode] = [this.items[hashCode], item];
                    }
                    else {
                        // there are already two or more items with this hash
                        this.items[hashCode].push(item);
                    }
                    this.size++;
                    return true;
                };
                /**
                 *  Removes an item from the set.
                 *  @returns {Boolean}
                 */
                HashSet.prototype.remove = function (item) {
                    if (!this.contains(item)) {
                        return false;
                    }
                    var hashCode = item.hash();
                    if (Array.isArray(this.items[hashCode])) {
                        var hashCodeItems = this.items[hashCode];
                        for (var i = 0, len = hashCodeItems.length; i < len; i++) {
                            if (hashCodeItems[i].equals(item)) {
                                hashCodeItems[i] = hashCodeItems[len - 1];
                                hashCodeItems.length--;
                                break;
                            }
                        }
                    }
                    else {
                        delete this.items[hashCode];
                    }
                    this.size--;
                    return true;
                };
                /**
                 *  Removes all items from the set.
                 *  @returns {Boolean}
                 */
                HashSet.prototype.clear = function () {
                    if (this.size <= 0) {
                        return false;
                    }
                    this.items = {};
                    this.size = 0;
                    return true;
                };
                /**
                 *  Performs a an action on each item in the set.
                 *  @param {Function} action
                 *  @param {Object} [context] The action's context.
                 */
                HashSet.prototype.forEach = function (action, context) {
                    var index = 0;
                    var hashes = Object.keys(this.items);
                    for (var i = 0, len = hashes.length; i < len; i++) {
                        var hashIndexItem = this.items[hashes[i]];
                        if (!Array.isArray(hashIndexItem)) {
                            action.call(context, hashIndexItem, index);
                            index++;
                            continue;
                        }
                        for (var j = 0, hashLength = hashIndexItem.length; j < hashLength; j++) {
                            action.call(context, hashIndexItem[j], index);
                            index++;
                        }
                    }
                };
                /**
                 *  Converts the set to Array.
                 *  @returns {Array}
                 */
                HashSet.prototype.toArray = function () {
                    var result = new Array(this.size);
                    var index = 0;
                    var hashes = Object.keys(this.items);
                    for (var i = 0, hashesLen = hashes.length; i < hashesLen; i++) {
                        var hashIndexItem = this.items[hashes[i]];
                        if (!Array.isArray(hashIndexItem)) {
                            result[index] = hashIndexItem;
                            index++;
                            continue;
                        }
                        for (var j = 0, len = hashIndexItem.length; j < len; j++) {
                            result[index] = hashIndexItem[j];
                            index++;
                        }
                    }
                    return result;
                };
                return HashSet;
            }());
            mvp.HashSet = HashSet;
        })(mvp = plugins.mvp || (plugins.mvp = {}));
    })(plugins = dcore.plugins || (dcore.plugins = {}));
})(dcore || (dcore = {}));
//# sourceMappingURL=HashSet.js.map
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
             *  Composite pattern on spaMVP.Model.
             *  It is usefull when you want to listen for collection of models.
             *  @class spaMVP.Collection
             *  @augments spaMVP.Model
             */
            var Collection = (function (_super) {
                __extends(Collection, _super);
                function Collection() {
                    _super.call(this);
                    this.models = new mvp.HashSet();
                }
                Object.defineProperty(Collection.prototype, "size", {
                    get: function () {
                        return this.models.size;
                    },
                    enumerable: true,
                    configurable: true
                });
                Collection.prototype.equals = function (other) {
                    return false;
                };
                Collection.prototype.hash = function () {
                    return this.size ^ 17;
                };
                /**
                 *  Adds new model to the set.
                 *  @returns {Boolean}
                 */
                Collection.prototype.add = function (model) {
                    return this.addRange([model]);
                };
                /**
                 *  Adds range of models to the set.
                 *  @returns {Boolean}
                 */
                Collection.prototype.addRange = function (models) {
                    var added = [];
                    for (var i = 0, len = models.length; i < len; i++) {
                        var model = models[i];
                        if (!this.models.add(model)) {
                            continue;
                        }
                        model.on(mvp.ModelEvents.Change, onItemChange, this);
                        model.on(mvp.ModelEvents.Destroy, onItemDestroy, this);
                        added.push(model);
                    }
                    var isModified = added.length > 0;
                    if (isModified) {
                        this.notify(mvp.CollectionEvents.AddedItems, added);
                    }
                    return isModified;
                };
                /**
                 *  Removes a model from the set.
                 *  @returns {Boolean}
                 */
                Collection.prototype.remove = function (model) {
                    return this.removeRange([model]);
                };
                /**
                 *  Removes range of models.
                 *  @returns {Boolean}
                 */
                Collection.prototype.removeRange = function (models) {
                    var deleted = [];
                    for (var i = 0, len = models.length; i < len; i++) {
                        var model = models[i];
                        if (!this.models.remove(model)) {
                            continue;
                        }
                        model.off(mvp.ModelEvents.Change, onItemChange, this);
                        model.off(mvp.ModelEvents.Destroy, onItemDestroy, this);
                        deleted.push(model);
                    }
                    var isModified = deleted.length > 0;
                    if (isModified) {
                        this.notify(mvp.CollectionEvents.DeletedItems, deleted);
                    }
                    return isModified;
                };
                /**
                 *  Removes all models from the set.
                 *  @returns {Boolean}
                 */
                Collection.prototype.clear = function () {
                    return this.removeRange(this.toArray());
                };
                /**
                 *  Determines whether a model is in the collection.
                 *  @returns {Boolean}
                 */
                Collection.prototype.contains = function (model) {
                    return this.models.contains(model);
                };
                /**
                 *  Determines whether the collection is not empty.
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
                    return this.models.toArray();
                };
                /**
                 *  Performs an action on each model in the set.
                 */
                Collection.prototype.forEach = function (action, context) {
                    this.models.forEach(action, context);
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
             *  @class spaMVP.View
             *  @param {HTMLElement} domNode The view's html element.
             *  @param {Function} [template] A function which renders view's html element.
             *  @property {HTMLElement} domNode
             */
            var View = (function () {
                function View(domNode, template) {
                    if (!domNode) {
                        throw new Error("Dom node cannot be null.");
                    }
                    this._domNode = domNode;
                    this.template = template;
                }
                Object.defineProperty(View.prototype, "domNode", {
                    get: function () {
                        return this._domNode;
                    },
                    enumerable: true,
                    configurable: true
                });
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
                        htmlElement: !selector ? this.domNode : this.domNode.querySelector(selector),
                        handler: eventHandler,
                        eventType: eventType,
                        context: this,
                        useCapture: useCapture
                    });
                    return this;
                };
                /**
                 *  Renders the view.
                 *  @returns {HTMLElement}
                 */
                View.prototype.render = function (model) {
                    if (this.template) {
                        this.domNode.innerHTML = this.template.call(this, model);
                    }
                    return this.domNode;
                };
                /**
                 *  Removes all elements and mapped events.
                 */
                View.prototype.destroy = function () {
                    if (typeof this.domNode.detach === "function") {
                        this.domNode.detach();
                    }
                    this.removeAllElements();
                    this._domNode = null;
                    return this;
                };
                /**
                 *  Finds an element by given selector.
                 *  @param {String} selector
                 *  @returns {Element}
                 */
                View.prototype.query = function (selector) {
                    return this.domNode.querySelector(selector);
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
                 *  @returns {spaMVP.View}
                 */
                View.prototype.removeAllElements = function () {
                    while (this.domNode.firstElementChild) {
                        this.domNode.removeChild(this.domNode.firstElementChild);
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
             *  @class spaMVP.Presenter
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
    };
})(dcore || (dcore = {}));
//# sourceMappingURL=install.js.map