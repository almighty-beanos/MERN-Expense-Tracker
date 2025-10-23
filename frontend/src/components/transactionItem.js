import React from "react";

const TransactionItem = ({ transaction }) => {
  return (
    <tr>
      <td>{transaction.description}</td>
      <td>{transaction.category}</td>
      <td className={transaction.type === "income" ? "text-success" : "text-danger"}>
        {transaction.type === "income" ? `+ $${transaction.amount}` : `- $${transaction.amount}`}
      </td>
      <td>{transaction.date}</td>
    </tr>
  );
};

export default TransactionItem;
