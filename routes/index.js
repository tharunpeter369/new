
var express = require('express');
const producthelpers = require('../adminhelpers/producthelpers');
var router = express.Router();
var userhelpers = require('../userhelpers/userproducthelpers')
const userdetailshelpers=require('../userhelpers/userdetailshelpers');
var db=require('../config/connection')
var collections=require('../config/collections')
const session = require('express-session');
const { Db } = require('mongodb');
const userproducthelpers = require('../userhelpers/userproducthelpers');
const { response, query } = require('express');
const { ObjectId } = require("mongodb");
const fast2sms = require('fast-two-sms')
var fs = require('fs');
require('dotenv').config();
var jwt=require('jsonwebtoken')
let nodemailer = require("nodemailer");
const passport = require("passport")
router.use(passport.initialize())
router.use(passport.session())
require('../public/javascripts/passport-setup')
const paypal = require('paypal-rest-sdk')
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AX3qYBMOwRGlC9vOgWarhRFjcFxxOwaSNkJhJ2GhCcGk634HvFM255BGYv8gNgbYq6rZkoY95aO0rJno',
    'client_secret': 'EIRNUvWJW1WWQ7Au4QlRU92fY6crKTKzK6n_DHHERqN92NhIZacErUF_zgr6iOZZlodvBz8tofGkO33r',
  });


const verifyuser=(req,res,next)=>{
  console.log('usercheck')
  let userverify=db.get().collection(collections.USERDETAILS).findOne({useremail:req.session.loginuseremail}).then((userverify)=>{
    if(userverify){
      if(userverify.userstatus){
        next()
      }else{
        req.session.loginusername=false;
        req.session.login=false;
        req.session.loginuseremail=false
        req.session.user=false;
        req.session.cartcount=false;
        next()
      }
    }else{
      req.session.loginusername=false;
      req.session.login=false;
      req.session.loginuseremail=false
      req.session.cartcount=false;
      req.session.user=false;
      next()
    }
  })
}



 const verifylogin=(req,res,next)=>{
   console.log('userlogin check')
   if(req.session.login){
     next()
   }else{
     res.redirect('/signin')
   }
 }



 //cartcount middleware

const getcount=async(req,res,next)=>{
  var userid=req.session.user._id
  console.log(req.session.user._id)
  let cartCount=await userproducthelpers.getcartcount(userid)
  req.session.cartcount=cartCount;
  console.log(req.session.cartcount)
  next()
}



/* GET home page. */

router.get('/',verifyuser,getcount,async function(req, res, next) {
  if(req.session.login){
    var userid=req.session.user._id
    let cartCount=await userproducthelpers.getcartcount(userid)
    let displayitems= await userproducthelpers.getproductforehome()
    let displaysorted= await userproducthelpers.getnewproductforehome()
    var item1=displayitems[0]
    var item2=displayitems[1]
    var item3=displayitems[2]
    var item4=displayitems[3]
    res.render('user/index', {layout:'user/userlayout',count:cartCount,item1,item2,item3,item4,displaysorted,count:req.session.cartcount,userdata:req.session.user});
  }else{
    let displayitems= await userproducthelpers.getproductforehome()
    let displaysorted= await userproducthelpers.getnewproductforehome()
    var item1=displayitems[0]
    var item2=displayitems[1]
    var item3=displayitems[2]
    var item4=displayitems[3]
    res.render('user/index', {layout:'user/userlayout',item1,item2,item3,item4,displaysorted});
  }
});




router.get('/productlist',verifyuser,getcount,async function(req,res,next){
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  console.log(req.query)
  var searchbar=true;
  urlcome=''+req.originalUrl
  value=req.query.value
  if((Object.keys(req.query).length)===0){
    urlcome=''+req.originalUrl+'?&value=1'
    var value=1
  }
  nextpageurl= urlcome.substring(0,urlcome.lastIndexOf('='))+'='+(parseInt(value)+1)
  prevpageurl= urlcome.substring(0,urlcome.lastIndexOf('='))+'='+(parseInt(value)-1)
  if(value==1){
    prevpageurl= urlcome.substring(0,urlcome.lastIndexOf('='))+'='+(parseInt(value))
  }
  let urls = urlcome.substring(0, urlcome.lastIndexOf('&'))
    userproducthelpers.usergetproduct(req.query).then(async(allproduct)=>{
        var allproductcatandbrand=await userproducthelpers.getcatogeryandbrandforfileter()
      res.render('user/productlist',{layout:'user/userlayout',userproduct:allproduct,userdata:req.session.user,catandbrand:allproductcatandbrand,count:req.session.cartcount,url:urls,nextpageurl,prevpageurl,searchbar})
    })
})




