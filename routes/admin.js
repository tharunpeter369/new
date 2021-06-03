var express = require("express");
const { getallproducts } = require("../adminhelpers/producthelpers");
var db=require('../config/connection')
var collections=require('../config/collections')
var router = express.Router();
var adminproducthelpers = require("../adminhelpers/producthelpers");
var adminuserhelpers = require("../adminhelpers/adminuserhelpers");
const { ObjectId } = require("mongodb");
const producthelpers = require("../adminhelpers/producthelpers");
var email = "tharunpeter@gmail.com";
var password = 369;
var fs = require('fs');


//home 
router.get("/", function (req, res, next) {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  if(req.session.adminLogin){
    res.redirect("/admin/dashboard")
  }else{
    res.render("admin/login", { layout: "admin/adminlayout",adminloginerr: req.session.adminLoginErr});
    req.session.adminLoginErr=false;
  }
});


//login for user
router.post("/login", function (req, res, next) {
  if (email == req.body.adminemail && password == req.body.adminpassword) {
    req.session.adminLogin=true;
    res.redirect("/admin/dashboard");
  }else{
    req.session.adminLoginErr=true;
    res.redirect('/admin/')
  }
});


//show dashboard 
router.get("/dashboard", function (req, res, next) {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  if(req.session.adminLogin){
    producthelpers.finddataforchartmonth().then(async(data)=>{
      var totalamountsales=await producthelpers.totalamountsales()
      var totalnumberofplacedorders= await producthelpers.totalplacedorders()
      var totalnumberofproducts = await producthelpers.totalnumberofproductsfordahboard()
      var weeklydatachart2= await producthelpers.chart2weeklydata()
     var total = totalamountsales[0].total
     var totaluser = await adminuserhelpers.totaluser()
      res.render("admin/index", { layout: "admin/newlayout",monthly:data,total,totaluser,totalnumberofplacedorders,totalnumberofproducts,weeklydatachart2});
    })
  }else{
    res.redirect('/admin/')
  }

});

//product management
router.get("/productmanagement", function (req, res, next) {
  adminproducthelpers.getallproducts().then((products) => {
    res.render("admin/productmanagement", {layout: "admin/newlayoutForTable", product: products });
  });
});

//add product by admin form
router.get("/addproductform", function (req, res, next) {
  producthelpers.getcategory().then((categorydata)=>{
    res.render("admin/addproductformdummy",{layout: "admin/newlayout",categorydata:categorydata });
  })
});


router.post("/addproductsubmit", function (req, res, next) {
  adminproducthelpers.addProduct(req.body, (id) => {
    if(req.body.pro_img1){
      const path = ('./public/productimages/' + 1 + id + '.jpeg')
      const imgdata = req.body.pro_img1;
      const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
      fs.writeFileSync(path, base64Data,  {encoding: 'base64'});
    }
    if(req.body.pro_img3){
      const path = ('./public/productimages/' + 2 + id + '.jpeg')
      const imgdata = req.body.pro_img2;
      const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
      fs.writeFileSync(path, base64Data,  {encoding: 'base64'});
    }
    if(req.body.pro_img3){
      const path = ('./public/productimages/' + 3 + id + '.jpeg')
      const imgdata = req.body.pro_img3;
      const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
      fs.writeFileSync(path, base64Data,  {encoding: 'base64'});
    }
    res.redirect("/admin/addproductform");
    console.log(id);
  });
});


router.get("/usermanagement", function (req, res, next) {
  adminuserhelpers.fetchuser().then((fetchuserdata) => {
    res.render("admin/usermanagementtable", {layout: "admin/newlayoutForTable", userdata: fetchuserdata });
  });
});


router.get("/edituser/:id", function (req, res) {
  adminuserhelpers.editformfetchdata(req.params.id).then((editformdata) => {
    res.render("admin/userdetailseditform", {layout: "admin/newlayout2" , editformdata: editformdata });
  });
});

router.post("/edituser", function (req, res) {
  adminuserhelpers.editformupdatedata(req.body).then((update) => {
    if (update) {
      res.redirect("/admin/usermanagement");
    }
  });
});

router.get("/blockuser/:id/:value", function (req, res) {
  adminuserhelpers.blockuser(req.params).then((statusupdated) => {
    if (statusupdated) {
      res.redirect("/admin/usermanagement");
    }
  });
});

