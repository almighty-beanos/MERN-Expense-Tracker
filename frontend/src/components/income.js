import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { saveAs } from "file-saver";
import { utils, writeFile } from "xlsx";
import Papa from "papaparse";

const Income = () => {
  const [incomeList, setIncomeList] = useState([]);
  const [filteredIncome, setFilteredIncome] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("month");
  const [newIncome, setNewIncome] = useState({
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
    fetchIncomes();
  }, []);

  // Fetch all income transactions
  const fetchIncomes = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/transactions`);
      const incomes = res.data.filter((transaction) => transaction.type === "income");
      setIncomeList(incomes);
      setFilteredIncome(incomes); // Ensure initial filter matches fetched data
    } catch (error) {
      console.error("Error fetching income data", error);
    }
  };

  // Filter transactions based on selected time and filters
  const filterTransactions = () => {
    const now = new Date();
    let filteredData = [...incomeList];

    switch (selectedFilter) {
      case "day":
        filteredData = filteredData.filter((income) => {
          const incomeDate = new Date(income.date);
          return incomeDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        filteredData = filteredData.filter((income) => new Date(income.date) >= lastWeek);
        break;
      case "month":
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        filteredData = filteredData.filter((income) => new Date(income.date) >= lastMonth);
        break;
      case "quarter":
        const lastQuarter = new Date();
        lastQuarter.setMonth(now.getMonth() - 3);
        filteredData = filteredData.filter((income) => new Date(income.date) >= lastQuarter);
        break;
      case "year":
        const lastYear = new Date();
        lastYear.setFullYear(now.getFullYear() - 1);
        filteredData = filteredData.filter((income) => new Date(income.date) >= lastYear);
        break;
      default:
        filteredData = incomeList;
    }

    // Apply category and amount filters
    filteredData = filteredData.filter(
      (income) =>
        (!filters.category || income.category === filters.category) &&
        income.amount >= filters.minAmount &&
        income.amount <= filters.maxAmount
    );

    setFilteredIncome(filteredData);
  };

  // Handle input change for adding a transaction
  const handleChange = (e) => {
    setNewIncome({ ...newIncome, [e.target.name]: e.target.value });
  };  

  const handleAddIncome = async () => {
    if (!newIncome.description || !newIncome.category || !newIncome.amount || !newIncome.date) {
      alert("Please fill in all fields");
      return;
    }
  
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/transactions`, {
        type: "income",
        description: newIncome.description,
        category: newIncome.category,
        amount: parseFloat(newIncome.amount),
        date: newIncome.date,
      });
      setIncomeList([...incomeList, res.data]);
      setFilteredIncome([...filteredIncome, res.data]);
      setNewIncome({ description: "", category: "", amount: "", date: "" });
    } catch (error) {
      console.error("Error adding income", error);
    }
  };  

  // Delete an income transaction
  const handleDeleteIncome = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/transactions/${id}`);
      setIncomeList(incomeList.filter((transaction) => transaction._id !== id));
      setFilteredIncome(filteredIncome.filter((transaction) => transaction._id !== id)); // Ensure UI updates
    } catch (error) {
      console.error("Error deleting income", error);
    }
  };

  // Income Categories List
  const incomeCategories = [
    "Salary",
    "Business",
    "Freelance",
    "Investments",
    "Rental Income",
    "Dividends",
    "Royalties",
    "Gifts",
    "Refunds",
    "Other",
  ];

    const downloadData = (format) => {
        if (filteredIncome.length === 0) {
          alert("No income transactions available to download.");
          return;
        }
        
        const filteredExportData = filteredIncome.map(({ _id, userId, __v, ...rest }) => rest);

        if (format === "csv") {
          const csv = Papa.unparse(filteredExportData);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          saveAs(blob, "income_transactions.csv");
        } else if (format === "xlsx") {
          const ws = utils.json_to_sheet(filteredIncome);
          const wb = utils.book_new();
          utils.book_append_sheet(wb, ws, "Income Transactions");
          writeFile(wb, "Income_transactions.xlsx");
        }
    };

  return (
    <div className="container mt-4">
      <h2 className="text-center text-success">Income</h2>

      {/* Offcanvas Filter Button */}
      <button className="btn btn-primary mb-3" data-bs-toggle="offcanvas" data-bs-target="#filterOffcanvas">
        Filter
      </button>

      {/* Offcanvas Filter */}
      <div className="offcanvas offcanvas-start" id="filterOffcanvas">
        <div className="offcanvas-header bg-primary text-white">
          <h5>Filter Income</h5>
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
            {incomeCategories.map((category, index) => (
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

      {/* Add Income Form */}
      <div className="card p-3 mb-4">
        <h5>Add New Income</h5>
        <div className="row">
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Description" name="description" value={newIncome.description} onChange={handleChange} />
          </div>
          <div className="col-md-2">
            <select className="form-control" name="category" value={newIncome.category} onChange={handleChange}>
              <option value="">Select Category</option>
              {incomeCategories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <input type="number" className="form-control" placeholder="Amount" name="amount" value={newIncome.amount} onChange={handleChange} />
          </div>
          <div className="col-md-2">
            <input type="date" className="form-control" name="date" value={newIncome.date} onChange={handleChange} />
          </div>
          <div className="col-md-3">
            <button className="btn btn-success" onClick={handleAddIncome}>
              Add Income
            </button>
          </div>
        </div>
      </div>

      {/* Income List Table */}
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
          {filteredIncome.map((income) => (
            <tr key={income._id}>
              <td>{income.description}</td>
              <td>{income.category}</td>
              <td className="text-success">-₹{income.amount}</td>
              <td>{new Date(income.date).toLocaleDateString()}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteIncome(income._id)}>
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

export default Income;
