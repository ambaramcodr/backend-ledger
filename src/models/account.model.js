const mongoose = require('mongoose');

const accountSchema = mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:[true,'account must be associated with a user'],
        index:true
    },
    status:{
        enum:{
            values:['ACTIVE','FROZEN','CLOSED'],
            message:'Status can be either ACTIVE, FROZEN or CLOSED'
        }
    },
    currency:{
        type:String,
        required:[true,'currency is required'],
        default:'INR'
    }
},{
    timestamps:true
});

accountSchema.index({user:1, status:1});

const accountModel = mongoose.model('account', accountSchema);

module.exports = accountModel;