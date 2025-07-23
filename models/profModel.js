const mongoose = require('mongoose')
const profSchema = new mongoose.Schema(
    {
        name:{
            type:String, required:true
        },
        id:{
            type:String, required:true
        },
        email:{
            type:String, required:true
        },
        password:{
            type:String, required:true
        },
        role:{
            type:String, default:'faculty',immutable:true
        }
    }
)
const profModel = mongoose.models.prof || mongoose.model("Prof",profSchema)
module.exports = profModel