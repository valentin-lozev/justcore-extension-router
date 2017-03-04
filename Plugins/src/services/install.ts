interface DCore {
    useServices(): DCore;
    services: DServicesPlugin;
}

interface DSandbox {
    getService<T>(id: string): T;
}

namespace dcore {
    "use strict";

    import services = plugins.services;
    
    export interface Instance {
        useServices(): DCore;
        services: DServicesPlugin;
    }

    export interface DefaultSandbox {
        getService<T>(id: string): T;
    }

    Instance.prototype.useServices = function (this: DCore): DCore {
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
        this.Sandbox.prototype.getService = function <T>(id: string): T {
            return this.core.services.get(id);
        };

        return this;
    };
}