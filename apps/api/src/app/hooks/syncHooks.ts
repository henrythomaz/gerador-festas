import SyncEvents from '../../services/SyncEvents.js';
import Customer from "../models/Customer.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Contract from "../models/Contract.js";
import ContractProduct from "../models/ContractProduct.js";
import File from "../models/File.js";

function addSyncHooks(model: any, modelName: string) {
  const hooks = {
    afterCreate: (instance: any, options: any) => {
      if (options.skipSync) return;
      const userId = instance.usuario_id;
      if (userId) SyncEvents.handleChange(userId, modelName, "create");
    },
    afterUpdate: (instance: any, options: any) => {
      if (options.skipSync) return;
      const userId = instance.usuario_id;
      if (userId) SyncEvents.handleChange(userId, modelName, "update");
    },
    afterDestroy: (instance: any, options: any) => {
      if (options.skipSync) return;
      const userId = instance.usuario_id;
      if (userId) SyncEvents.handleChange(userId, modelName, "delete");
    },
  };
  // Adicionar hooks se não existirem
  if (!model.options.hooks) model.options.hooks = {};
  model.options.hooks.afterCreate = hooks.afterCreate;
  model.options.hooks.afterUpdate = hooks.afterUpdate;
  model.options.hooks.afterDestroy = hooks.afterDestroy;
}

export function registerSyncHooks() {
  addSyncHooks(Customer, "Customer");
  addSyncHooks(Category, "Category");
  addSyncHooks(Product, "Product");
  addSyncHooks(Contract, "Contract");
  addSyncHooks(ContractProduct, "ContractProduct");
  addSyncHooks(File, "File");
}
