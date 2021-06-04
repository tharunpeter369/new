var db=require('../config/connection')
var collections=require('../config/collections')
const { ObjectId } = require("mongodb");

const bcrypt=require('bcrypt');
const { reject, promise } = require('bcrypt/promises');
const saltRound=10;
let referralCodeGenerator = require('referral-code-generator')



module.exports ={
    usersignupdetails:(userdata)=>{
        return new Promise(async(resolve,reject)=>{
            let emailexist=await db.get().collection(collections.USERDETAILS).findOne({useremail:userdata.useremail})
            let mobileexist=await db.get().collection(collections.USERDETAILS).findOne({usermobile:userdata.usermobile})
            console.log(mobileexist)
            if(!emailexist && !mobileexist){
                var code=referralCodeGenerator.alphaNumeric('uppercase', 3, 5)
                userdata.password=await bcrypt.hash(userdata.password,10)
                if(userdata.referrcodefromlink){
                    await db.get().collection(collections.USERDETAILS).findOneAndUpdate({referralcode:userdata.referrcodefromlink},{$inc:{referrcodepoint:1}})
                    point=1
                }else{
                    point=0
                }
                let userdetails=await db.get().collection(collections.USERDETAILS)
                .insertOne({username:userdata.userfname,
                    userlname:userdata.userlname,
                    useremail:userdata.useremail,
                    userpassword:userdata.password,
                    usermobile:userdata.usermobile,
                    userstatus:true,
                    referralcode:code,
                    referrallink:'https://ekart.tech/signup?referrcode='+code,
                    referrcodepoint:parseInt(point),
                    usedcoupen:[]
                })
                resolve(userdetails)
            }else if(emailexist){
                reject(userexist=true)
            }else if(mobileexist){
                reject(userexist=false)
            }
        })
    },


    usersignin:(body)=>{
        return new Promise(async(resolve,reject)=>{
            let usersignindata=await db.get().collection(collections.USERDETAILS).findOne({useremail:body.useremail})
            console.log(usersignindata)
            if(usersignindata){
                if(usersignindata.userstatus==true){
                    bcrypt.compare(body.userpassword,usersignindata.userpassword).then((status)=>{
                        if(status){
                            console.log('login success')
                            resolve(usersignindata)
                        }else{
                            console.log('login failed')
                            reject(login=false)
                        }
                    })
                }else{
                    console.log('login failed')
                    reject(login=false)
                }
            }else{
                console.log('login failed')
                reject(login=false)
            }
        })
    },



    updateprofile:(body)=>{
        console.log(body)
        return new Promise(async(resolve,reject)=>{       
            let emailcheck=await db.get().collection(collections.USERDETAILS).findOne({useremail:body.useremail})
            if(emailcheck){
                await db.get().collection(collections.USERDETAILS).findOneAndUpdate({_id:ObjectId(body.userid)},{$set:{
                    username:body.userfname,
                    userlname:body.userlname,
                    usermobile:body.usermobile,
                }})
                resolve()
            }else{
                await db.get().collection(collections.USERDETAILS).findOneAndUpdate({_id:ObjectId(body.userid)},{$set:{
                    username:body.userfname,
                    userlname:body.userlname,
                    usermobile:body.usermobile,
                    useremail:body.useremail
                }})
                resolve()
            }
        })
    },



    getuserdataforprofile:(data)=>{
        return new Promise(async(resolve,reject)=>{
            var data=await db.get().collection(collections.USERDETAILS).findOne({_id:ObjectId(data)})
            // resolve(data)
        })
    },


    fetchaddress:(id)=>{
        return new Promise(async(resolve,reject)=>{
            var addressess=await db.get().collection(collections.ADDREESS_COLLECTION).find().toArray()
            resolve(addressess)
        })
    },



    getuseraddressdetailsforprofile:(user)=>{
        return new Promise(async(resolve,reject)=>{
            var address=await db.get().collection(collections.ADDREESS_COLLECTION).find({userid:ObjectId(user._id)}).toArray()
            resolve(address)
        })
    },



    deletesavedaddress:(data)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.ADDREESS_COLLECTION).removeOne({_id:ObjectId(data.id)})
            resolve()
        })
    },



    updatepassword:async(newpass,user)=>{
        console.log(newpass,user)
        newpass.password=await bcrypt.hash(newpass.password,10)
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.USERDETAILS).updateOne({_id:ObjectId(user._id)},{$set:{userpassword:newpass.password}})
            resolve()
        })
    },



    otploginwork:(loginphonenumber,OTPCREATE)=>{
        var optcreated=false
        return new Promise(async(resolve,reject)=>{
            var user=await db.get().collection(collections.USERDETAILS).findOne({usermobile:loginphonenumber})
            if(user){
                await db.get().collection(collections.OTP_COLLECTION).insertOne({usermobile:loginphonenumber,
                    OTP:OTPCREATE,
                    createdate:new Date()
                }
                    )
                    resolve(optcreated=true)
            }else{
                resolve(optcreated)
            }
        })
    },

   verifyloginwithotp:(otpcode)=>{
    return new Promise(async(resolve,reject)=>{
        status=false;
        console.log(otpcode.otp)
        let usersignindata=await db.get().collection(collections.OTP_COLLECTION).findOne({OTP:parseInt(otpcode.otp)})
        if(usersignindata==null){
            console.log('null found')
            resolve(status)
        }else{
            if(usersignindata.OTP==otpcode.otp){
                console.log('otp found')
                var userdatails=await db.get().collection(collections.USERDETAILS).findOne({usermobile:usersignindata.usermobile})
                console.log(userdatails)
                resolve(userdatails)
            }else{
                console.log('otp failed')
                resolve(status)
            }
        }
    })
   },


   getUserDetailsForForgetpassword:(data)=>{
       return new Promise(async(resolve,reject)=>{
        //    console.log(data.forgetemail)
        var userdetails=await db.get().collection(collections.USERDETAILS).findOne({useremail:data.forgetemail})
        resolve(userdetails)
       })
   },

   checkforvalididinparams:(data)=>{
       return new Promise(async(resolve,reject)=>{
           var confirmuser=await db.get().collection(collections.USERDETAILS).findOne({_id:ObjectId(data.id)})
           resolve(confirmuser)
       })
   },

   



    forgerpasswordupdate:(password,id)=>{
        return new Promise(async(resolve,reject)=>{
            newpass=await bcrypt.hash(password,10)
            var find= await db.get().collection(collections.USERDETAILS).findOne({_id:ObjectId(id)})
            await db.get().collection(collections.USERDETAILS).updateOne({_id:ObjectId(id)},{$set:{userpassword:newpass}})
            resolve(updated=true)
        })
    },

    userFromUserAuthentication:(userdata,reffcode)=>{
        return new Promise(async(resolve,reject)=>{
            let emailexist=await db.get().collection(collections.USERDETAILS).findOne({useremail:userdata.email})
            if(!emailexist){
                var code=referralCodeGenerator.alphaNumeric('uppercase', 3, 5)
                if(reffcode){
                    await db.get().collection(collections.USERDETAILS).findOneAndUpdate({referralcode:reffcode},{$inc:{referrcodepoint:1}})
                    point=1
                }else{
                    point=0
                }
                let userdetails=await db.get().collection(collections.USERDETAILS)
                .insertOne({username:userdata.given_name,
                    userlname:userdata.family_name,
                    useremail:userdata.email,
                    userpassword:code,
                    // usermobile:code,
                    userstatus:true,
                    referralcode:code,
                    referrallink:'localhost:3000/signup?referrcode='+code,
                    referrcodepoint:parseInt(point),
                    usedcoupen:[]
                })
                let usersignindata=await db.get().collection(collections.USERDETAILS).findOne({useremail:userdata.email})

                resolve(usersignindata)
            }else if(emailexist){
                if(emailexist.userstatus==true){
                            console.log('login success')
                            resolve(emailexist)
                }else{
                    console.log('login failed')
                    reject(userexist=false)
                }
            }else if(mobileexist){
                reject(userexist=false)
            }
        })
    }




}    