router.get("/deleteuser/:id", function (req, res) {
  adminuserhelpers.deleteuser(req.params.id).then((callback) => {
    res.redirect("/admin/usermanagement");
  });
});

router.get("/addnewuserByadmin", function (req, res) {
  res.render("admin/addnewuserByadmin", { layout: "admin/newlayout" ,emailexist:req.session.adminaddusermailexist});
  req.session.adminaddusermailexist=false
});



router.post("/addnewuserByadmin", function (req, res) {
  adminuserhelpers.adminaddnewuser(req.body).then((userdetails) => {
    if (userdetails) {
      res.redirect("/admin/usermanagement");
    }
  }).catch((userexist)=>{
    req.session.adminaddusermailexist=true;
    res.redirect("/admin/addnewuserByadmin");
  })
});


//go to edit product page [get]
router.get("/editproductdetails/:id", function (req, res) {
  adminproducthelpers.editproductdatails(req.params.id).then((productdata) => {
    var allproductdata=db.get().collection(collections.CATEGORY).find().toArray().then((allproductdata=>{
      // console.log(allproductdata)
      // console.log(productdata)
      res.render("admin/editproductdetails", {
        layout: "admin/newlayout2",
        productdata: productdata,categorydata:allproductdata
      });
    }))
  });
});



//editing product in admin form[post]
router.post("/editproductadmin", function (req, res) {
  adminproducthelpers.updatingproduct(req.body).then((id) => {
    if (req.files == null) {
      res.redirect("/admin/productmanagement");
    } else {
      if (req.files.fileinputimage1) {
        let image1 = req.files.fileinputimage1;
        image1.mv("./public/productimages/" + 1 + id + ".jpeg");
      }
      if (req.files.fileinputimage2) {
        let image2 = req.files.fileinputimage2;
        image2.mv("./public/productimages/" + 2 + id + ".jpeg");
      }
      if (req.files.fileinputimage3) {
        let image3 = req.files.fileinputimage3;
        image3.mv("./public/productimages/" + 3 + id + ".jpeg");
      }
      res.redirect("/admin/productmanagement");
    }
  });
});


//deleting product from datatable prodcut
router.get('/deleteproduct/:id',function(req,res){
    adminproducthelpers.deleteproduct(req.params.id).then(productremoved)
    if(productremoved){
        res.redirect('/admin/productmanagement')
    }else{
        res.redirect(err)
    }
})


//catogery management page rendering
router.get('/categorymanagement',function(req,res){
  producthelpers.fetchcategory().then((fetchdata)=>{
    // console.log(fetchdata)
    res.render('admin/categorymanagement',{layout:"admin/newlayoutForTable",fetchdata:fetchdata})
  })
})

//add new category brand(get)
router.get('/addnewcategory',function(req,res){
  res.render('admin/addnewcategorybrand',{ layout: "admin/newlayout",exist:req.session.catogeryexist})
  req.session.catogeryexist=false;
})

//add new category brand(post)
router.post('/addnewcategory',function(req,res){
  // console.log(req.body)
  producthelpers.insertnewcategory(req.body).then((categoryinserted)=>{
    res.redirect('/admin/addnewcategory')
  }).catch((categoryexist)=>{
    console.log('catogery exist')
    req.session.catogeryexist=true;
    res.redirect('/admin/addnewcategory')
  })
})


//deleting brand category
router.get('/deletebrand/:id',function(req,res){
  producthelpers.deletecategory(req.params).then((deleted)=>{
    res.redirect('/admin/categorymanagement') 
  })
})


//add brand(get)
router.get('/addbrand/:id',function(req,res){
  res.render('admin/addbrandform',{ layout: "admin/newlayout2",id:req.params})
})

//add brand(post)
router.post('/addbrand',function(req,res){
  console.log(req.body)
  producthelpers.addnewbrand(req.body).then((addbrand)=>{
    res.redirect('/admin/categorymanagement')
  })
})


//removebrand
router.get('/removebrand/:id',function(req,res){
  producthelpers.removebrand(req.params).then((branddetails)=>{
    var id=branddetails._id
    res.render('admin/removebrand',{ layout: "admin/newlayout2",branddetails:branddetails.brand,id:id})
  })
})

