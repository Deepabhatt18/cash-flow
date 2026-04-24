//  Load data
let income = Number(localStorage.getItem("income")) || 0;
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

//  Base values (important for currency)
let baseIncome = income;
let baseExpenses = [...expenses];

let currentCurrency = "USD";
let chart;

//  Currency Symbol
function getSymbol(currency) {
  if (currency === "INR") return "₹";
  if (currency === "EUR") return "€";
  return "$";
}

//  Set Income
function setIncome() {
  const input = document.getElementById("income-input").value;

  if (input === "" || input <= 0) {
    alert("Enter valid income");
    return;
  }

  income = Number(input);
  baseIncome = income;

  localStorage.setItem("income", income);

  document.getElementById("income-input").value = "";

  updateUI();
}

//  Add Expense
function addExpense() {
  const name = document.getElementById("expense-name").value;
  const amount = Number(document.getElementById("expense-input").value);

  if (name.trim() === "" || amount <= 0) {
    alert("Enter valid expense");
    return;
  }

  const expense = {
    id: Date.now(),
    name,
    amount
  };

  expenses.push(expense);
  baseExpenses.push({ ...expense });

  localStorage.setItem("expenses", JSON.stringify(expenses));

  document.getElementById("expense-name").value = "";
  document.getElementById("expense-input").value = "";

  updateUI();
}

//  Delete Expense
function deleteExpense(id) {
  expenses = expenses.filter(exp => exp.id !== id);
  baseExpenses = baseExpenses.filter(exp => exp.id !== id);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  updateUI();
}

//  Update UI
function updateUI() {
  const symbol = getSymbol(currentCurrency);
  document.getElementById("Income").innerText = symbol + income.toFixed(2);
  let totalExpense = 0;
  expenses.forEach(exp => totalExpense += exp.amount);
  document.getElementById("Expense").innerText = symbol + totalExpense.toFixed(2);
  const balance = income - totalExpense;
  const balanceEl = document.getElementById("Balance");
  balanceEl.innerText = symbol + balance.toFixed(2);

  //  10% Alert
  if (balance <= income * 0.1) {
    balanceEl.style.color = "#ef4444";

    if (!balanceEl.classList.contains("alert-shown")) {
      alert("⚠️ Warning: Balance below 10%");
      balanceEl.classList.add("alert-shown");
    }
  } else {
    balanceEl.style.color = "#22c55e";
    balanceEl.classList.remove("alert-shown");
  }

  //  Expense List
  const list = document.getElementById("expense-list");
  list.innerHTML = "";
  expenses.forEach(exp => {
    const li = document.createElement("li");

    li.innerHTML = `<span>${exp.name} - ${symbol}${exp.amount.toFixed(2)}</span>
      <button onclick="deleteExpense(${exp.id})">🗑</button>`;
    list.appendChild(li);
  });

  updateChart(balance, totalExpense);
}

//  Currency Convert
async function convertCurrency() {
  const selected = document.getElementById("currency").value;
  const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${currentCurrency}`);
  const data = await res.json();
  const rate = data.rates[selected];

  //  convert from base values
  income = baseIncome * rate;
  expenses = baseExpenses.map(exp => ({
    ...exp,
    amount: exp.amount * rate
  }));
  currentCurrency = selected;
  updateUI();
}

//  Chart
function updateChart(balance, totalExpense) {
  const data = [balance, totalExpense];
  if (chart) {
    chart.data.datasets[0].data = data;
    chart.update();
    return;
  }

  const ctx = document.getElementById("myChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Remaining Balance", "Total Expense"],
      datasets: [{
        data: data,
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    }
  });
}
window.onload = function () {
  updateUI();
};
//pdf download
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  doc.text("Expense Report", 10, y);
  y += 10;

  doc.text("Income: " + income, 10, y);
  y += 10;

  let totalExpense = 0;

  expenses.forEach(exp => {
    doc.text(`${exp.name} - ${exp.amount}`, 10, y);
    y += 10;
    totalExpense += exp.amount;
  });

  y += 10;
  doc.text("Total Expense: " + totalExpense, 10, y);
  y += 10;

  const balance = income - totalExpense;
  doc.text("Remaining Balance: " + balance, 10, y);

  doc.save("report.pdf");
}
const toggleBtn = document.getElementById("darkToggle");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  toggleBtn.innerText = "🌙 Dark";
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    toggleBtn.innerText = "🌙 Dark";
    localStorage.setItem("theme", "dark");
  } else {
    toggleBtn.innerText = "☀️ Light";
    localStorage.setItem("theme", "light");
  }
});