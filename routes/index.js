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




    // connection.query(productInfoQuery, function (error, results){
    //     if(error) throw error;
    //     // console.log(results[0]);
    //
    //     var productInfo = results[0];
    //     var productCode = productInfo.productCode;
    //
    //     var orderQuery = `SELECT * FROM orderdetails WHERE productCode = '${productCode}';`;
    //     connection.query(orderQuery, function (error, results) {
    //        console.log(results)
    //
    //     });
    //
    //     res.render('product_info', { productInfo: productInfo });
    //
    // });



});

module.exports = router;
