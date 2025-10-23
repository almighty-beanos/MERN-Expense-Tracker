import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  getDaysInMonth,
  eachDayOfInterval,
  startOfMonth,
} from "date-fns";
import { AuthContext } from "../context/AuthContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const timeOptions = [
  { label: "Last Week", value: "week" },
  { label: "Last Month", value: "month" },
  { label: "Last Quarter", value: "quarter" },
  { label: "Last Year", value: "year" },
  { label: "Max", value: "max" },
];

const Dashboard = () => {
  const { token, loading } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("month"); // Default to "Last Month"
  const [filteredIncome, setFilteredIncome] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  useEffect(() => {
    if (!loading && token) {
      fetchTransactions();
    }
  }, [loading, token]);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
      processFilteredData(res.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const processFilteredData = (data) => {
    const now = new Date();
    const filterByTime = (transaction) => {
      const transactionDate = new Date(transaction.date);
      switch (selectedFilter) {
        case "day":
          return transactionDate >= subDays(now, 1);
        case "week":
          return transactionDate >= subWeeks(now, 1);
        case "month":
          return transactionDate >= subMonths(now, 1);
        case "quarter":
          return transactionDate >= subQuarters(now, 1);
        case "year":
          return transactionDate >= subYears(now, 1);
        case "max":
          return true;
        default:
          return true;
      }
    };

    setFilteredIncome(data.filter((t) => t.type === "income" && filterByTime(t)));
    setFilteredExpenses(data.filter((t) => t.type === "expense" && filterByTime(t)));
  };

  useEffect(() => {
    processFilteredData(transactions);
  }, [selectedFilter]);

  const groupTransactionsByTime = (transactions) => {
    const grouped = {};
    const now = new Date();
    let labels = [];

    switch (selectedFilter) {
      case "month":
        labels = Array.from({ length: getDaysInMonth(now) }, (_, i) => (i + 1).toString());
        break;
      case "week":
        labels = eachDayOfInterval({
          start: subWeeks(now, 1),
          end: now,
        }).map((date) => format(date, "EEE"));
        break;
      case "quarter":
        labels = ["Month 1", "Month 2", "Month 3"];
        break;
      case "year":
        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        break;
      case "max":
        labels = transactions
          .map((t) => format(new Date(t.date), "yyyy-MM"))
          .filter((value, index, self) => self.indexOf(value) === index)
          .sort();
        break;
      default:
        break;
    }

    labels.forEach((label) => (grouped[label] = 0));

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      let key = "";

      switch (selectedFilter) {
        case "month":
          key = date.getDate().toString();
          break;
        case "week":
          key = format(date, "EEE");
          break;
        case "quarter":
          key = `Month ${((date.getMonth() % 3) + 1)}`;
          break;
        case "year":
          key = format(date, "MMM");
          break;
        case "max":
          key = format(date, "yyyy-MM");
          break;
        default:
          break;
      }

      if (grouped[key] !== undefined) {
        grouped[key] += transaction.amount;
      }
    });

    return grouped;
  };

  const incomeGrouped = groupTransactionsByTime(filteredIncome);
  const expenseGrouped = groupTransactionsByTime(filteredExpenses);
  const labels = Object.keys(incomeGrouped);

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Income (₹)",
        data: labels.map((label) => incomeGrouped[label] || 0),
        backgroundColor: "#28a745",
        borderColor: "#218838",
        borderWidth: 1,
      },
      {
        label: "Expenses (₹)",
        data: labels.map((label) => expenseGrouped[label] || 0),
        backgroundColor: "#dc3545",
        borderColor: "#c82333",
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return <h2 className="text-center mt-5">Loading...</h2>;
  }

  return (
    <div className="container mt-4">
      <h2 className="text-center">Dashboard</h2>
      <div className="row">
        <div className="col-md-12">
          <label>Sort By:</label>
          <select className="form-select" value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-md-6">
          <div className="alert alert-success">Total Income: ₹{filteredIncome.reduce((acc, t) => acc + t.amount, 0)}</div>
        </div>
        <div className="col-md-6">
          <div className="alert alert-danger">Total Expenses: ₹{filteredExpenses.reduce((acc, t) => acc + t.amount, 0)}</div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-center">Income & Expenses Over Time</h4>
        <Bar data={data} options={{ responsive: true, plugins: { legend: { display: true } } }} />
      </div>
    </div>
  );
};

export default Dashboard;