//signup page get

router.get('/signup',function(req,res){
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  // console.log(req.originalUrl)
  console.log(req.query.referrcode)
  req.session.referrcode=req.query.referrcode
  console.log('854697456966')
  console.log(req.session.referrcode)
  if(req.session.login){
    res.redirect('/productlist?value=1')
  }else{
    res.render('user/signup',{layout:'user/userlayout',emailexist:req.session.useremailexist,phonenumber:req.session.phonenumberexist,refer:req.query.referrcode})
    req.session.useremailexist=false;
    req.session.phonenumberexist=false;
  }
})

//signup page post
router.post('/signup',function(req,res){
  userdetailshelpers.usersignupdetails(req.body).then((userdetails)=>{
    if(userdetails){
      req.session.user=userdetails.ops[0];
      req.session.loginusername=userdetails.ops[0].username;
      req.session.loginuseremail=userdetails.ops[0].useremail;
      req.session.login=true;
      res.redirect('/productlist?value=1')
    }
  }).catch((userexist)=>{
    console.log(userexist)
    if(userexist){
      req.session.useremailexist=true;
    res.redirect('/signup')
    }else{
      req.session.phonenumberexist=true;
      res.redirect('/signup')
    }
  })
})


//log in function get
router.get('/signin',function(req,res){
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  if(req.session.login){
    res.redirect('/productlist')
  }else{
    res.render('user/signin',{layout:'user/userlayout',usererr:req.session.invaliduserdatils})
    req.session.invaliduserdatils=false;
  }
})

//log in function post
router.post('/signin',function(req,res){
  userdetailshelpers.usersignin(req.body).then((loginuser)=>{
    req.session.user=loginuser;  //all user data
    req.session.loginusername=loginuser.username;
    req.session.loginuseremail=loginuser.useremail;
    req.session.login=true;
    res.redirect('/productlist')
  }).catch((err)=>{
    req.session.invaliduserdatils=true;
    res.redirect('/signin')
  })
})


//sign out function
router.get('/signout',function(req,res){
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  req.session.loginusername=false;
  req.session.login=false;
  req.session.loginuseremail=false
  req.session.user=false;
  req.session.cartcount=false;
  res.redirect('/signin')
})


//individual product show in details whie selecting
router.get('/productdetail/:id',getcount,function(req,res){
  // console.log(req.params.id)
  userproducthelpers.productdetailing(req.params.id).then((specificproduct)=>{
     console.log(specificproduct)
     res.render('user/productdetail',{specificproduct:specificproduct,layout:'user/userlayout',userdata:req.session.user,count:req.session.cartcount});
  })
})

//view cart
router.get('/viewcart',verifylogin,getcount,async function(req,res){
  var userid=req.session.user._id
  let productofcart=await userproducthelpers.getproductofcart(userid)
  // console.log(productofcart.length)
  if(productofcart.length!=0){
    let totalamount=await userproducthelpers.gettotalamount(req.session.user._id)
    res.render('user/cart',{layout:'user/userlayout',productofcart:productofcart,userdata:req.session.user,totalamount,count:req.session.cartcount})
  }else{
    totalamount=0
    res.render('user/cart',{layout:'user/userlayout',userdata:req.session.user,totalamount})
  }
})





//add to cart
router.get('/addtocart/:id',verifylogin,getcount,(req,res)=>{
    console.log(req.params.id)
    var userid=req.session.user._id
    console.log(userid)
    userproducthelpers.addtocart(req.params.id,userid).then((status)=>{
      res.json(status)
    })
})



router.post('/changeproductquantity',getcount,(req,res,next)=>{
  console.log(req.body.user)
  userproducthelpers.changeproductquantity(req.body).then(async(response)=>{
    response.total =await userproducthelpers.gettotalamount(req.body.user)
    res.json(response)
  })

})

