const Joi = require('@hapi/joi');
const ProductHelper = require('../helpers/productHelper');
const PostHandler = require('../utils/postHandler');

exports.plugin = {
  name: 'products',
  register: async (server, options) => {
    server.validator(Joi);
    server.route([
      {
        method: 'GET',
        path: options.baseUrl + '/list-all',
        handler: allProdcut
      },
      {
        method: 'GET',
        path: options.baseUrl + '/list',
        options: {
          description: 'Get list product',
          validate: {
            query: {
              page: Joi.number().required()
            }
          }
        },
        handler: listProduct
      },
      {
        method: 'POST',
        path: options.baseUrl + '/detail',
        options: {
          description: 'Get detail product',
          validate: {
            payload: {
              sku: Joi.string().required()
            }
          }
        },
        handler: detailProduct
      },
      {
        method: 'POST',
        path: options.baseUrl + '/add',
        options: {
          description: 'Add products',
          validate: {
            payload: {
              data: Joi.array()
                .items(
                  Joi.object({
                    title: Joi.string().required(),
                    sku: Joi.string().required(),
                    image: Joi.string().required(),
                    price: Joi.number().required(),
                    description: Joi.string().optional().allow('')
                  })
                )
                .required()
            }
          }
        },
        handler: addProduct
      },
      {
        method: 'PUT',
        path: options.baseUrl + '/update',
        options: {
          description: 'Update products',
          validate: {
            payload: {
              title: Joi.string().required(),
              sku: Joi.string().required(),
              image: Joi.string().required(),
              price: Joi.number().required(),
              description: Joi.string().optional().allow('')
            }
          }
        },
        handler: updateProduct
      },
      {
        method: 'DELETE',
        path: options.baseUrl + '/delete',
        options: {
          description: 'Delete products',
          validate: {
            payload: {
              listSKU: Joi.array().required()
            }
          }
        },
        handler: deleteProduct
      }
    ]);
  }
};

const allProdcut = async (req, res) => {
  try {
    const response = await ProductHelper.getAllProduct();
    return res.response(response);
  } catch (err) {
    console.log('error====', err);
    return err;
  }
};

const listProduct = async (req, res) => {
  const { page } = req.query;
  const pageQuery = Math.floor(page);
  try {
    const response = await ProductHelper.getListProduct(pageQuery);
    return res.response(response);
  } catch (err) {
    console.log('error====', err);
    return PostHandler.errorResponseHandler(err);
  }
};

const detailProduct = async (req, res) => {
  const { sku } = req.payload;
  try {
    const response = await ProductHelper.getDetailProduct(sku);
    return res.response(response);
  } catch (err) {
    console.log('error====', err);
    return PostHandler.errorResponseHandler(err);
  }
};

const addProduct = async (req, res) => {
  const { data } = req.payload;
  try {
    const response = await ProductHelper.submitAddProduct(data);
    return res.response(response);
  } catch (err) {
    console.log('error====', err);
    return PostHandler.errorResponseHandler(err);
  }
};

const updateProduct = async (req, res) => {
  const { title, sku, image, price, description } = req.payload;
  try {
    const response = await ProductHelper.submitUpdateProduct({ title, sku, image, price, description });
    return res.response(response);
  } catch (err) {
    console.log('error====', err);
    return PostHandler.errorResponseHandler(err);
  }
};

const deleteProduct = async (req, res) => {
  const { listSKU } = req.payload;
  try {
    const response = await ProductHelper.submitDeleteProduct(listSKU);
    return res.response(response);
  } catch (err) {
    console.log('error====', err);
    return PostHandler.errorResponseHandler(err);
  }
};
