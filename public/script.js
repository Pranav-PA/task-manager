// ===================== Constants =====================
const API_BASE_URL = `${window.location.origin}/api`;
const TOKEN_KEY = 'authToken';
const USER_KEY = 'currentUser';

// ===================== DOM Elements =====================
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const addTaskForm = document.getElementById('add-task-form');
const editTaskForm = document.getElementById('edit-task-form');
const tasksList = document.getElementById('tasks-list');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const editModal = document.getElementById('edit-modal');
const modalClose = document.querySelector('.modal-close');
const filterBtns = document.querySelectorAll('.filter-btn');
const tabBtns = document.querySelectorAll('.tab-btn');

let currentEditingTaskId = null;
let currentFilter = 'all';
let allTasks = [];

// ===================== Authentication Functions =====================

// Tab switching
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.remove('active-form');
    });
    
    if (tab === 'login') {
      loginForm.classList.add('active-form');
    } else {
      registerForm.classList.add('active-form');
    }
  });
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const messageEl = document.getElementById('login-message');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showMessage(messageEl, data.message, 'error');
      return;
    }
    
    // Store token and user info
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    showMessage(messageEl, 'Login successful! Redirecting...', 'success');
    setTimeout(() => {
      showApp();
    }, 500);
    
  } catch (error) {
    showMessage(messageEl, 'Error: ' + error.message, 'error');
  }
});

// Register
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm').value;
  const messageEl = document.getElementById('register-message');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, confirmPassword })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showMessage(messageEl, data.message, 'error');
      return;
    }
    
    // Store token and user info
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    showMessage(messageEl, 'Registration successful! Redirecting...', 'success');
    setTimeout(() => {
      showApp();
    }, 500);
    
  } catch (error) {
    showMessage(messageEl, 'Error: ' + error.message, 'error');
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  showAuth();
  loginForm.reset();
  registerForm.reset();
});

// ===================== Task Functions =====================

// Add Task
addTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-description').value;
  const priority = document.getElementById('task-priority').value;
  const dueDate = document.getElementById('task-duedate').value;
  const messageEl = document.getElementById('add-task-message');
  
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem(TOKEN_KEY)
      },
      body: JSON.stringify({ title, description, priority, dueDate })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showMessage(messageEl, data.message, 'error');
      return;
    }
    
    showMessage(messageEl, 'Task added successfully!', 'success');
    addTaskForm.reset();
    document.getElementById('task-priority').value = 'medium';
    
    setTimeout(() => {
      messageEl.textContent = '';
      loadTasks();
    }, 500);
    
  } catch (error) {
    showMessage(messageEl, 'Error: ' + error.message, 'error');
  }
});

// Load Tasks
async function loadTasks() {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      headers: { 'x-auth-token': localStorage.getItem(TOKEN_KEY) }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        showAuth();
        return;
      }
      throw new Error('Failed to load tasks');
    }
    
    allTasks = await response.json();
    renderTasks();
    
  } catch (error) {
    console.error('Error loading tasks:', error);
    tasksList.innerHTML = '<div class="empty-state">Error loading tasks</div>';
  }
}

// Render Tasks
function renderTasks() {
  const filteredTasks = allTasks.filter(task => {
    if (currentFilter === 'pending') return task.status === 'pending';
    if (currentFilter === 'completed') return task.status === 'completed';
    return true;
  });
  
  if (filteredTasks.length === 0) {
    tasksList.innerHTML = '<div class="empty-state">No tasks yet. Create one to get started! 🚀</div>';
    return;
  }
  
  tasksList.innerHTML = filteredTasks.map(task => `
    <div class="task-card ${task.status === 'completed' ? 'completed' : ''}">
      <div class="task-header">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        <span class="task-priority ${task.priority}">${task.priority}</span>
      </div>
      
      ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
      
      <div class="task-meta">
        <span class="task-status">${task.status === 'completed' ? '✓ Completed' : '⏳ Pending'}</span>
        ${task.dueDate ? `<span class="task-duedate">${formatDate(task.dueDate)}</span>` : ''}
      </div>
      
      <div class="task-actions">
        <button class="task-action-btn toggle" onclick="toggleTaskStatus('${task._id}', '${task.status}')">
          ${task.status === 'pending' ? '✓ Complete' : '↺ Pending'}
        </button>
        <button class="task-action-btn edit" onclick="editTask('${task._id}')">
          ✎ Edit
        </button>
        <button class="task-action-btn delete" onclick="deleteTask('${task._id}')">
          🗑 Delete
        </button>
      </div>
    </div>
  `).join('');
}

// Toggle Task Status
async function toggleTaskStatus(taskId, currentStatus) {
  const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
  
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem(TOKEN_KEY)
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (response.ok) {
      loadTasks();
    }
  } catch (error) {
    console.error('Error updating task:', error);
  }
}

// Edit Task - Open Modal
function editTask(taskId) {
  const task = allTasks.find(t => t._id === taskId);
  if (!task) return;
  
  currentEditingTaskId = taskId;
  document.getElementById('edit-task-title').value = task.title;
  document.getElementById('edit-task-description').value = task.description || '';
  document.getElementById('edit-task-priority').value = task.priority;
  document.getElementById('edit-task-duedate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
  
  editModal.classList.add('active');
}

// Edit Task - Submit
editTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('edit-task-title').value;
  const description = document.getElementById('edit-task-description').value;
  const priority = document.getElementById('edit-task-priority').value;
  const dueDate = document.getElementById('edit-task-duedate').value;
  
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${currentEditingTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem(TOKEN_KEY)
      },
      body: JSON.stringify({ title, description, priority, dueDate })
    });
    
    if (response.ok) {
      editModal.classList.remove('active');
      loadTasks();
    }
  } catch (error) {
    console.error('Error updating task:', error);
  }
});

// Delete Task
async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': localStorage.getItem(TOKEN_KEY) }
    });
    
    if (response.ok) {
      loadTasks();
    }
  } catch (error) {
    console.error('Error deleting task:', error);
  }
}

// ===================== Filter Functions =====================

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ===================== Modal Controls =====================

modalClose.addEventListener('click', () => {
  editModal.classList.remove('active');
});

document.getElementById('modal-cancel').addEventListener('click', () => {
  editModal.classList.remove('active');
});

editModal.addEventListener('click', (e) => {
  if (e.target === editModal) {
    editModal.classList.remove('active');
  }
});

// ===================== UI Functions =====================

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = 'form-message ' + type;
}

function showAuth() {
  authContainer.style.display = 'flex';
  appContainer.style.display = 'none';
}

function showApp() {
  authContainer.style.display = 'none';
  appContainer.style.display = 'block';
  
  const user = JSON.parse(localStorage.getItem(USER_KEY));
  userDisplay.textContent = `👤 ${user.username}`;
  
  loadTasks();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ===================== Initialize =====================

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    showApp();
  } else {
    showAuth();
  }
});
