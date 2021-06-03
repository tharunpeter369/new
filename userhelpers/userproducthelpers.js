var db=require('../config/connection')
var collections=require('../config/collections')
const {ObjectId} = require('mongodb')
const { query, response } = require('express')
const Razorpay=require('razorpay')
const { resolve } = require('path')
const { reject } = require('bcrypt/promises')
const paypal = require('paypal-rest-sdk')
const { PRODUCTCOLLECTION } = require('../config/collections')

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'ASqc63yUFYJPJbezl4EtBGoA-4FhmEuN5yKnIgK9v_NK3CbRPioTgwNeW0IONLUjsv_NFVHWidpPI0zk',
    'client_secret': 'EM581y2KiuOgDViDKBSGxIvRsTV_19P1KKMPCkGCSfpoOOtjxKifYLNhdtcad4Zw-aqjgC_I5VRwmy5k',
  });


var instance = new Razorpay({
    key_id: 'rzp_test_S1rBpKEOFwR2WL',
    key_secret: '57brbKcZLIbv4vzJwd4QAj9R',
  });



module.exports ={

    usergetproduct:(valpage)=>{
        var page = valpage.value
        var size = 6
        const limit = parseInt(size)
        const skip= (page-1)*size
            return new Promise(async(resolve,reject)=>{
                if(valpage.searchproduct){
                    var searchproduct = await db.get().collection(collections.PRODUCTCOLLECTION).find({productname:{$regex:valpage.searchproduct,$options:"$i"}}).limit(limit*1).skip(skip).toArray()
                    resolve(searchproduct)
                }else{
                    if(valpage.category && valpage.brand){
                        let userproduct=await db.get().collection(collections.PRODUCTCOLLECTION).find({category:valpage.category,brand:valpage.brand}).limit(limit*1).skip(skip).toArray()
                        resolve(userproduct)  
                    }else if(valpage.category){
                        let userproduct=await db.get().collection(collections.PRODUCTCOLLECTION).find({category:valpage.category}).limit(limit*1).skip(skip).toArray()
                        resolve(userproduct)
                    }
                    else{
                        let userproduct=await db.get().collection(collections.PRODUCTCOLLECTION).find().limit(limit*1).skip(skip).toArray()
                        resolve(userproduct)
                    }
                }

            })
    },





    productdetailing:(id)=>{
        var queryid={_id:ObjectId(id)}
        return new Promise(async(resolve,reject)=>{
            var specificproduct=await db.get().collection(collections.PRODUCTCOLLECTION).findOne(queryid)
            // console.log(specificproduct)
            resolve(specificproduct)
        })
    },

    addtocart:(productid,userid)=>{
          var user_id=ObjectId(userid)
          var product_id=ObjectId(productid)
          let proobj={
              item:ObjectId(product_id),
              quantity:1
          }
         
        return new Promise(async(resolve,reject)=>{
            let usercart=await db.get().collection(collections.CART_COLLECTION).findOne({user:user_id})

            if(usercart){
                // updating cart with product
                let prodexistinusercart=usercart.products.findIndex(product=>product.item==productid)
                if(prodexistinusercart!=-1){
                    db.get().collection(collections.CART_COLLECTION).updateOne({user:ObjectId(userid),'products.item':ObjectId(productid)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then((response)=>{
                        resolve({status:false})
                    })
                }else{
                db.get().collection(collections.CART_COLLECTION).updateOne({user:user_id},
                {
                    $push:{products:proobj}
                }
                
                ).then((response)=>{
                    resolve({status:true})
                })
                }
            }else{
                let cartObj={
                    user:user_id,
                    products:[proobj]
                    
                }
                // console.log(proobj)
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve({status:true})
                })
            }
        })

    },

    getproductofcart:(userid)=>{
        var id=ObjectId(userid)
        return new Promise(async(resolve,reject)=>{
            var data=await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:id}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCTCOLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }

                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }


            ]).toArray()
            // console.log(data[0].products)
            resolve(data)
        })

    },



    getcartcount:(userid)=>{
        console.log(userid);
        return new Promise(async(resolve,reject)=>{
            let count=0;
            checkcart=await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectId(userid)})
            if(checkcart){
                count=checkcart.products.length
                resolve(count) 
            }else{  
                count=0
                resolve(count) 
            }
        })
    },




    changeproductquantity:(body)=>{
        var count=parseInt(body.count)
        var quantity=parseInt(body.quantity)
        var prodid=body.product
        var cartid=body.cart
        return new Promise(async(resolve,reject)=>{
            if(count==-1 && quantity==1){
                await db.get().collection(collections.CART_COLLECTION).updateOne({_id:ObjectId(cartid)},
                {
                    $pull:{products:{item:ObjectId(prodid)}}
                }
                ).then((response)=>{
                    resolve({removeproduct:true})
                })
            }else{
                await db.get().collection(collections.CART_COLLECTION).updateOne({_id:ObjectId(cartid),'products.item':ObjectId(prodid)},
                {
                    $inc:{'products.$.quantity':count}
                }).then((response)=>{
                    resolve({status:true})
                })
                
            }
        })
    },



    gettotalamount:(userid,coupencode)=>{
        // console.log(coupencode)
        var id=ObjectId(userid)
        return new Promise(async(resolve,reject)=>{
            var data=await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:id}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCTCOLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {  
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.dealprice']}
                        
                    }  
                    }
                }
            ]).toArray()
     
            if(coupencode){
                var coupendetails=await db.get().collection(collections.COUPEN_COLLECTION).findOne({coupencode:coupencode})
                var finduserpoint=await db.get().collection(collections.USERDETAILS).findOne({_id:id})
                if(coupendetails){
                    if(finduserpoint.referrcodepoint>=1 && coupendetails.coupenname== 'REFERAL'){
                        var discounttedtotal=(data[0].total-(data[0].total*((parseInt(coupendetails.coupenvalue)*.01))))
                        await db.get().collection(collections.USERDETAILS).updateOne({_id:id},{$inc:{referrcodepoint:-1}})
                        resolve(discounttedtotal)
                    }
                    else if(coupendetails.coupenname!='REFERAL'){
                        var updateusedcoupen = await db.get().collection(collections.USERDETAILS).updateOne({_id:id},{$push:{usedcoupon:coupendetails.coupencode}})
                        var discounttedtotal=(data[0].total-(data[0].total*((parseInt(coupendetails.coupenvalue)*.01))))
                        resolve(discounttedtotal)
                    }
                    else{
                        resolve({discounttedtotal:false})
                    }
                } else{
                    resolve({discounttedtotal:false})
                }

            }else{
                if(data.length!=0){
                    resolve(data[0].total)
                }else{
                    resolve(0)
                }
            }
            
        })
    },


    deleteproductfromCart:(body)=>{
        var cartid=body.cart
        var proid=body.product
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.CART_COLLECTION).updateOne({_id:ObjectId(cartid)},
            {
                $pull:{products:{item:ObjectId(proid)}}
            }
            ).then((response)=>{
                resolve({removeproduct:true})
            })
        })
    },

    placeorder:(formdata,products,totalprice)=>{
        // console.log(formdata,products,totalprice)
        return new Promise(async(resolve,reject)=>{

            var data=await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(formdata.userid)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCTCOLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            if(formdata.addressdelivery=='CHOOSE'){
            }else{
                var homecheck=await db.get().collection(collections.ADDREESS_COLLECTION).findOne({userid:ObjectId(formdata.userid),addressdelivery:formdata.addressdelivery})
            if(homecheck==null){
                        let addressObj={
                           savedaddress:{
                            firstname:formdata.billingfname,
                            lastname:formdata.billinglname,
                            email:formdata.billingemail,
                            mobile:formdata.billingphone,
                            street:formdata.billingstreet,
                            country:formdata.billingcountry,
                            state:formdata.billingstate,
                            pincode:formdata.billingzip,
                           },
                           addressdelivery:formdata.addressdelivery,
                           userid:ObjectId(formdata.userid),
                           useremail:formdata.useremail,
                           defaultaddress:false,
                        }
                        console.log(formdata.saveaddress)
                        // console.log(formdata)
                        await db.get().collection(collections.ADDREESS_COLLECTION).insertOne(addressObj)
            }else if(homecheck.addressdelivery){
                // console.log(homecheck.addressdelivery)
                        let addressObj={
                           savedaddress:{
                            firstname:formdata.billingfname,
                            lastname:formdata.billinglname,
                            email:formdata.billingemail,
                            mobile:formdata.billingphone,
                            street:formdata.billingstreet,
                            country:formdata.billingcountry,
                            state:formdata.billingstate,
                            pincode:formdata.billingzip,
                           },
                           addressdelivery:formdata.addressdelivery,
                           userid:ObjectId(formdata.userid),
                           useremail:formdata.useremail,
                           defaultaddress:false,
                        }
                        await db.get().collection(collections.ADDREESS_COLLECTION).updateOne({userid:ObjectId(formdata.userid),addressdelivery:formdata.addressdelivery},
                        {$set:addressObj})
            }
            }
            let status=formdata.payment==='COD'?'PLACED':'PENDING'
            let orderObj={
                deliverydetails:{
                    firstname:formdata.billingfname,
                    lastname:formdata.billinglname,
                    email:formdata.billingemail,
                    mobile:formdata.billingphone,
                    street:formdata.billingstreet,
                    country:formdata.billingcountry,
                    state:formdata.billingstate,
                    pincode:formdata.billingzip,
                },
                userid:ObjectId(formdata.userid),
                useremail:formdata.useremail,
                paymentmethod:formdata.payment,
                products:data,
                totalprice:totalprice,
                date:new Date(),
                status:status,
                remove:false,

            }


            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collections.CART_COLLECTION).removeOne({user:ObjectId(formdata.userid)})
                console.log(response.ops[0]._id)
                resolve(response.ops[0]._id)
            })
        })
    },


    getcartproductlistfororder:(userid)=>{
        return new Promise(async(resolve,reject)=>{
            let cart= await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectId(userid)})
            resolve(cart.products)
        })

    },

    showorderproductinmyorder:(userdetails)=>{
        return new Promise(async(resolve,reject)=>{
            let orderdetails=await db.get().collection(collections.ORDER_COLLECTION).find({userid:ObjectId(userdetails._id),$or:[{status:"PLACED"},{status:"CANCELED"}]}).sort({date:-1}).toArray()
            resolve(orderdetails)
        })
    },



    cancelorder:(data)=>{
        orderid=data.id
        action=data.value
        return new Promise(async(resolve,reject)=>{
            if(action=='cancel'){
                var item= await db.get().collection(collections.ORDER_COLLECTION).findOneAndUpdate({_id:ObjectId(orderid)},{$set:{remove:true,status:"CANCELED"}})
                resolve()
            }else if(action=='undo'){
                var item= await db.get().collection(collections.ORDER_COLLECTION).findOneAndUpdate({_id:ObjectId(orderid)},{$set:{remove:false,status:"PLACED"}})
                resolve()
            }else{
                resolve()
            }
        })
    },



    getuserdataforprofile:(data)=>{
        return new Promise(async(resolve,reject)=>{
            var profile=await db.get().collection(collections.USERDETAILS).findOne({_id:ObjectId(data)})
            resolve(profile)
        })
    },



    findaddress:(body,usrid)=>{
        return new Promise(async(resolve,reject)=>{
            var addressdisplay=await db.get().collection(collections.ADDREESS_COLLECTION).findOne({userid:ObjectId(usrid),
                addressdelivery:body.user
        })
        resolve(addressdisplay)
        })
    },



    generaterazorpay:(orderid,totalprice)=>{
        // console.log(orderid,totalprice)
        return new Promise(async(resolve,reject)=>{
            var options = {
                amount: totalprice*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt:''+orderid,
              };
              instance.orders.create(options, function(err, order) {
                  console.log('creatingg new order helooooooooooo')
                  if(err){
                      console.log(err)
                  }else{
                    resolve(order)
                  }
              });
        })
    },

    verifypayment:(body)=>{
        return new Promise((resolve,reject)=>{
            var crypto = require('crypto');
            var hmac = crypto.createHmac('sha256', '57brbKcZLIbv4vzJwd4QAj9R');
            data = hmac.update(body['payment[razorpay_order_id]']+'|'+body['payment[razorpay_payment_id]']);
            gen_hmac= data.digest('hex');
            if(gen_hmac==body['payment[razorpay_signature]']){
                console.log('successss payment')
                resolve()
            }else{
                reject()
            }
        })

    },

    changepaymentstatus:(cartid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:ObjectId(cartid)},
            {$set:{status:"PLACED"}})
            resolve()
        })
    },

    getcatogeryandbrandforfileter:()=>{
        return new Promise(async(resolve,reject)=>{
            alldata=await db.get().collection(collections.CATEGORY).find().toArray()
            resolve(alldata)
        })

    },


    checkcoupenreturnofferprice:(coupencode,totalprice,user)=>{
        // console.log(totalprice)
        return new Promise(async(resolve,reject)=>{
            var coupendetails=await db.get().collection(collections.COUPEN_COLLECTION).findOne({coupencode:coupencode.coupencode})
            var finduserpoint=await db.get().collection(collections.USERDETAILS).findOne({_id:ObjectId(user._id)})
            if(coupendetails){
                if(finduserpoint.referrcodepoint>=1 && coupendetails.coupenname== 'REFERAL'){
                    var discounttedtotal=(totalprice-(totalprice*((parseInt(coupendetails.coupenvalue)*.01))))
                    resolve({discountedprice:discounttedtotal})
                }
                else if(coupendetails.coupenname!='REFERAL'){
                    var checkusedcoupen=await db.get().collection(collections.USERDETAILS).findOne({_id:ObjectId(user._id),usedcoupon:coupendetails.coupencode})
                    if(checkusedcoupen){
                        resolve({discountedprice:false})
                    }else{
                        var discounttedtotal=(totalprice-(totalprice*((parseInt(coupendetails.coupenvalue)*.01))))
                        resolve({discountedprice:discounttedtotal})
                    }
                }
                else{
                    resolve({discountedprice:false})
                }
            } else{
                resolve({discountedprice:false})
            }
        })
    },




      getproductforehome:async()=>{
          return new Promise(async(resolve,reject)=>{
            var r =Math.floor(Math.random()*(6))
            var product=await db.get().collection(collections.PRODUCTCOLLECTION).find({"$or":[{category:"LAPTOP"},{category:"CAMERA"}]}).limit(4).skip(r).toArray()
            resolve(product)
          })
        },


        getnewproductforehome:()=>{
            return new Promise(async(resolve,reject)=>{
                var sortedproduct=await db.get().collection(collections.PRODUCTCOLLECTION).find().sort(['_id', -1]).toArray()  
                resolve(sortedproduct)
              })
        },



        getinvoicedetails:(para)=>{
            return new Promise(async(resolve,reject)=>{
                var orderdetailsforinvoice=await db.get().collection(collections.ORDER_COLLECTION).findOne({_id:ObjectId(para.id)})
                resolve(orderdetailsforinvoice)
            })
           
        }






}







