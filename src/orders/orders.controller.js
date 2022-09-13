const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function list(req, res) {
  res.status(200).json({ data: orders });
}

function create(req, res) {
  const { deliverTo, mobileNumber, dishes, status } = res.locals.orderData;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).send({ data: newOrder });
}

function read(req, res) {
  const order = res.locals.order;
  res.status(200).send({ data: order });
}

function update(req, res) {
  const { id, deliverTo, mobileNumber, dishes, status } = res.locals.orderData;
  const orderId = res.locals.id;
  const order = res.locals.order;

  order.id = id ? id : orderId;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.status(200).json({ data: order });
}

function destroy(req, res) {
  const id = res.locals.order.id;
  let delIndex = null;
  orders.forEach((order, index) =>
    order.id == id ? (delIndex = index) : null
  );
  orders.splice(delIndex, 1);
  res.status(204).send("deleted");
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    const prop = data[propertyName];
    if (prop) {
      res.locals.orderData = data;
      return next();
    }
    next({
      status: 400,
      message: `Order/dish must include ${propertyName}`,
    });
  };
}

function dishesIsArray(req, res, next) {
  const dishes = res.locals.orderData.dishes;
  if (Array.isArray(dishes)) {
    res.locals.dishes = dishes;
    return next();
  }
  next({
    status: 400,
    message: `Order must include at least one dish`,
  });
}

function dishesIsNotEmpty(req, res, next) {
  const dishes = res.locals.dishes;
  if (dishes.length > 0) return next();
  next({
    status: 400,
    message: `Order must include at least one dish`,
  });
}

function dishesQuantitiesExist(req, res, next) {
  const dishes = res.locals.dishes;
  let totalOrdered = 0;
  let badIndexes = [];

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    if (dish.quantity === undefined) {
      badIndexes.push(i);
    } else {
      totalOrdered += dish.quantity;
    }
  }
  if (badIndexes.length === 0) return next();
  next({
    status: 400,
    message: `Dish ${badIndexes[0]} must have a quantity that is an integer greater than 0. The quantity ordered was: ${totalOrdered}`,
  });
}

function dishesHavePositiveQuantity(req, res, next) {
  const dishes = res.locals.dishes;
  let totalOrdered = 0;
  let badIndexes = [];

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    if (dish.quantity < 1) {
      badIndexes.push(i);
    } else {
      totalOrdered += dish.quantity;
    }
  }
  if (badIndexes.length === 0) return next();
  next({
    status: 400,
    message: `Dish ${badIndexes[0]} must have a quantity that is an integer greater than 0. The quantity ordered was: ${totalOrdered}`,
  });
}

function dishesQuantityIsInt(req, res, next) {
  const dishes = res.locals.dishes;
  let totalOrdered = 0;
  let badIndexes = [];

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    if (typeof dish.quantity !== "number") {
      badIndexes.push(i);
    } else {
      totalOrdered += dish.quantity;
    }
  }
  if (badIndexes.length === 0) return next();

  next({
    status: 400,
    message: `Dish ${badIndexes[0]} must have a quantity that is an integer greater than 0. The quantity ordered was: ${totalOrdered}`,
  });
}

function orderExists(req, res, next) {
  // need to get orderId from url params
  const { orderId } = req.params;
  foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.id = orderId;
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `${orderId} doesn't exist.`,
  });
}

function statusIsPresent(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status !== undefined) {
    res.locals.status = status;
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

function statusPropNotEmpty(req, res, next) {
  const status = res.locals.status;
  if (status) return next();
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

function statusNotDelivered(req, res, next) {
  const status = res.locals.status;
  if (status !== "invalid") return next();
  next({
    status: 400,
    message: `Delivery status invalid: a delivered order cannot be changed`,
  });
}

function idsMatch(req, res, next) {
  // make sure that orders in the body and the url params are the same
  const { orderId } = req.params;
  const id = req.body.data.id;

  if (id && id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  return next();
}

function statusIsPending(req, res, next) {
  const status = res.locals.order.status;
  if (status === "pending") return next();
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`,
  });
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsArray,
    dishesIsNotEmpty,
    dishesQuantitiesExist,
    dishesHavePositiveQuantity,
    dishesQuantityIsInt,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsArray,
    dishesIsNotEmpty,
    dishesQuantitiesExist,
    dishesHavePositiveQuantity,
    dishesQuantityIsInt,
    statusIsPresent,
    statusPropNotEmpty,
    statusNotDelivered,
    idsMatch,
    update,
  ],
  delete: [orderExists, statusIsPending, destroy],
};
