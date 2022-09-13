const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const { name, description, price, image_url } = res.locals.dishData;
  const newId = nextId();
  const newDish = {
    id: newId,
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  const dish = res.locals.dish;
  res.status(200).json({ data: dish });
}

function update(req, res) {
  const { id, name, description, price, image_url } = res.locals.dishData;
  const dish = res.locals.dish;

  dish.id = id ? id : nextId();
  dish.name = name;
  dish.description = description;
  dish.image_url = image_url;
  dish.price = price;

  res.status(200).json({ data: dish });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      res.locals.dishData = data;
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function bodyIdMatchesRouteParam(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    const dishId = data[propertyName];
    const reqParamId = res.locals.dish.id;
    if (dishId && dishId !== reqParamId) {
      next({
        status: 400,
        message: ` Dish id does not match route id. Dish: ${dishId}, Route: ${reqParamId}`,
      });
    }
    return next();
  };
}

function priceIsAnInt(propertyName) {
  return function (req, res, next) {
    const data = res.locals.dishData;
    if (typeof data[propertyName] === "number") {
      return next();
    }
    next({ status: 400, message: `${propertyName} is not of type "number".` });
  };
}

function priceIsPositive(propertyName) {
  return function (req, res, next) {
    const data = res.locals.dishData;
    if (data[propertyName] >= 0) {
      return next();
    }
    next({
      status: 400,
      message: `Price can not be negative... ${propertyName}.`,
    });
  };
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    priceIsAnInt("price"),
    priceIsPositive("price"),
    bodyDataHas("image_url"),
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyIdMatchesRouteParam("id"),
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    priceIsAnInt("price"),
    priceIsPositive("price"),
    bodyDataHas("image_url"),
    update,
  ],
};
