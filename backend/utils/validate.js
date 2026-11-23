const { HttpError } = require('./errors');

const isBlank = (v) => typeof v !== 'string' || v.trim() === '';
const isNonNegInt = (v) => Number.isInteger(v) && v >= 0;
const isPosInt = (v) => Number.isInteger(v) && v > 0;
const isNonNegNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function fail(errors) {
  if (Object.keys(errors).length) {
    throw new HttpError(400, 'Validation failed', errors);
  }
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid id');
  return id;
}

function validateProduct(b = {}) {
  const errors = {};
  if (isBlank(b.sku)) errors.sku = 'SKU is required';
  else if (b.sku.length > 40) errors.sku = 'SKU is too long';
  if (isBlank(b.name)) errors.name = 'Name is required';
  else if (b.name.length > 150) errors.name = 'Name is too long';
  if (!isNonNegInt(b.quantity)) errors.quantity = 'Quantity must be a whole number, 0 or more';
  if (!isNonNegInt(b.min_level)) errors.min_level = 'Minimum level must be a whole number, 0 or more';
  if (!isNonNegNumber(b.price)) errors.price = 'Price must be a number, 0 or more';
  if (b.category_id != null && !isPosInt(b.category_id)) errors.category_id = 'Invalid category';
  if (b.supplier_id != null && !isPosInt(b.supplier_id)) errors.supplier_id = 'Invalid supplier';
  fail(errors);
  return {
    sku: b.sku.trim(),
    name: b.name.trim(),
    quantity: b.quantity,
    min_level: b.min_level,
    price: b.price,
    category_id: b.category_id ?? null,
    supplier_id: b.supplier_id ?? null,
  };
}

function validateSupplier(b = {}) {
  const errors = {};
  if (isBlank(b.name)) errors.name = 'Name is required';
  else if (b.name.length > 120) errors.name = 'Name is too long';
  if (b.email && !isEmail(b.email)) errors.email = 'Email is not valid';
  if (b.phone && String(b.phone).length > 30) errors.phone = 'Phone is too long';
  fail(errors);
  return {
    name: b.name.trim(),
    email: b.email ? b.email.trim() : null,
    phone: b.phone ? String(b.phone).trim() : null,
    address: b.address ? String(b.address).trim() : null,
  };
}

function validateCategory(b = {}) {
  const errors = {};
  if (isBlank(b.name)) errors.name = 'Name is required';
  else if (b.name.length > 60) errors.name = 'Name is too long';
  fail(errors);
  return { name: b.name.trim() };
}

function validateMovement(b = {}) {
  const errors = {};
  if (!isPosInt(b.product_id)) errors.product_id = 'Product is required';
  if (b.type !== 'IN' && b.type !== 'OUT') errors.type = 'Type must be IN or OUT';
  if (!isPosInt(b.amount)) errors.amount = 'Amount must be a whole number greater than 0';
  if (b.note != null && typeof b.note !== 'string') errors.note = 'Note must be text';
  else if (b.note && b.note.length > 300) errors.note = 'Note is too long';
  fail(errors);
  return {
    product_id: b.product_id,
    type: b.type,
    amount: b.amount,
    note: b.note ? b.note.trim() : null,
  };
}

module.exports = {
  parseId,
  validateProduct,
  validateSupplier,
  validateCategory,
  validateMovement,
};