router.post('/removebrand',function(req,res){
  console.log(req.body)
  producthelpers.removebrandpost(req.body).then((done)=>{
    res.redirect('/admin/categorymanagement')
  })
})


//order management
router.get('/ordermanagement',function(req,res){
  producthelpers.getorderdetails().then((orderdetails)=>{
    res.render('admin/ordermanagmenttable',{layout:"admin/newlayoutForTable",orderdetails:orderdetails})
  })
})



//cancel order
  router.get('/cancelorder/:id/:value',function(req,res){
    producthelpers.cancelorder(req.params).then(()=>{
      res.redirect('/admin/ordermanagement')
    })
  })


//logout function
router.get('/logout',function(req,res){
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  req.session.adminLogin=false;
  res.redirect('/admin/')
})

//sales report
router.get("/salesreport",function(req,res){
    let current_datetime = new Date()
    producthelpers.getproductforsalesreport().then((items)=>{
    res.render('admin/salesreport',{layout:"admin/newlayoutForTable",items:items})
  })
})

//salesreportdatasearching
router.get('/salesreportdatesearch',function(req,res){
  producthelpers.getsortedproductwithdate(req.query).then((items)=>{
    res.render('admin/salesreport',{layout:"admin/newlayoutForTable",items:items})
  })
})


  router.get('/salesreportonperiod',function(req,res){
    // console.log(req.query);
    producthelpers.getperiodbaseddata(req.query).then((data)=>{
      res.render('admin/salesreport',{layout:"admin/newlayoutForTable",items:data})
    })
  })


 //coupenmanagement
 router.get('/coupenmanagement',function(req,res){
     producthelpers.findallcoupen().then((allcoupen)=>{
      res.render('admin/coupenmanagement',{layout:"admin/newlayoutForTable",allcoupen})
     })
  })



//add coupen
router.get('/addcoupen',function(req,res){
  res.render('admin/addcoupenform',{ layout: "admin/newlayout",coupenexist:req.session.coupenexist})
  req.session.coupenexist=false

})


router.post('/addcoupen',function(req,res){
  producthelpers.createcoupen(req.body).then((created)=>{
    if(created){
      res.redirect('/admin/coupenmanagement')
    }else{
      req.session.coupenexist=true
      res.redirect('/admin/addcoupen')
    }
  })
})



//offer management
router.get('/offermanagement',function(req,res){
  adminproducthelpers.getallproducts().then((products) => {
    res.render('admin/offermanagementtable',{layout:"admin/newlayoutForTable",product: products})
  });
})


//add offer price
router.get('/addofferprice',function(req,res){
  res.render('admin/addproductofferform',{layout: "admin/newlayout2",quarydetails:req.query})
})

//add offer price
router.post('/addofferprice',function(req,res){
  producthelpers.offerpriceadd(req.body).then(()=>{
    res.redirect('/admin/offermanagement')
  })
})

// offe disable and enable
router.get('/disableandenable',function(req,res){
  producthelpers.disableproductoffer(req.query).then(()=>{
    res.redirect('/admin/offermanagement')
  })
})


//delete coupen
router.get('/deletecoupen/:id',function(req,res){
  producthelpers.deletecoupen(req.params).then(()=>{
    res.redirect('/admin/coupenmanagement')
  })
})


//catogorry offer management
router.get('/catgoryoffermanagement',function(req,res){
  adminproducthelpers.getallcategories().then((catogories) => {
    res.render('admin/categoryoffermanagement',{layout:"admin/newlayoutForTable",catogories})
  });
})


//form for add offer for category(get)
router.get('/addcategoryofferform',function async(req,res){
  res.render('admin/addcategoryofferform',{layout: "admin/newlayout2",quarydetails:req.query})
})


//form for add offer for category(post)
router.post('/addcategoryofferform',function async(req,res){
  producthelpers.addcategoryofferform(req.body).then(()=>{
    res.redirect('/admin/catgoryoffermanagement')
  })
})


//disable and enable category offer
router.get('/disableandenablecatoffer',function(req,res){
  producthelpers.disableandenablecatoffer(req.query).then(()=>{
    res.redirect('/admin/catgoryoffermanagement')
  })
})




module.exports = router;