router.post('/deleteproductfromcart',(req,res,next)=>{
  console.log(req.body)
  userproducthelpers.deleteproductfromCart(req.body).then((response)=>{
    res.json(response)
  })

})


router.get('/placeorder',getcount,verifylogin,async(req,res)=>{
  let total =await userproducthelpers.gettotalamount(req.session.user._id)
  let productofcart=await userproducthelpers.getproductofcart(req.session.user._id)
  console.log(total)
  res.render('user/checkout',{layout:'user/userlayout',total,userdata:req.session.user,count:req.session.cartcount,productofcart:productofcart})

})

router.post('/placeorder',async(req,res)=>{
  let products=await userproducthelpers.getcartproductlistfororder(req.body.userid)
  let totalprice= await userproducthelpers.gettotalamount(req.body.userid,req.body.coupencode)
  userproducthelpers.placeorder(req.body,products,totalprice).then((orderid)=>{
    if(req.body.payment=='COD'){
      res.json({method:'COD'})
    }else if(req.body.payment=='ONLINE'){
      userproducthelpers.generaterazorpay(orderid,totalprice).then((response)=>{
        console.log(response)
        res.json({method:'ONLINE',razor:response})
      })
    }else if(req.body.payment=='PAYPAL'){
      req.session.amount=totalprice     // session for total price
      req.session.orderid=orderid       //session for order id
      const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
       
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Red Sox Hat",
                    "sku": "001",
                    "price": req.session.amount,
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": totalprice,
            },
            "description": "Hat for the best team ever"
        }]
    };
    
    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
          throw error;
      } else {
          for(let i = 0;i < payment.links.length;i++){
            if(payment.links[i].rel === 'approval_url'){
              // res.redirect(payment.links[i].href);
              res.json({method:'PAYPAL',paypallink:payment.links[i].href})
            }
          }
      }
    });
    }
    
  })
})


router.get('/success', async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  console.log(req.session.user._id)
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": req.session.amount
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        userproducthelpers.changepaymentstatus(req.session.orderid).then(()=>{
          req.session.amount=false   
          req.session.orderid=false
          res.redirect('/ordersuccesspage')
        })
    }
});
});


router.get('/cancel', async (req, res) => {
  res.redirect('/productlist')
});


