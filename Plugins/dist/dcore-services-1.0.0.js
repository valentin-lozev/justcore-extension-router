var dcore;
(function (dcore) {
    var plugins;
    (function (plugins) {
        var services;
        (function (services) {
            "use strict";
            var ServiceConfig = (function () {
                function ServiceConfig() {
                    this.services = {};
                }
                /**
                 *  Add a service.
                 *  @param {String} id
                 *  @param {Function} factory - function which provides an instance of the service.
                 */
                ServiceConfig.prototype.add = function (id, creator) {
                    if (typeof id !== "string" || id === "") {
                        throw new TypeError(id + " service registration failed: ID must be non empty string.");
                    }
                    if (typeof creator !== "function") {
                        throw new TypeError(id + " service registration failed: creator must be a function.");
                    }
                    if (this.services[id]) {
                        throw new TypeError(id + " service registration failed: a service with such id has been already added.");
                    }
                    this.services[id] = creator;
                    return this;
                };
                /**
                 *  Gets a specific service instance by id.
                 *  @param {String} id
                 *  @returns {*}
                 */
                ServiceConfig.prototype.get = function (id) {
                    var creator = this.services[id];
                    if (!creator) {
                        throw new ReferenceError(id + " service was not found.");
                    }
                    return creator();
                };
                return ServiceConfig;
            }());
            services.ServiceConfig = ServiceConfig;
        })(services = plugins.services || (plugins.services = {}));
    })(plugins = dcore.plugins || (dcore.plugins = {}));
})(dcore || (dcore = {}));
//# sourceMappingURL=ServiceConfig.js.map
var dcore;
(function (dcore) {
    "use strict";
    var services = dcore.plugins.services;
    dcore.Instance.prototype.useServices = function () {
        if (this.services) {
            console.warn("Services plugin already installed");
            return this;
        }
        this.services = new services.ServiceConfig();
        /**
         *  Gets a specific service instance by id.
         *  @param {String} id
         *  @returns {*}
         */
        this.Sandbox.prototype.getService = function (id) {
            return this.core.services.get(id);
        };
        return this;
    };
})(dcore || (dcore = {}));
//# sourceMappingURL=install.js.map