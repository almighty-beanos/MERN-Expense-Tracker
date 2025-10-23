const Transaction = require("../models/Transaction");

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions" });
  }
};

const addTransaction = async (req, res) => {
  const { type, amount, category, description, date } = req.body;
  try {
    const transaction = new Transaction({
      userId: req.user.id,
      type,
      amount,
      category,
      description,
      date: date ? new Date(date) : new Date()
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Error adding transaction" });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Ensure the user deleting it owns the transaction
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Unauthorized to delete this transaction" });
    }

    await transaction.deleteOne();
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting transaction" });
  }
};

module.exports = { getTransactions, addTransaction, deleteTransaction };
