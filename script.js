// DOM Elements
        const taskForm = document.getElementById('task-form');
        const taskInput = document.getElementById('task-input');
        const taskList = document.getElementById('task-list');
        const themeToggle = document.getElementById('theme-toggle');
        const habitTracker = document.getElementById('habit-tracker');
        const totalTasksEl = document.getElementById('total-tasks');
        const completedTasksEl = document.getElementById('completed-tasks');
        const streakDaysEl = document.getElementById('streak-days');
        const completionRateEl = document.getElementById('completion-rate');
        
        // Sample categories
        const categories = [
            { name: 'Work', color: 'work' },
            { name: 'Personal', color: 'personal' },
            { name: 'Health', color: 'health' },
            { name: 'Learning', color: 'learning' },
            { name: 'Other', color: 'other' }
        ];
        
        // Task data
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        let habits = JSON.parse(localStorage.getItem('habits')) || [0,0,0,0,0,0,0]; // 7 days
        
        // Initialize the app
        function initApp() {
            renderTasks();
            renderHabits();
            updateStats();
            
            // Set up event listeners
            setupEventListeners();
        }
        
        // Render tasks
        function renderTasks() {
            taskList.innerHTML = '';
            
            if (tasks.length === 0) {
                taskList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>No tasks yet. Add your first task!</p>
                    </div>
                `;
                return;
            }
            
            tasks.forEach((task, index) => {
                const taskEl = document.createElement('div');
                taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
                taskEl.dataset.id = index;
                
                taskEl.innerHTML = `
                    <div class="task-checkbox">
                        <input type="checkbox" id="task-${index}" ${task.completed ? 'checked' : ''}>
                        <label for="task-${index}"></label>
                    </div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <div class="task-category">
                                <span class="category-dot ${task.category}"></span>
                                <span>${task.category}</span>
                            </div>
                            <div class="task-due">
                                <i class="fas fa-calendar"></i>
                                <span>${task.dueDate || 'No date'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn edit-btn">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action-btn delete-btn">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                
                taskList.appendChild(taskEl);
                
                // Add event listeners for this task
                const checkbox = taskEl.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', () => toggleTaskCompleted(index));
                
                const editBtn = taskEl.querySelector('.edit-btn');
                editBtn.addEventListener('click', () => editTask(index));
                
                const deleteBtn = taskEl.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => deleteTask(index));
            });
        }
        
        // Render habit tracker
        function renderHabits() {
            habitTracker.innerHTML = '';
            
            const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            const today = new Date().getDay(); // Sunday = 0, Monday = 1, etc.
            
            days.forEach((day, index) => {
                const habitDay = document.createElement('div');
                habitDay.className = `habit-day ${habits[index] ? 'active' : ''} ${index > today ? 'inactive' : ''}`;
                habitDay.textContent = day;
                habitDay.dataset.index = index;
                
                if (index <= today) {
                    habitDay.addEventListener('click', () => toggleHabit(index));
                }
                
                habitTracker.appendChild(habitDay);
            });
        }
        
        // Update stats
        function updateStats() {
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.completed).length;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            // Calculate streak (for demo purposes)
            const streak = habits.filter((val, i) => i <= new Date().getDay() && val).length;
            
            totalTasksEl.textContent = totalTasks;
            completedTasksEl.textContent = completedTasks;
            streakDaysEl.textContent = streak;
            completionRateEl.textContent = `${completionRate}%`;
        }
        
        // Add new task
        function addTask(e) {
            e.preventDefault();
            
            const title = taskInput.value.trim();
            if (title === '') return;
            
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            
            const newTask = {
                title,
                completed: false,
                category: randomCategory.color,
                dueDate: new Date(Date.now() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000)
                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            };
            
            tasks.push(newTask);
            saveToLocalStorage();
            renderTasks();
            updateStats();
            
            // Clear input and show animation
            taskInput.value = '';
            taskInput.focus();
            
            // Add visual feedback
            const addBtn = document.querySelector('.add-btn');
            addBtn.classList.add('pulse');
            setTimeout(() => addBtn.classList.remove('pulse'), 500);
        }
        
        // Toggle task completed
        function toggleTaskCompleted(index) {
            tasks[index].completed = !tasks[index].completed;
            saveToLocalStorage();
            renderTasks();
            updateStats();
        }
        
        // Edit task
        function editTask(index) {
            const newTitle = prompt('Edit task:', tasks[index].title);
            if (newTitle !== null && newTitle.trim() !== '') {
                tasks[index].title = newTitle.trim();
                saveToLocalStorage();
                renderTasks();
            }
        }
        
        // Delete task
        function deleteTask(index) {
            if (confirm('Are you sure you want to delete this task?')) {
                tasks.splice(index, 1);
                saveToLocalStorage();
                renderTasks();
                updateStats();
            }
        }
        
        // Toggle habit
        function toggleHabit(index) {
            habits[index] = habits[index] ? 0 : 1;
            saveToLocalStorage();
            renderHabits();
            updateStats();
        }
        
        // Toggle theme
        function toggleTheme() {
            document.body.classList.toggle('dark-mode');
            const icon = themeToggle.querySelector('i');
            if (document.body.classList.contains('dark-mode')) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
        
        // Save to localStorage
        function saveToLocalStorage() {
            localStorage.setItem('tasks', JSON.stringify(tasks));
            localStorage.setItem('habits', JSON.stringify(habits));
        }
        
        // Set up event listeners
        function setupEventListeners() {
            taskForm.addEventListener('submit', addTask);
            themeToggle.addEventListener('click', toggleTheme);
            
            // Add sample tasks on first run
            if (tasks.length === 0) {
                addSampleTasks();
            }
        }
        
        // Add sample tasks for demo
        function addSampleTasks() {
            tasks = [
                {
                    title: 'Complete project proposal',
                    completed: false,
                    category: 'work',
                    dueDate: 'Jun 30'
                },
                {
                    title: 'Morning meditation',
                    completed: true,
                    category: 'health',
                    dueDate: 'Today'
                },
                {
                    title: 'Read 30 pages of book',
                    completed: false,
                    category: 'learning',
                    dueDate: 'Tomorrow'
                },
                {
                    title: 'Buy groceries',
                    completed: false,
                    category: 'personal',
                    dueDate: 'Jul 2'
                },
                {
                    title: 'Call mom for birthday',
                    completed: false,
                    category: 'personal',
                    dueDate: 'Jul 5'
                }
            ];
            saveToLocalStorage();
        }
        
        // Initialize the app when loaded
        window.addEventListener('DOMContentLoaded', initApp);