router.post('/verifypayment',(req,res)=>{
  console.log(req.body)
  userproducthelpers.verifypayment(req.body).then(()=>{
    userproducthelpers.changepaymentstatus(req.body['order[receipt]']).then(()=>{
      console.log('paymentsuccessful')
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err)
    res.json({status:false})
  })
})



//display order successpage
router.get('/ordersuccesspage',(req,res)=>{
  res.render('user/ordersuccesspage',{layout:'user/userlayout'})
})

router.get('/myorder',verifylogin,async(req,res)=>{
  let orderproduct=await userproducthelpers.showorderproductinmyorder(req.session.user)
  console.log(orderproduct)
  res.render('user/myorder',{layout:'user/userlayout',orderproduct:orderproduct,userdata:req.session.user,count:req.session.cartcount})
})



//profile page

router.get('/profile',verifylogin,async(req,res)=>{
  console.log(req.session.user._id)
  var addressprofile=await userdetailshelpers.getuseraddressdetailsforprofile(req.session.user)
  userproducthelpers.getuserdataforprofile(req.session.user._id).then((profiledata)=>{
    console.log(addressprofile)
    req.session.user=profiledata
    req.session.loginusername=profiledata.username;
    req.session.loginuseremail=profiledata.useremail;
    res.render('user/myprofile',{layout:'user/userlayout',userdata:req.session.user,count:req.session.cartcount,addressprofile})
  }) 
})

//order calcellation 
    
router.get('/cancelorder/:id/:value',function(req,res){
  userproducthelpers.cancelorder(req.params).then(()=>{
    res.redirect('/myorder')
  })
})


//edit profile

router.get('/editprofile',verifylogin,function(req,res){
  console.log(req.session.user)
  res.render('user/editprofile',{layout:'user/userlayout',userdata:req.session.user,count:req.session.cartcount})
})



router.post('/editprofile',function(req,res){
  userdetailshelpers.updateprofile(req.body).then(()=>{
    res.redirect('/profile')
  })
})





//image upload edit profile 

router.post('/imageupload',function(req,res){
  // console.log(req.body.image)
  let id=req.session.user._id
  console.log(id)
  const path = ('./public/images/'+4+ id + '.png')
  const imgdata = req.body.image;
  const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
  fs.writeFileSync(path, base64Data,  {encoding: 'base64'});

})



router.post('/getaddress',function(req,res){
  userproducthelpers.findaddress(req.body,req.session.user._id).then((response)=>{
    res.json(response)
  })
  
})


router.get('/deleteaddress/:id',function(req,res){
  console.log(req.params)
  userdetailshelpers.deletesavedaddress(req.params).then(()=>{
    res.redirect('/profile')
  })
})


router.get('/changepassword',function(req,res){
  res.render('user/changepassword',{layout:'user/userlayout'})
})


router.post('/changepassword',function(req,res){
  console.log(req.body)
  userdetailshelpers.updatepassword(req.body,req.session.user).then(()=>{
    res.redirect('/profile')
  })
})


router.get('/otploginpage',function(req,res){
  res.render('user/otploginpage',{layout:'user/userlayout',mobilenumber:req.session.mobilnumbernotfound})
  req.session.mobilnumbernotfound=false
})



router.post("/sendmessage",function async (req,res){
  var OTP = Math.floor(1000 + Math.random() * 9000);
  console.log(OTP);
  userdetailshelpers.otploginwork(req.body.loginphonenumber,OTP).then(async (optcreated)=>{
    console.log(optcreated)
    if(optcreated){
        const response= await fast2sms.sendMessage({authorization:process.env.API_KEY, message:OTP,numbers:[req.body.loginphonenumber]})
        res.json({status:true})
         res.send(response)
    }else{
      req.session.mobilnumbernotfound=true
      res.json({status:false})
      // res.redirect('/otploginpage')
    }
  })
})


router.post('/otplogin',(req,res)=>{
  console.log(req.body)
  userdetailshelpers.verifyloginwithotp(req.body).then((resolve)=>{
    if(resolve==false){
      res.json({status:false})
    }else{
      req.session.user=resolve;  //all user data
      console.log(req.session.user)
      req.session.loginusername=resolve.username;
      console.log(req.session.loginusername)
      req.session.loginuseremail=resolve.useremail;
      console.log(req.session.loginuseremail)
      req.session.login=true;
      res.json({status:true})
    }
  })
})


router.get('/coupenapplybyuser',async(req,res)=>{
  let totalprice= await userproducthelpers.gettotalamount(req.session.user._id)
  userproducthelpers.checkcoupenreturnofferprice(req.query,totalprice,req.session.user).then((response)=>{
    res.json(response)
  })
})


router.get('/printinvoice/:id',(req,res)=>{
  console.log(req.params)
  userproducthelpers.getinvoicedetails(req.params).then((orderdetailsforinvoice)=>{
    res.render('user/invoice',{layout:'user/userlayout',orderdetailsforinvoice})
  })
})


router.get('/forgetpasswordAtLogin',(req,res)=>{
  res.render('user/forgetpasswordAtLogin',{layout:'user/userlayout'})
})


router.post('/forgetpasswordAtLogin',(req,res)=>{
  console.log(req.body)
  userdetailshelpers.getUserDetailsForForgetpassword(req.body).then((userdata)=>{
    console.log(userdata)
    if(!userdata){
      console.log('email not found')
      res.json({status:false})
    }else if(userdata){
      res.json({status:true})
      //user exist and create one time link that will send to user email
      console.log(process.env.JWT_SECRET)
      const secret=process.env.JWT_SECRET + userdata.userpassword
      console.log(secret)
      const payload={
        email:userdata.useremail,
        id:userdata._id
      }
      console.log(payload)
      const token=jwt.sign(payload,secret,{expiresIn:'15m'})
      let link=`http://localhost:3000/restPasswordWhenForgetPassword/${userdata._id}/${token}`;
      console.log(link)

        //sending email
      let transporter = nodemailer.createTransport({
        service:"gmail",
        auth:{
          user:'tharuntestemail@gmail.com',
          pass:'9544335325.tharun'
        }
      })

      var options = {
        from:'tharuntestemail@gmail.com',
        to:userdata.useremail,
        subject:'reset password link'+' ',
        text:link,
      }

      transporter.sendMail(options, function(err,info){
        if(err){
          console.log(err);
          return;
        }
        console.log('sent: '+info.response)
      })


    }
  })
})


router.get('/restPasswordWhenForgetPassword/:id/:token',(req,res)=>{
  const{id,token} = req.params
  userdetailshelpers.checkforvalididinparams(req.params).then((userdata)=>{
    if(!userdata){  //checking for valid user
      res.send('invalid user')
    }else{
      const secret=process.env.JWT_SECRET + userdata.userpassword
      try {
        const payload = jwt.verify(token,secret)
        res.render('user/resetforgetpassword',{layout:'user/userlayout',email:userdata.useremail})
      } catch (error) {
        res.send(error.message)
      }
    }
  })
})



router.post('/restPasswordWhenForgetPassword/:id/:token',(req,res)=>{
  const{id,token} = req.params
  console.log(req.body)
  console.log(req.params)
  userdetailshelpers.checkforvalididinparams(req.params).then((userdata)=>{
    if(!userdata){  //checking for valid user
      res.send('invalid user')
    }else{
      const secret=process.env.JWT_SECRET + userdata.userpassword
      console.log(secret)
      try {
        const payload = jwt.verify(token,secret)
        if(req.body.password==req.body.repassword){
          userdetailshelpers.forgerpasswordupdate(req.body.password,id).then((updated)=>{
            res.redirect('/signin')
          })
        }
      } catch (error) {
        res.send(error.message)
      }
    }
  })
})



//googlesuccess 
router.get('/googlesuccess',(req,res)=>{
  console.log(req.user)
  console.log(req.user.given_name)
  console.log(req.user.family_name)
  console.log(req.user.email)
  userdetailshelpers.userFromUserAuthentication(req.user,req.session.referrcode).then((userdetails)=>{
    if(userdetails){
      req.session.user=userdetails;
      req.session.loginusername=userdetails.username;
      req.session.loginuseremail=userdetails.useremail;
      req.session.login=true;
      res.redirect('/productlist?value=1')
    }
  }).catch((userexist)=>{
    console.log(userexist)
    if(userexist){
      req.session.useremailexist=true;
    res.redirect('/signup')
    }else{
      req.session.phonenumberexist=true;
      res.redirect('/signup')
    }
  })
})


/* google authentication*/

//googel login failed
router.get('/failed',(req,res)=>{
  res.send('failed')
})

//googel log in get request
router.get('/google',passport.authenticate('google',{scope:['profile','email']}))

//googel log in authentication
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/failed'}),(req,res)=>{
  res.redirect('/googlesuccess')
})


