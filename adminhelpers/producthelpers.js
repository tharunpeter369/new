var db=require('../config/connection')
var collections=require('../config/collections')
const {Objectid, ObjectId} = require('mongodb')
const { query, response } = require('express')
const { reject, promise } = require('bcrypt/promises')


module.exports={
    addProduct:(product,callback)=>{
        productpricee=parseInt(product.productprice)
        db.get().collection('product').insertOne({productname:product.productname,
            productdescription:product.productdescription,
            productprice:parseInt(product.productprice),
            dealprice:parseInt(product.productprice),
            productquantity:product.productquantity,
            category:product.category,
            brand:product.brand
         }).then((data)=>{
                console.log(data.ops[0]._id)
            callback(data.ops[0]._id)
        })
    },

    getallproducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collections.PRODUCTCOLLECTION).find().toArray()
            resolve(products)
        })
    },


    editproductdatails:(id)=>{
        var myquery ={_id: ObjectId(id)}
        return new Promise(async(resolve,reject)=>{
            var productdata=await db.get().collection(collections.PRODUCTCOLLECTION).findOne(myquery)
            resolve(productdata)
        })    
    },


    updatingproduct:(body)=>{
        console.log(parseInt(body.productprice))
        var myqueryid ={_id:ObjectId(body.productid)}
        var newvalues ={$set:{productname:body.productname,productdescription:body.productdescription,productprice:parseInt(body.productprice),productquantity:body.productquantity,
        category:body.category,brand:body.brand}}
        return new Promise(async(resolve,reject)=>{
            var product=await db.get().collection(collections.PRODUCTCOLLECTION).findOneAndUpdate(myqueryid,newvalues)
            resolve(product.value._id)
        })
    },


    deleteproduct:(id)=>{
        var queryid={_id:ObjectId(id)}
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.PRODUCTCOLLECTION).deleteOne(queryid)
            resolve(productremoved=true)
        })
    },



    insertnewcategory:(body)=>{
        return new Promise(async(resolve,reject)=>{
            var categoryexistcheck=await db.get().collection(collections.CATEGORY).findOne(body)
            if(!categoryexistcheck){
                await db.get().collection(collections.CATEGORY).insertOne(
                    {category:body.category         
                    }
                )
                resolve(categoryinserted=true)
            }else{
                reject(categoryexist=true)
            }

        })
    },


    fetchcategory:()=>{
        return new Promise(async(resolve,reject)=>{
            var fetchdata= await db.get().collection(collections.CATEGORY).find().toArray()
            if(fetchdata){
                resolve(fetchdata)
            }else{
                console.log('err')
            }
            
        })

    },

    deletecategory:(id)=>{
        var queryid={_id:ObjectId(id.id)}
        return new Promise(async(resolve,reject)=>{
           await db.get().collection(collections.CATEGORY).deleteOne(queryid)
           resolve(deleted=true)
        }) 
    },



    //getting catergory for addproduct form
    getcategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let data=await db.get().collection(collections.CATEGORY).find().toArray()
            if(data){
                resolve(data)
            }else{
                reject(datanotfound=true)
            }
            
        })

    },


    addnewbrand:(body)=>{
        let BRAND=body.brand;
        let queryid={_id:ObjectId(body.id)}
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.CATEGORY).update(queryid,{$push:{brand:BRAND}})
            resolve(addbrand=true)
        })
    },

    removebrand:(id)=>{
        let queryid={_id:ObjectId(id.id)}
        return new Promise(async(resolve,reject)=>{
            var brand=await db.get().collection(collections.CATEGORY).findOne(queryid)
            resolve(brand)

        })

    },

    removebrandpost:(body)=>{
        let BRAND=body.brand;
        let queryid={_id:ObjectId(body.id)}
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.CATEGORY).update(queryid,{$pull:{brand:BRAND}})
            resolve(done=true)
        })
    },

    getorderdetails:()=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.ORDER_COLLECTION).find().sort({date:-1}).toArray().then((response)=>{
                resolve(response)
            })
        })

    },

    cancelorder:(data)=>{
        orderid=data.id
        action=data.value
        return new Promise(async(resolve,reject)=>{
            if(action=='cancel'){
                var item= await db.get().collection(collections.ORDER_COLLECTION).findOneAndUpdate({_id:ObjectId(orderid)},{$set:{remove:true,status:"CANCELED"},})
                resolve()
            }else if(action=='undo'){
                var item= await db.get().collection(collections.ORDER_COLLECTION).findOneAndUpdate({_id:ObjectId(orderid)},{$set:{remove:false,status:"PLACED"}})
                resolve()
            }else{
                resolve()
            }
        })
    },



    getproductforsalesreport:()=>{
        return new Promise(async(resolve,reject)=>{
            var item = await db.get().collection(collections.ORDER_COLLECTION).find({status:'PLACED'}).toArray()
            resolve(item)
        })
    },


    getsortedproductwithdate:(query)=>{
        return new Promise(async(resolve,reject)=>{
            var startdate=new Date(query.StartDate)
            var enddate=new Date(query.enddate)
            var searchresult=await db.get().collection(collections.ORDER_COLLECTION).find({status:'PLACED',date:{$gte:startdate, $lt:enddate}}).toArray()
            resolve(searchresult)
        })
    },


    getperiodbaseddata:(period)=>{
        return new Promise(async(resolve,reject)=>{
            if(period.value=='w'){
                data= await db.get().collection(collections.ORDER_COLLECTION).find({status:'PLACED',date:{$gte:new Date(new Date() - 7 * 60 * 60 * 24 * 1000)}}).toArray()
                resolve(data)
            }else if(period.value=='d'){
                var start = new Date();
                start.setHours(0,0,0,0);
                var end = new Date();
                end.setHours(23,59,59,999);   
                data= await db.get().collection(collections.ORDER_COLLECTION).find({status:'PLACED',date: {$gte: start, $lt: end}}).toArray()
                resolve(data)
            }else if(period.value=='m'){
                data= await db.get().collection(collections.ORDER_COLLECTION).find({status:'PLACED',date:{$gte:new Date(new Date() - 30 * 60 * 60 * 24 * 1000)}}).toArray()
                resolve(data)
            }
        })
    },


    finddataforchartmonth:()=>{
        return new Promise(async(resolve,reject)=>{
            data= [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            year=new Date()
            monthlydata=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{status:'PLACED',date:{$gte:new Date(`${year.getFullYear()}`)}},
                },
                {
                    $group:{
                        _id:{$month:'$date'},
                        sales:{$sum:1},
                        total:{$sum:'$totalprice'}
                    }
                }
            ]).toArray()
            for(let i=0; i<monthlydata.length;i++){
                data[monthlydata[i]._id-1]=monthlydata[i].total
            }
            resolve(data)
        })
    },



    chart2weeklydata:()=>{
        return new Promise(async(resolve,reject)=>{
            data= [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            year=new Date()
            monthlydata=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{status:'PLACED',date:{$gte:new Date(`${year.getFullYear()}`)}},
                },
                {
                    $group:{
                        _id:{$month:'$date'},
                        sales:{$sum:1},
                        total:{$sum:'$totalprice'}
                    }
                }
            ]).toArray()
            for(let i=0; i<monthlydata.length;i++){
                data[monthlydata[i]._id-1]=monthlydata[i].sales
            }
            console.log(data)
            resolve(data)
        })
    },







    totalamountsales:()=>{
        return new Promise(async(resolve,reject)=>{
            var totalsum= await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                { 
                    $match:{status:'PLACED'},
                },
                {
                    $group:{
                        _id: null, 
                        total:{$sum:'$totalprice'}
                   }
                }
            ]).toArray()
            resolve(totalsum)
        })
    },




    totalplacedorders:()=>{
        return new Promise(async(resolve,reject)=>{
            var totalorder = await db.get().collection(collections.ORDER_COLLECTION).find({status:'PLACED'}).toArray()
            resolve(totalorder.length)
        })
    },

    totalnumberofproductsfordahboard:()=>{
        return new Promise(async(resolve,reject)=>{
            var totalnumber= await db.get().collection(collections.PRODUCTCOLLECTION).find().toArray()
            resolve(totalnumber.length)
        })
    },


    createcoupen:(data)=>{
        return new Promise(async(resolve,reject)=>{
            var coupenexist = await db.get().collection(collections.COUPEN_COLLECTION).findOne({coupencode:data.coupencode})
            if(!coupenexist){
                db.get().collection(collections.COUPEN_COLLECTION).insertOne({
                    coupenname: data.coupenname,
                    coupencode: data.coupencode,
                    coupenvalue: data.coupenvalue,
                    coupenvaliddate:data.validdate,
                })
                resolve(created=true)
            }
            resolve(created=false)
        })
    },

    findallcoupen:()=>{
        return new Promise(async(resolve,reject)=>{
            var allcoupen=await db.get().collection(collections.COUPEN_COLLECTION).find().toArray()
            resolve(allcoupen)
        })
    },


    deletecoupen:(param)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.COUPEN_COLLECTION).deleteOne({_id: ObjectId(param.id)})
            resolve()
        })
    },



    offerpriceadd:(body)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.PRODUCTCOLLECTION).update({_id:ObjectId(body.productid)},{$set:{productofferprice:parseInt(body.offerprice),prodoffer:true}})
            var productfind=await db.get().collection(collections.PRODUCTCOLLECTION).findOne({_id:ObjectId(body.productid)})
            if(productfind.categoryoffer==false || productfind.categoryoffer==undefined){
                await db.get().collection(collections.PRODUCTCOLLECTION).update({_id:ObjectId(body.productid)},{$set:{dealprice:parseInt(body.offerprice)}})
            }
            resolve()
        })
    },



    disableproductoffer:(query)=>{
        console.log(query)
        return new Promise(async(resolve,reject)=>{
            allprodetails=await db.get().collection(collections.PRODUCTCOLLECTION).findOne({_id:ObjectId(query.proid)})
            if(query.status=='true'){
                await db.get().collection(collections.PRODUCTCOLLECTION).update({_id:ObjectId(query.proid)},{$set:{prodoffer:true,dealprice:allprodetails.productofferprice}})
                resolve()
            }else if(query.status=='false'){
                if(allprodetails.categoryoffer!=true){
                    await db.get().collection(collections.PRODUCTCOLLECTION).update({_id:ObjectId(query.proid)},{$set:{prodoffer:false,dealprice:allprodetails.productprice}})
                    resolve()
                }else if(allprodetails.categoryoffer==true){
                    await db.get().collection(collections.PRODUCTCOLLECTION).update({_id:ObjectId(query.proid)},{$set:{prodoffer:false,dealprice:allprodetails.categoryofferprice}})
                    resolve()
                }
            }
        })
    },


    getallcategories:()=>{
        return new Promise(async(resolve,reject)=>{
            var allcategoreies= db.get().collection(collections.CATEGORY).find().toArray()
            resolve(allcategoreies)
        })
    },


    addcategoryofferform:(body)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.CATEGORY).update({_id:ObjectId(body.catid)},{$set:{offerpercentage:body.offerpercentage,categoryoffer:true}})
            db.get().collection(collections.PRODUCTCOLLECTION).find({category:body.category}).forEach (element => {
                productprice=parseInt(element.productprice)
                offerpercentage=parseInt(body.offerpercentage)
               var valueprice= productprice-((productprice*(offerpercentage*0.01)))
               db.get().collection(collections.PRODUCTCOLLECTION).updateOne({_id:ObjectId(element._id)},{$set:{categoryofferprice:valueprice,categoryoffer:true,dealprice:valueprice,catofferpercentage:offerpercentage}})
            }).then(()=>{
                resolve()
            })
        })
    },



    disableandenablecatoffer:(queery)=>{
        // console.log(queery)
        return new Promise(async(resolve,reject)=>{
            if(queery.status=='false'){
                val=false
                await db.get().collection(collections.CATEGORY).update({_id:ObjectId(queery.proid)},{$set:{categoryoffer:val}})
                await db.get().collection(collections.PRODUCTCOLLECTION).find({category:queery.catgory}).forEach(element => {
                    if(element.prodoffer!=true ){
                        db.get().collection(collections.PRODUCTCOLLECTION).updateOne({_id:ObjectId(element._id)},{$set:{categoryoffer:val,dealprice:element.productprice}})
                    }else if(element.prodoffer==true ){
                        db.get().collection(collections.PRODUCTCOLLECTION).updateOne({_id:ObjectId(element._id)},{$set:{categoryoffer:val,dealprice:element.productofferprice}})
                    }
                }).then(()=>{
                    resolve()
                })
            }else if(queery.status=='true'){
                val=true
                await db.get().collection(collections.CATEGORY).update({_id:ObjectId(queery.proid)},{$set:{categoryoffer:val}})
                db.get().collection(collections.PRODUCTCOLLECTION).find({category:queery.catgory}).forEach(element => {
                    productprice=parseInt(element.productprice)
                    offerpercentage=parseInt(queery.catofferpercentage)
                    var valueprice= productprice-((productprice*(offerpercentage*0.01)))
                    db.get().collection(collections.PRODUCTCOLLECTION).updateOne({_id:ObjectId(element._id)},{$set:{categoryoffer:val,dealprice:valueprice}})
                }).then(()=>{
                    resolve()
                })
            }
        })
    }






    
}