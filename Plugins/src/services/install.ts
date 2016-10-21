interface DCore {
    useServices(): void;
    services: DServicesPlugin;
}

interface DSandbox {
    getService<T>(id: string): T;
}

namespace dcore {
    "use strict";

    import services = plugins.services;
    
    export interface Instance {
        useServices(): void;
        services: DServicesPlugin;
    }

    export interface DefaultSandbox {
        getService<T>(id: string): T;
    }
    
    Instance.prototype.useServices = function (): void {
        let that = <DCore>this;
        if (that.services) {
            return;
        }

        that.services = new services.ServiceConfig();

        /**
         *  Gets a specific service instance by id.
         *  @param {String} id
         *  @returns {*}
         */
        that.Sandbox.prototype.getService = function <T>(id: string): T {
            return this.core.services.get(id);
        };
    };
}