const mongoose = require("mongoose");

const stores = {
  User: [],
  Product: [],
  Order: []
};

const attachId = (doc) => {
  if (!doc) {
    return doc;
  }

  if (!Object.prototype.hasOwnProperty.call(doc, "_id")) {
    doc._id = new mongoose.Types.ObjectId();
  }

  Object.defineProperty(doc, "id", {
    enumerable: true,
    configurable: true,
    get() {
      return this._id.toString();
    }
  });

  return doc;
};

const resetStores = () => {
  stores.User.length = 0;
  stores.Product.length = 0;
  stores.Order.length = 0;
};

const toObjectId = (value) => {
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  return new mongoose.Types.ObjectId(value);
};

const matchesQuery = (doc, query) =>
  Object.entries(query).every(([key, value]) => {
    const docValue = doc[key];

    if (docValue instanceof mongoose.Types.ObjectId) {
      return docValue.toString() === value.toString();
    }

    return docValue === value;
  });

const configureUserModel = () => {
  const User = require("../models/User");

  User.create = async (data) => {
    const now = new Date();
    const doc = attachId({
      _id: data._id ? toObjectId(data._id) : new mongoose.Types.ObjectId(),
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role || "buyer",
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    });

    stores.User.push(doc);
    return doc;
  };

  User.findOne = async (query) => {
    const doc = stores.User.find((item) => matchesQuery(item, query));
    return doc ? attachId(doc) : null;
  };

  User.findById = async (id) => {
    const doc = stores.User.find((item) => item._id.toString() === id.toString());
    return doc ? attachId(doc) : null;
  };

  User.deleteMany = async () => {
    stores.User.length = 0;
  };
};

const configureProductModel = () => {
  const Product = require("../models/Product");

  Product.create = async (data) => {
    const now = new Date();
    const doc = attachId({
      _id: data._id ? toObjectId(data._id) : new mongoose.Types.ObjectId(),
      title: data.title,
      slug: data.slug,
      description: data.description,
      price: data.price,
      assetKey: data.assetKey,
      thumbnailUrl: data.thumbnailUrl,
      seller: toObjectId(data.seller),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    });

    stores.Product.push(doc);
    return doc;
  };

  Product.findOne = async (query) => {
    const doc = stores.Product.find((item) => matchesQuery(item, query));
    return doc ? attachId(doc) : null;
  };

  Product.find = () => ({
    sort: ({ createdAt }) => {
      const results = [...stores.Product];

      if (createdAt === -1) {
        results.sort((a, b) => b.createdAt - a.createdAt);
      }

      return Promise.resolve(results.map((item) => attachId(item)));
    }
  });

  Product.deleteMany = async () => {
    stores.Product.length = 0;
  };
};

const configureOrderModel = () => {
  const Order = require("../models/Order");

  Order.create = async (data) => {
    const now = new Date();
    const doc = attachId({
      _id: data._id ? toObjectId(data._id) : new mongoose.Types.ObjectId(),
      user: toObjectId(data.user),
      product: toObjectId(data.product),
      status: data.status || "pending",
      stripeSessionId: data.stripeSessionId,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    });

    stores.Order.push(doc);
    return doc;
  };

  Order.find = async (query) => {
    const docs = stores.Order.filter((item) => matchesQuery(item, query || {}));
    return docs.map((item) => attachId(item));
  };

  Order.findOne = async (query) => {
    const doc = stores.Order.find((item) => matchesQuery(item, query));
    return doc ? attachId(doc) : null;
  };

  Order.findOneAndUpdate = async (query, update) => {
    const index = stores.Order.findIndex((item) => matchesQuery(item, query));

    if (index === -1) {
      return null;
    }

    const existing = stores.Order[index];
    const updatedDoc = attachId({ ...existing, ...update, updatedAt: new Date() });

    stores.Order[index] = updatedDoc;
    return updatedDoc;
  };

  Order.findById = (id) => {
    const doc = stores.Order.find((item) => item._id.toString() === id.toString());
    const baseDoc = doc ? attachId(doc) : null;

    return {
      populate: async (field) => {
        if (!doc) {
          return null;
        }

        if (field === "product") {
          const product = stores.Product.find(
            (item) => item._id.toString() === doc.product.toString()
          );

          if (!product) {
            return null;
          }

          return attachId({ ...doc, product: attachId(product) });
        }

        return attachId(doc);
      },
      then: (resolve) => resolve(baseDoc)
    };
  };

  Order.deleteMany = async () => {
    stores.Order.length = 0;
  };
};

let configured = false;

const configureInMemoryModels = () => {
  if (configured) {
    return {
      reset: resetStores
    };
  }

  configureUserModel();
  configureProductModel();
  configureOrderModel();
  configured = true;

  return {
    reset: resetStores
  };
};

module.exports = {
  configureInMemoryModels,
  resetStores,
  __testing: {
    attachId,
    matchesQuery,
    toObjectId,
    stores
  }
};
