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
        classroom:{
            type:String, required:true
        },
        seats:{
            type:Number, required:true
        },
        role:{
            type:String, default:'faculty',immutable:true
        }
    }
)
const profModel = mongoose.models.prof || mongoose.model("Prof",profSchema)
module.exports = profModel