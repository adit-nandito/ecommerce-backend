# ECOMMERCE BACKEND PROJECT

## Requirements
* NodeJS
* PostgreSQL
* Postman


## How to
1. Clone this repository into your local
2. Run `npm install` to install dependencies
3. You may add file `.env` for config in your local repo if neccessary. Here are some sample params that given:
- HOST
- USER
- DATABASE
- PORT

4. Create table that already provided on source code
5. After that, command on the terminal `npm start` to start the service
6. Now you can try hit the API via Postman
- [GET] /api/product/list-all
- [GET] /api/product/list?page=1
- [POST] /api/product/detail
  * payload: {
    "sku": "RCH45Q1A"
  }
- [POST] /api/product/add
  * payload: {
      "data": [
        {
          "title": "TEST 123!!!",
          "sku": "RCH45Q1A",
          "image": "https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png",
          "description": "",
          "price": 111
        }
      ]
    }
- [PUT] /api/product/update
  * payload: {
    "title": "Test",
    "sku": "MVCFH27F",
    "image": "https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png",
    "description": "",
    "price": 10
  }
- [DELETE] /api/product/delete
  * payload: {
    "sku": "RCH45Q1A"
  } 
- [GET] /api/transaction/list?page=1
- [POST] /api/transaction/detail
  * payload: {
    "sku": "RCH45Q1A"
  }
- [POST] /api/transaction/add
  * payload: {
      "data": [
        {
          "sku": "RCH45Q1A",
          "qty": 111
        }
      ]
    }
- [PUT] /api/transaction/update
  * payload: {
    "sku": "MVCFH27F",
    "qty": 10
  }
- [DELETE] /api/transaction/delete
  * payload: {
    "sku": "RCH45Q1A"
  } 

## Unit Testing
To running unit test, command on the terminal `npm run test`
