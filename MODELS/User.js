const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName:{
        type:String,
        required:true,
        uppercase:true,
        trim:true
    },
    userEmail:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
    },
    userPassword:{
        type:String,
        required:true,
        minlength:8,
        trim:true
    },
    studentRole:{
        type:String,
        required:true,
        enum:['student' ,' adim'],
        default:'student'
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note'
      }],
createdAt:{
    type:Date,
    default:Date.now
}
})

module.exports= mongoose.model('User',userSchema);