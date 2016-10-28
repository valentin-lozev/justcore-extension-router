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