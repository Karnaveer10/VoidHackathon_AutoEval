const mongoose = require('mongoose')
const studentSchema = new mongoose.Schema(
    {   
        name:{type:String,required:true},
        regno:{type:String,required:true,unique:true},
        email:{type:String,required:true,unique:true},
        password:{type:String,required:true},
        role:{type:String,default:'student',immutable:true}
    },{minimize:false}
)
const studentModel = mongoose.models.Student || mongoose.model("student",studentSchema)
module.exports = studentModel;