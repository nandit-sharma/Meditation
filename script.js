const users = ['Nandit', 'Daksh', 'Harish', 'Samar'];
const startDate = new Date('2025-06-01');
const endDate = new Date('2025-12-31');
const storageKey = 'meditation-tracker-2025';
const API_URL = 'https://meditation-3.onrender.com/api';

let data = {};
let hasUnsavedChanges = false;

async function saveData() {
  const saveButton = document.getElementById('saveButton');
  const saveStatus = document.getElementById('saveStatus');
  
  try {
    saveButton.disabled = true;
    saveStatus.textContent = 'Saving...';
    saveStatus.className = 'save-status';
    
    if (Object.keys(data).length === 0) {
      throw new Error('No data to save');
    }
    
    console.log('Attempting to save data to:', `${API_URL}/data`);
    const response = await fetch(`${API_URL}/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', response.status, errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Server response:', result);
    
    saveStatus.textContent = 'Saved successfully!';
    saveStatus.className = 'save-status success';
    hasUnsavedChanges = false;
    console.log('Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
    saveStatus.textContent = `Error: ${error.message}`;
    saveStatus.className = 'save-status error';
    
    if (error.message.includes('Failed to fetch')) {
      console.log('Network error - please check if the server is running');
    }
  } finally {
    saveButton.disabled = false;
    setTimeout(() => {
      saveStatus.textContent = '';
      saveStatus.className = 'save-status';
    }, 3000);
  }
}

async function loadData() {
  try {
    console.log('Attempting to load data from:', `${API_URL}/data`);
    const response = await fetch(`${API_URL}/data`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', response.status, errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    data = await response.json();
    console.log('Data loaded successfully:', data);
  } catch (error) {
    console.error('Error loading data:', error);
    if (error.message.includes('Failed to fetch')) {
      console.log('Network error - please check if the server is running');
    }
    data = {};
  }
}

function generateDates(start, end) {
  const dates = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function calculateStreak(userData) {
  const dates = generateDates(startDate, endDate).map(formatDate);
  let streak = 0;
  
  for (let i = dates.length - 1; i >= 0; i--) {
    const dateStr = dates[i];
    if (userData[dateStr]) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateBestStreak(userData) {
  const dates = generateDates(startDate, endDate).map(formatDate);
  let currentStreak = 0;
  let bestStreak = 0;
  
  for (let i = 0; i < dates.length; i++) {
    if (userData[dates[i]]) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return bestStreak;
}

function calculateSelfControl(userData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthStart = new Date(currentYear, currentMonth, 1);
  const tomorrow = new Date(today); // Include today in range
  tomorrow.setDate(today.getDate() + 1);

  const dates = generateDates(monthStart, tomorrow).map(formatDate);
  const totalTicks = dates.filter(date => userData[date]).length;

  return Math.round((totalTicks / (dates.length - 1)) * 100);
}


function isFutureDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(dateStr);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
}

async function toggleTick(user, dateStr) {
  try {
    if (isFutureDate(dateStr)) {
      alert('Cannot update future dates!');
      return;
    }

    if (!data[user]) {
      data[user] = {};
    }
    
    data[user][dateStr] = !data[user][dateStr];
    hasUnsavedChanges = true;
    updateUI();
  } catch (error) {
    console.error('Error toggling tick:', error);
  }
}

function renderDetailedStreaks() {
  const detailedStreaksContainer = document.getElementById('detailed-streaks');
  detailedStreaksContainer.innerHTML = '';
  
  users.forEach(user => {
    const userData = data[user] || {};
    const selfControl = calculateSelfControl(userData);
    const bestStreak = calculateBestStreak(userData);
    
    const streakCard = document.createElement('div');
    streakCard.className = 'detailed-streak-card';
    
    streakCard.innerHTML = `
      <h3>${user}</h3>
      <div class="streak-info">
        <div class="streak-stat">
          <div class="label">Self Control</div>
          <div class="value current">${selfControl}%</div>
        </div>
        <div class="streak-stat">
          <div class="label">Best Streak</div>
          <div class="value">${bestStreak}</div>
        </div>
      </div>
    `;
    
    detailedStreaksContainer.appendChild(streakCard);
  });
}

function renderCalendar() {
  const dates = generateDates(startDate, endDate);
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';

  const months = {};
  dates.forEach(date => {
    const monthKey = date.getFullYear() + '-' + (date.getMonth() + 1);
    if (!months[monthKey]) {
      months[monthKey] = [];
    }
    months[monthKey].push(date);
  });

  Object.entries(months).forEach(([monthKey, monthDates]) => {
    const monthSection = document.createElement('div');
    monthSection.className = 'month-section';
    
    const monthTitle = document.createElement('div');
    monthTitle.className = 'month-title';
    const firstDate = monthDates[0];
    monthTitle.textContent = firstDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    monthSection.appendChild(monthTitle);

    const table = document.createElement('table');

    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th>User / Date</th>`;
    monthDates.forEach(date => {
      const th = document.createElement('th');
      th.textContent = date.getDate();
      if (isFutureDate(formatDate(date))) {
        th.className = 'future-date';
      }
      headerRow.appendChild(th);
    });
    headerRow.innerHTML += `<th class="monthly-ticks">Successful Days</th>`;
    table.appendChild(headerRow);

    users.forEach(user => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      nameCell.textContent = user;
      row.appendChild(nameCell);

      const userData = data[user] || {};
      let monthlyTicks = 0;
      
      monthDates.forEach(date => {
        const dateStr = formatDate(date);
        const cell = document.createElement('td');
        const ticked = userData[dateStr];
        if (ticked) monthlyTicks++;

        if (isFutureDate(dateStr)) {
          cell.className = 'future-date';
          cell.textContent = '🔒';
        } else {
          cell.className = ticked ? 'tick' : 'unticked';
          cell.textContent = ticked ? '✅' : '';
          cell.onclick = () => toggleTick(user, dateStr);
        }

        row.appendChild(cell);
      });

      const ticksCell = document.createElement('td');
      ticksCell.textContent = monthlyTicks;
      ticksCell.className = 'monthly-ticks';
      row.appendChild(ticksCell);

      table.appendChild(row);
    });

    monthSection.appendChild(table);
    calendar.appendChild(monthSection);
  });
}

function updateUI() {
  renderDetailedStreaks();
  renderCalendar();
}

async function initialize() {
  await loadData();
  updateUI();
  
  const saveButton = document.getElementById('saveButton');
  saveButton.addEventListener('click', () => {
    if (hasUnsavedChanges) {
      saveData();
    }
  });
}

document.addEventListener('DOMContentLoaded', initialize);
