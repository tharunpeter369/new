const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect=function(done){
    const url='mongodb+srv://tharunpeter:8907603367@project.ok5n9.mongodb.net/shopping?retryWrites=true&w=majority'
    const dbname='shopping'

    mongoClient.connect(url,(err,data)=>{
        if(err){
            return done(err)
        }else{
            state.db=data.db(dbname)
            done()
        }  
    })
}
module.exports.get=function(){
    return state.db
}