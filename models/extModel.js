const mongoose = require('mongoose')
const profSchema = new mongoose.Schema(
    {
        extid:{
            type:String, required:true
        },
        password:{
            type:String, required:true
        },
        mapped:{
            type :Object ,default : {}
        },
        role:{
            type:String, default:'panel',immutable:true
        }
    }
)
const extModel = mongoose.models.ext || mongoose.model("Ext",extSchema)
module.exports = extModel