var db = require("../config/connection");
var collections = require("../config/collections");
const { ObjectId } = require("mongodb");
const bcrypt=require('bcrypt')
const saltRound=10;

module.exports = {
  fetchuser: () => {
    return new Promise(async (resolve, reject) => {
      var fetchuserdata = await db
        .get()
        .collection(collections.USERDETAILS)
        .find()
        .toArray();
    //   console.log(fetchuserdata);
      resolve(fetchuserdata);
    });
  },

  editformfetchdata: (id) => {
    return new Promise(async (resolve, reject) => {
      var editformdata = await db
        .get()
        .collection(collections.USERDETAILS)
        .findOne({ _id: ObjectId(id) });
      resolve(editformdata);
    });
  },

  editformupdatedata: (data) => {
    var update = false;
    var id = data.id;
    console.log(data);
    return new Promise(async (resolve, reject) => {
      var finduser = await db
        .get()
        .collection(collections.USERDETAILS)
        .findOne({ _id: ObjectId(id) });
      if (finduser) {
        var myquery = { _id: ObjectId(id) };
        var newvalues = {
          $set: {
            username: data.username,
            userlname: data.userlname,
            useremail: data.useremail,
          },
        };
        db.get()
          .collection(collections.USERDETAILS)
          .updateOne(myquery, newvalues, function (err, res) {
            if (err) {
              console.log(err);
            } else {
              console.log("one data updated");
              resolve(update=true)
            }
          });
      } else {
        console.log("data not found");
      }

    });
  },

  blockuser:(data)=>{
      var myquery={_id:ObjectId(data.id)}
      var check='block';
      var statusupdated=false;
        return new Promise(async(resolve,reject)=>{
            if(data.value!=check){
                var findstatus=await db.get().collection(collections.USERDETAILS).findOneAndUpdate(myquery,{$set:{userstatus:true}})
                resolve(statusupdated=true)
            }else{
                var findstatus=await db.get().collection(collections.USERDETAILS).findOneAndUpdate(myquery,{$set:{userstatus:false}})
                resolve(statusupdated=true)
            }
        })
  },


  deleteuser:(id)=>{
      var myquery={_id:ObjectId(id)}
      return new Promise(async(resolve,reject)=>{
          await db.get().collection(collections.USERDETAILS).deleteOne(myquery)
          resolve(callback=true)
      })
  },


    adminaddnewuser:(userdata)=>{
    return new Promise(async(resolve,reject)=>{
      let emailexist=await db.get().collection(collections.USERDETAILS).findOne({useremail:userdata.useremail})
      if(!emailexist){
        userdata.password=await bcrypt.hash(userdata.password,10)
        let userdetails=await db.get().collection(collections.USERDETAILS)
        .insertOne({username:userdata.userfname,
            userlname:userdata.userlname,
            useremail:userdata.useremail,
            userpassword:userdata.password,
            userstatus:true,
        })
        resolve(userdetails)
      }else{
        reject(userexist=true)
      }
    })
},



totaluser:()=>{
  return new Promise(async(resolve,reject)=>{
    totaluser= await db.get().collection(collections.USERDETAILS).find().toArray()
    resolve(totaluser.length)
  })
}









};
