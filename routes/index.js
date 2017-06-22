var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var serverInfo = require('../config/config');

var connection = mysql.createConnection({
    host: serverInfo.host,
    user: serverInfo.username,
    password: serverInfo.password,
    database: serverInfo.database
});



connection.connect();

/* GET home page. */
router.get('/', function(req, res, next) {


    // var idQuery = `SELECT id FROM player_info WHERE (first_name = '${nameArray[0]}' AND last_name = '${nameArray[1]}');`;
    var productLineQuery = `SELECT productLine FROM productlines;`;
    var product = [];

    connection.query(productLineQuery, (error, results)=>{
        if(error) throw error;
        // console.log(results[0]);

        for( var i = 0; i < results.length; i++){
          product.push(results[i].productLine);
        }
        // console.log(product);
        // res.redirect('/user?msg=loadFav');
        res.render('index', { products: product });


    });
});


router.get('/products', function(req, res, next) {

    // console.log(req.query.msg);
    productLine = req.query.msg;
    // var idQuery = `SELECT id FROM player_info WHERE (first_name = '${nameArray[0]}' AND last_name = '${nameArray[1]}');`;
    var productsQuery = `SELECT productName FROM products where productLine = '${productLine}';`;
    var productNames = [];


    connection.query(productsQuery, (error, results)=>{
        if(error) throw error;
        // console.log(results);
        for( var i = 0; i < results.length; i++){
            productNames.push(results[i].productName);
        }
        // res.redirect('/user?msg=loadFav');
        res.render('products', { productNames: productNames });


    });
});



router.get('/product_info', function(req, res, next) {


    function getProductInfo() {
        // console.log(req.query.msg);
        productName = req.query.msg;
        // var idQuery = `SELECT id FROM player_info WHERE (first_name = '${nameArray[0]}' AND last_name = '${nameArray[1]}');`;
        var productInfoQuery = `SELECT * FROM products where productName = '${productName}';`;
        return new Promise((resolve, reject) => {
            // send off the AJAX request
            connection.query(productInfoQuery, function (error, results) {
                if (error) throw error;
                // console.log(results[0]);

                resolve(results[0]);
            });
        });
    }
    
    function getOrderInfo(productCode) {
        var orderInfoQuery = `SELECT * FROM orderdetails WHERE productCode = '${productCode}';`

        return new Promise((resolve, reject) => {
            // send off the AJAX request
            connection.query(orderInfoQuery, function (error, results) {
                if (error) throw error;
                // console.log(results);

                resolve(results);
            });
        });

    }

    productInfoPromise = getProductInfo();
    productInfoPromise.then((data)=>{
        productInfo = data;
        var productCode = productInfo.productCode;
        return getOrderInfo(productCode);

    }).then((data)=>{
        var orderInfo = data;
        var totalOrdered = 0;
        for(let i = 0; i < orderInfo.length; i++){
            totalOrdered += orderInfo[i].quantityOrdered
        }
        console.log(totalOrdered);
        res.render('product_info', {productInfo: productInfo, orderInfo: orderInfo, totalOrdered:totalOrdered});

    });

});


router.get('/orders', function(req, res, next) {

    var orderDetails = {orderNumber: req.query.msg, orderStatus: null, customerNumber: null,
    customerName: null, customerCity: null, employeeNumber: null, employeeFirstName: null,
    employeeLastName: null, employeeOffice: null, employeeReportsTo: null, productNames: [],
    totalPrices: [], productCodes:[]};

    function getOrderInfo() {
        // console.log(req.query.msg);
        orderNumber = req.query.msg;
        // var idQuery = `SELECT id FROM player_info WHERE (first_name = '${nameArray[0]}' AND last_name = '${nameArray[1]}');`;
        var orderInfoQuery = `SELECT status, customerNumber FROM orders WHERE orderNumber = '${orderNumber}';`;
        return new Promise((resolve, reject) => {
            // send off the AJAX request
            connection.query(orderInfoQuery, function (error, results) {
                if (error) throw error;
                resolve(results[0]);
            });
        });
    }

    function getCustomerInfo(customerID){
        var customerQuery = `SELECT customerName, city, salesRepEmployeeNumber FROM customers WHERE customerNumber = '${customerID}';`;

        return new Promise((resolve, reject)=>{
            connection.query(customerQuery,(error, results)=>{
                if(error) throw error;
                resolve(results[0]);
            });
        });

    }

    function getEmployeeInfo(employeeID){
        var employeeQuery = `SELECT firstName, lastName, officeCode, reportsTo FROM employees WHERE employeeNumber = '${employeeID}';`;

        return new Promise((resolve, reject)=>{
            connection.query(employeeQuery,(error, results)=>{
                if(error) throw error;
                resolve(results[0]);
            });
        });

    }

    function getOrderDetails(orderNumber){
        var orderDetailsQuery = `SELECT productCode, (quantityOrdered*priceEach) AS totalPrice from orderdetails WHERE orderNumber = '${orderNumber}';`;

        return new Promise((resolve, reject)=>{
            connection.query(orderDetailsQuery,(error, results)=>{
                if(error) throw error;
                resolve(results);
            });
        });

    }

    function getProductName(productCode){
        var productNameQuery = `SELECT productName FROM products WHERE productCode = '${productCode}';`;

        return new Promise((resolve, reject)=>{
            connection.query(productNameQuery,(error, results)=>{
                if(error) throw error;
                resolve(results);
            });
        });

    }



    orderInfoPromise = getOrderInfo();
    orderInfoPromise.then((data)=>{
        orderDetails.customerNumber = data.customerNumber;
        orderDetails.orderStatus = data.status;
        return getCustomerInfo(orderDetails.customerNumber);
    }).then((data)=>{
        orderDetails.customerName = data.customerName;
        orderDetails.customerCity = data.city;
        orderDetails.employeeNumber = data.salesRepEmployeeNumber;
        return getEmployeeInfo(orderDetails.employeeNumber);
    }).then(function (data) {
        orderDetails.employeeFirstName = data.firstName;
        orderDetails.employeeLastName = data.lastName;
        orderDetails.employeeOffice = data.officeCode;
        orderDetails.employeeReportsTo = data.reportsTo;
        return getOrderDetails(orderDetails.orderNumber);
    }).then((data)=>{
       //console.log(data);
       for(let i = 0; i < data.length; i++){
           orderDetails.productCodes.push(data[i].productCode);
           orderDetails.totalPrices.push(data[i].totalPrice);
       }
    }).then((data)=>{
        //console.log(orderDetails.productCodes);
        productNames = [];
        orderDetails.productCodes.map((productCode)=>{
            productNames.push(getProductName(productCode));
        });

        Promise.all(productNames).then((data)=>{
            for(let i = 0; i < data.length; i++){

                orderDetails.productNames.push(data[i][0].productName)
            }
            console.log(orderDetails);
            res.render('orders', {orderDetails: orderDetails});

        });
    });

});

module.exports = router;
