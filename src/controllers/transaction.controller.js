const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");

const emailService = require("../services/email.service");
const { default: mongoose } = require("mongoose");

async function createTransaction(req, res) {

    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
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
        idempotencyKey: idempotencyKey
    });

    if (isTransactionAlreadyExist) {
        if (isTransactionAlreadyExist.status === "COMPLETED") {
            return res.status(400).json({
                message: "Transaction already completed",
                transaction: isTransactionAlreadyExist
            })
        }
        else if (isTransactionAlreadyExist.status === "FAILED") {
            return res.status(400).json({
                message: "Transaction already failed",
                transaction: isTransactionAlreadyExist
            })
        }
        else if (isTransactionAlreadyExist.status === "REVERSED") {
            return res.status(400).json({
                message: "Transaction already reversed",
                transaction: isTransactionAlreadyExist
            })
        }
        else if (isTransactionAlreadyExist.status === "PENDING") {
            return res.status(400).json({
                message: "Transaction is pending, try again later",
                transaction: isTransactionAlreadyExist
            })
        }
    }

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both accounts should be active to proceed transaction"
        });
    }

    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance, current balance is ${balance} and requested amount is ${amount}`
        })
    }

    let transaction;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0];

        const debitLederEntry = await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        await (() => {
            return new Promise((resolve) =>
                setTimeout(resolve, 15 * 1000));
        })();

        const creditLederEntry = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        // transaction.status = "COMPLETED";
        // await transaction.save({ session });

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        );

        await session.commitTransaction();
        session.endSession();
    } catch (err) {
        return res.status(400).json({
            message: "Transaction is pending due to some issue, please retry after sometime"
        });
    }

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toUserAccount);

    return res.status(200).json({
        message: "Transaction completed successfully",
        transaction: transaction
    });
}

async function createInitialFundsTransaction(req, res) {
    console.log(req.body);
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    });

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invaild Account",
        });
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    });

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    });

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session });

    const creditLedgerEntry = await ledgerModel.create([{
        account: toUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session });

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    });
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}
