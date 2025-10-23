import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { saveAs } from "file-saver";
import { utils, writeFile } from "xlsx";
import Papa from "papaparse";

const Expense = () => {
  const [expenseList, setExpenseList] = useState([]);
  const [filteredExpense, setFilteredExpense] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("month");
  const [newExpense, setNewExpense] = useState({
    description: "",
    category: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [filters, setFilters] = useState({
    category: "",
    minAmount: 0,
    maxAmount: 10000,
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Fetch all expense transactions
  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/transactions`);
      const expenses = res.data.filter((transaction) => transaction.type === "expense");
      setExpenseList(expenses);
      setFilteredExpense(expenses); // Ensure initial filter matches fetched data
    } catch (error) {
      console.error("Error fetching expense data", error);
    }
  };

  // Filter transactions based on selected time and filters
  const filterTransactions = () => {
    const now = new Date();
    let filteredData = [...expenseList];

    switch (selectedFilter) {
      case "day":
        filteredData = filteredData.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        filteredData = filteredData.filter((expense) => new Date(expense.date) >= lastWeek);
        break;
      case "month":
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        filteredData = filteredData.filter((expense) => new Date(expense.date) >= lastMonth);
        break;
      case "quarter":
        const lastQuarter = new Date();
        lastQuarter.setMonth(now.getMonth() - 3);
        filteredData = filteredData.filter((expense) => new Date(expense.date) >= lastQuarter);
        break;
      case "year":
        const lastYear = new Date();
        lastYear.setFullYear(now.getFullYear() - 1);
        filteredData = filteredData.filter((expense) => new Date(expense.date) >= lastYear);
        break;
      default:
        filteredData = expenseList;
    }

    // Apply category and amount filters
    filteredData = filteredData.filter(
      (expense) =>
        (!filters.category || expense.category === filters.category) &&
        expense.amount >= filters.minAmount &&
        expense.amount <= filters.maxAmount
    );

    setFilteredExpense(filteredData);
  };

  // Handle input change for adding a transaction
  const handleChange = (e) => {
    setNewExpense({ ...newExpense, [e.target.name]: e.target.value });
  };  

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.category || !newExpense.amount || !newExpense.date) {
      alert("Please fill in all fields");
      return;
    }
  
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/transactions`, {
        type: "expense",
        description: newExpense.description,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date,
      });
      setExpenseList([...expenseList, res.data]);
      setFilteredExpense([...filteredExpense, res.data]);
      setNewExpense({ description: "", category: "", amount: "", date: "" });
    } catch (error) {
      console.error("Error adding expense", error);
    }
  };  

  // Delete an expense transaction
  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/transactions/${id}`);
      setExpenseList(expenseList.filter((transaction) => transaction._id !== id));
      setFilteredExpense(filteredExpense.filter((transaction) => transaction._id !== id)); // Ensure UI updates
    } catch (error) {
      console.error("Error deleting expense", error);
    }
  };

  // Expense Categories List
  const expenseCategories = [
    "Produce", "Dairy", "Meat and Poultry", "Pantry", "Bakery", "Beverages",
    "Frozen Foods", "Cleaning Supplies", "Personal Care", "Paper Goods",
    "Pet Supplies", "Apparel", "Electronics", "Hardware", "Home Goods",
    "Office Supplies", "Books and Media", "Garden and Outdoor", "Automotive", "Fast Food"
  ];

    const downloadData = (format) => {
        if (filteredExpense.length === 0) {
          alert("No expense transactions available to download.");
          return;
        }
        
        const filteredExportData = filteredExpense.map(({ _id, userId, __v, ...rest }) => rest);

        if (format === "csv") {
          const csv = Papa.unparse(filteredExportData);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          saveAs(blob, "expense_transactions.csv");
        } else if (format === "xlsx") {
          const ws = utils.json_to_sheet(filteredExpense);
          const wb = utils.book_new();
          utils.book_append_sheet(wb, ws, "Expense Transactions");
          writeFile(wb, "Expense_transactions.xlsx");
        }
    };

  return (
    <div className="container mt-4">
      <h2 className="text-center text-danger">Expense</h2>

      {/* Offcanvas Filter Button */}
      <button className="btn btn-primary mb-3" data-bs-toggle="offcanvas" data-bs-target="#filterOffcanvas">
        Filter
      </button>

      {/* Offcanvas Filter */}
      <div className="offcanvas offcanvas-start" id="filterOffcanvas">
      <div className="offcanvas-header bg-primary text-white">
          <h5>Filter Expenses</h5>
          <button type="button" className="btn-close text-white" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body">
          {/* Time Range Filter */}
          <label>Time Range</label>
          <select className="form-control mb-2" value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
            <option value="all">All</option>
          </select>

          {/* Category Filter */}
          <label>Category</label>
          <select className="form-control mb-2" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All</option>
            {expenseCategories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Min-Max Amount Filter */}
          <label>Amount Range</label>
          <div className="d-flex gap-2">
            <input
              type="number"
              className="form-control"
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: Number(e.target.value) || 0 })}
            />
            <input
              type="number"
              className="form-control"
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: Number(e.target.value) || 10000 })}
            />
          </div>

          {/* Apply Filter Button */}
          <button className="btn btn-success mt-3" onClick={filterTransactions} data-bs-dismiss="offcanvas">
            Apply
          </button>
        </div>
      </div>

      {/* Add Expense Form */}
      <div className="card p-3 mb-4">
        <h5>Add New Expense</h5>
        <div className="row">
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Description" name="description" value={newExpense.description} onChange={handleChange} />
          </div>
          <div className="col-md-2">
            <select className="form-control" name="category" value={newExpense.category} onChange={handleChange}>
              <option value="">Select Category</option>
              {expenseCategories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <input type="number" className="form-control" placeholder="Amount" name="amount" value={newExpense.amount} onChange={handleChange} />
          </div>
          <div className="col-md-2">
            <input type="date" className="form-control" name="date" value={newExpense.date} onChange={handleChange} />
          </div>
          <div className="col-md-3">
            <button className="btn btn-success" onClick={handleAddExpense}>
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Expense List Table */}
      <table className="table table-bordered table-hover shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpense.map((expense) => (
            <tr key={expense._id}>
              <td>{expense.description}</td>
              <td>{expense.category}</td>
              <td className="text-danger">-₹{expense.amount}</td>
              <td>{new Date(expense.date).toLocaleDateString()}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteExpense(expense._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3">
        <button className="btn btn-primary me-2" onClick={() => downloadData("csv")}>Download CSV</button>
        <button className="btn btn-success" onClick={() => downloadData("xlsx")}>Download XLSX</button>
      </div>
    </div>
  );
};
export default Expense;
