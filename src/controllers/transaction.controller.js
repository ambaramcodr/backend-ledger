const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");

const emailService = require("../services/email.service");

async function createTransaction(req, res) {

    const { fromAccount, toAccount, amount, idempotencykey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencykey) {
        return res.status(400).json({
            message: "All fields are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    });

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    });

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invaild fromAccount or toAccount"
        });
    }

    const isTransactionAlreadyExist = await transactionModel.findOne({
        idempotencykey: idempotencykey
    });

    if (isTransactionAlreadyExist) {
        if (isTransactionAlreadyExist.status === "COMPLETED") {
            return res.status(400).json({
                message: "Transaction already completed"
            })
        }
        else if (isTransactionAlreadyExist.status === "FAILED") {
            return res.status(400).json({
                message: "Transaction already failed"
            })
        }
        else if (isTransactionAlreadyExist.status === "REVERSED") {
            return res.status(400).json({
                message: "Transaction already reversed"
            })
        }
        else if (isTransactionAlreadyExist.status === "PENDING") {
            return res.status(400).json({
                message: "Transaction is pending, try again later"
            })
        }
    }

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount !== "ACTIVE") {
        return res.status(400).json({
            message: "Both accounts should be active to proceed transaction"
        });
    }



}