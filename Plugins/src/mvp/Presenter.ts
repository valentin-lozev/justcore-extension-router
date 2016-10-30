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