/* facebook authentication*/

//facebook log in get request
router.get('/facebook',passport.authenticate('facebook',{scope:'email'}))

//facebook log in authentication callback url
router.get('/facebook/callback',passport.authenticate('facebook',{successRedirect:'/facebooksuccess',failureRedirect:'/facebookfailure'}))

//facebook success redirect
router.get('/facebooksuccess',(req,res)=>{
  // res.send(req.user)
  var userdata={given_name:req.user._json.first_name,family_name:req.user._json.last_name,email:req.user._json.email}
  console.log(userdata)
  userdetailshelpers.userFromUserAuthentication(userdata,req.session.referrcode).then((userdetails)=>{
    if(userdetails){
      req.session.user=userdetails;
      req.session.loginusername=userdetails.username;
      req.session.loginuseremail=userdetails.useremail;
      req.session.login=true;
      res.redirect('/productlist?value=1')
    }
  }).catch((userexist)=>{
    console.log(userexist)
    if(userexist){
      req.session.useremailexist=true;
    res.redirect('/signup')
    }else{
      req.session.phonenumberexist=true;
      res.redirect('/signup')
    }
  })
})



// facebook failure redirect page
router.get('/facebookfailure',(req,res)=>{
  res.send('facebookfailure')
})


module.exports = router;








