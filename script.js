document.addEventListener('DOMContentLoaded', function() {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    // Charger les tâches depuis le localStorage
    loadTasks();

    // Ajouter une tâche
    function addTask(taskText) {
        if (taskText.trim() === '') return;

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false
        };

        saveTask(task);
        renderTask(task);
        taskInput.value = '';
        taskInput.focus();
    }

    // Sauvegarder une tâche dans le localStorage
    function saveTask(task) {
        let tasks = getTasks();
        tasks.push(task);
        localStorage.setItem('lify_tasks', JSON.stringify(tasks));
    }

    // Récupérer toutes les tâches du localStorage
    function getTasks() {
        return JSON.parse(localStorage.getItem('lify_tasks')) || [];
    }

    // Charger et afficher toutes les tâches
    function loadTasks() {
        const tasks = getTasks();
        taskList.innerHTML = '';
        tasks.forEach(task => renderTask(task));
    }

    // Afficher une tâche dans la liste
    function renderTask(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
            <span class="task-text">${task.text}</span>
            <button class="delete-btn" data-id="${task.id}">&times;</button>
        `;

        taskList.appendChild(li);

        // Ajouter les écouteurs d'événements
        li.querySelector('.task-text').addEventListener('click', () => toggleTaskComplete(task.id));
        li.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });
    }

    // Basculer l'état de complétion d'une tâche
    function toggleTaskComplete(taskId) {
        let tasks = getTasks();
        const taskIndex = tasks.findIndex(task => task.id == taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            localStorage.setItem('lify_tasks', JSON.stringify(tasks));
            loadTasks();
        }
    }

    // Supprimer une tâche
    function deleteTask(taskId) {
        let tasks = getTasks();
        tasks = tasks.filter(task => task.id != taskId);
        localStorage.setItem('lify_tasks', JSON.stringify(tasks));
        loadTasks();
    }

    // Écouteurs d'événements
    addTaskBtn.addEventListener('click', () => addTask(taskInput.value));
    
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(taskInput.value);
        }
    });
});
