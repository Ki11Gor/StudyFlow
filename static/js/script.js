const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const message = document.getElementById("message");
        const button = loginForm.querySelector("button");

        message.textContent = "Виконується вхід...";
        button.disabled = true;

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                message.textContent = "Авторизація успішна";
                window.location.href = "/";
            } else {
                message.textContent = data.error || "Помилка авторизації";
            }
        } catch (error) {
            message.textContent = "Не вдалося з'єднатися із сервером";
        } finally {
            button.disabled = false;
        }
    });
}

const registerForm = document.getElementById("register-form");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const message = document.getElementById("message");
        const button = registerForm.querySelector("button");

        message.textContent = "Створення облікового запису...";
        button.disabled = true;

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                message.textContent = "Реєстрація успішна";

                setTimeout(() => {
                    window.location.href = "/login";
                }, 1000);
            } else {
                message.textContent =
                    data.error || data.message || "Помилка реєстрації";
            }
        } catch (error) {
            message.textContent = "Не вдалося з'єднатися із сервером";
        } finally {
            button.disabled = false;
        }
    });
}
async function loadDashboard() {
    const totalElement = document.getElementById("total-tasks");
    const completedElement = document.getElementById("completed-tasks");
    const progressElement = document.getElementById("progress-tasks");

    if (!totalElement) {
        return;
    }

    const loadingElement = document.getElementById("dashboard-loading");
    const errorElement = document.getElementById("dashboard-error");
    const upcomingContainer = document.getElementById("upcoming-tasks");

    try {
        const statisticsResponse = await fetch("/api/statistics");

        if (statisticsResponse.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (!statisticsResponse.ok) {
            throw new Error("Не вдалося отримати статистику");
        }

        const statistics = await statisticsResponse.json();

        totalElement.textContent = statistics.total;
        completedElement.textContent = statistics.completed;
        progressElement.textContent = statistics.in_progress;

        const upcomingResponse = await fetch("/api/tasks/upcoming");

        if (!upcomingResponse.ok) {
            throw new Error("Не вдалося отримати найближчі завдання");
        }

        const tasks = await upcomingResponse.json();

        loadingElement.style.display = "none";

        if (tasks.length === 0) {
            upcomingContainer.innerHTML =
                "<p>Найближчих завдань немає.</p>";
            return;
        }

        upcomingContainer.innerHTML = "";

        tasks.forEach((task) => {
            const card = document.createElement("div");
            card.className = "task-card";

            const information = document.createElement("div");

            const title = document.createElement("h3");
            title.textContent = task.title;

            const priority = document.createElement("p");
            priority.textContent = "Пріоритет: " + task.priority;

            information.appendChild(title);
            information.appendChild(priority);

            const deadline = document.createElement("div");
            deadline.className = "task-deadline";
            deadline.textContent = task.deadline || "Без дедлайну";

            card.appendChild(information);
            card.appendChild(deadline);

            upcomingContainer.appendChild(card);
        });

    } catch (error) {
        loadingElement.style.display = "none";
        errorElement.textContent = error.message;
    }
}

loadDashboard();
const subjectsList = document.getElementById("subjects-list");

if (subjectsList) {
    const subjectForm = document.getElementById("subject-form");
    const subjectName = document.getElementById("subject-name");
    const showSubjectForm = document.getElementById("show-subject-form");
    const cancelSubject = document.getElementById("cancel-subject");
    const loading = document.getElementById("subjects-loading");
    const message = document.getElementById("subjects-message");

    async function loadSubjects() {
        try {
            const response = await fetch("/api/subjects");

            if (response.status === 401) {
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error("Не вдалося отримати предмети");
            }

            const subjects = await response.json();

            loading.style.display = "none";
            subjectsList.innerHTML = "";

            if (subjects.length === 0) {
                subjectsList.innerHTML = "<p>Предметів поки немає.</p>";
                return;
            }

            subjects.forEach((subject) => {
                const card = document.createElement("div");
                card.className = "subject-card";

                const title = document.createElement("h3");
                title.textContent = subject.name;

                const actions = document.createElement("div");
                actions.className = "subject-actions";

                const editButton = document.createElement("button");
                editButton.className = "edit-button";
                editButton.textContent = "Редагувати";

                editButton.addEventListener("click", async () => {
                    const newName = prompt(
                        "Введіть нову назву предмета:",
                        subject.name
                    );

                    if (!newName || !newName.trim()) {
                        return;
                    }

                    const response = await fetch(`/api/subjects/${subject.id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            name: newName.trim()
                        })
                    });

                    if (response.ok) {
                        loadSubjects();
                    } else {
                        message.textContent = "Не вдалося змінити предмет";
                    }
                });

                const deleteButton = document.createElement("button");
                deleteButton.className = "delete-button";
                deleteButton.textContent = "Видалити";
            
                deleteButton.addEventListener("click", async () => {
                    const confirmed = confirm(
                        `Видалити предмет "${subject.name}"?`
                    );

                    if (!confirmed) {
                        return;
                    }

                    const response = await fetch(`/api/subjects/${subject.id}`, {
                        method: "DELETE"
                    });

                    if (response.ok) {
                        loadSubjects();
                    } else {
                        message.textContent = "Не вдалося видалити предмет";
                    }
                });

                actions.appendChild(editButton);
                actions.appendChild(deleteButton);

                card.appendChild(title);
                card.appendChild(actions);

                subjectsList.appendChild(card);
            });
        } catch (error) {
            loading.style.display = "none";
            message.textContent = error.message;
        }
    }

    showSubjectForm.addEventListener("click", () => {
        subjectForm.classList.remove("hidden");
        subjectName.focus();
    });

    cancelSubject.addEventListener("click", () => {
        subjectForm.classList.add("hidden");
        subjectName.value = "";
    });

    subjectForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = subjectName.value.trim();

        if (!name) {
            return;
        }

        message.textContent = "";

        try {
            const response = await fetch("/api/subjects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name
                })
            });

            const data = await response.json();

            if (response.ok) {
                subjectName.value = "";
                subjectForm.classList.add("hidden");
                loadSubjects();
            } else {
                message.textContent =
                    data.error || "Не вдалося створити предмет";
            }
        } catch (error) {
            message.textContent = "Не вдалося з'єднатися із сервером";
        }
    });

    loadSubjects();
}

const tasksList = document.getElementById("tasks-list");

if (tasksList) {
    const loading = document.getElementById("tasks-loading");
    const message = document.getElementById("tasks-message");
    const filterButtons = document.querySelectorAll(".filter-button");

    let allTasks = [];
    let allSubjects = [];
    let currentFilter = "all";

    function getPriorityText(priority) {
        if (priority === "high") return "Високий";
        if (priority === "medium") return "Середній";
        if (priority === "low") return "Низький";

        return priority;
    }

    function renderTasks() {
        tasksList.innerHTML = "";

        const filteredTasks = currentFilter === "all"
            ? allTasks
            : allTasks.filter(task => task.status === currentFilter);

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = "<p>Завдань поки немає.</p>";
            return;
        }

        filteredTasks.forEach((task) => {
            const card = document.createElement("div");
            card.className = "task-list-card";

            const info = document.createElement("div");
            info.className = "task-info";

            const title = document.createElement("h3");
            title.textContent = task.title;

            const subject = document.createElement("p");

            const taskSubject = allSubjects.find(
            item => item.id === task.subject_id
            );

            subject.textContent = taskSubject
            ? taskSubject.name
            : "Предмет не вказано";

            info.appendChild(title);
            info.appendChild(subject);

            const date = document.createElement("div");
            date.className = "task-date";
            date.textContent = task.deadline || "Без дедлайну";

            const priority = document.createElement("span");
            priority.className =
                `priority-badge priority-${task.priority}`;

            priority.textContent = getPriorityText(task.priority);

            const actions = document.createElement("div");
            actions.className = "task-actions";

            const editButton = document.createElement("button");
            editButton.className = "task-edit";
            editButton.textContent = "Редагувати";

            editButton.addEventListener("click", () => {
            window.location.href = `/tasks/edit/${task.id}`;
            });

            const deleteButton = document.createElement("button");
            deleteButton.className = "task-delete";
            deleteButton.textContent = "Видалити";

            deleteButton.addEventListener("click", async () => {
            const confirmed = confirm(
           `Видалити завдання "${task.title}"?`
             );

             if (!confirmed) {
               return;
             }

            try {
              const response = await fetch(`/api/tasks/${task.id}`, {
             method: "DELETE"
             });

            if (response.status === 401) {
                window.location.href = "/login";
            return;
             }

             const data = await response.json();

             if (!response.ok) {
                throw new Error(
                data.error || "Не вдалося видалити завдання"
            );
             }

             allTasks = allTasks.filter(
              item => item.id !== task.id
             );

             renderTasks();

             } catch (error) {
            message.textContent = error.message;
          }
        });

            actions.appendChild(editButton);
            actions.appendChild(deleteButton);

            card.appendChild(info);
            card.appendChild(date);
            card.appendChild(priority);
            card.appendChild(actions);

            tasksList.appendChild(card);
        });
    }

        async function loadTasks() {
        try {
        const [tasksResponse, subjectsResponse] = await Promise.all([
            fetch("/api/tasks"),
            fetch("/api/subjects")
        ]);

        if (
            tasksResponse.status === 401 ||
            subjectsResponse.status === 401
        ) {
            window.location.href = "/login";
            return;
        }

        if (!tasksResponse.ok || !subjectsResponse.ok) {
            throw new Error("Не вдалося отримати дані");
        }

        allTasks = await tasksResponse.json();
        allSubjects = await subjectsResponse.json();

        loading.style.display = "none";

        renderTasks();

    } catch (error) {
        loading.style.display = "none";
        message.textContent = error.message;
    }
}

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            filterButtons.forEach(btn =>
                btn.classList.remove("active")
            );

            button.classList.add("active");

            currentFilter = button.dataset.status;

            renderTasks();
        });
    });

    loadTasks();
}
const addTaskForm = document.getElementById("add-task-form");

if (addTaskForm) {
    const subjectSelect = document.getElementById("task-subject");
    const message = document.getElementById("task-form-message");

    async function loadTaskSubjects() {
        try {
            const response = await fetch("/api/subjects");

            if (response.status === 401) {
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error("Не вдалося завантажити предмети");
            }

            const subjects = await response.json();

            subjectSelect.innerHTML =
                '<option value="">Оберіть предмет</option>';

            subjects.forEach((subject) => {
                const option = document.createElement("option");

                option.value = subject.id;
                option.textContent = subject.name;

                subjectSelect.appendChild(option);
            });

        } catch (error) {
            message.textContent = error.message;
        }
    }

    addTaskForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const title = document.getElementById("task-title").value.trim();
        const subjectId = document.getElementById("task-subject").value;
        const description =
            document.getElementById("task-description").value.trim();
        const deadline = document.getElementById("task-deadline").value;
        const priority = document.getElementById("task-priority").value;
        const status = document.getElementById("task-status").value;

        message.textContent = "Створення завдання...";

        try {
            const response = await fetch("/api/tasks", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: title,
                    subject_id: Number(subjectId),
                    description: description,
                    deadline: deadline || null,
                    priority: priority,
                    status: status
                })
            });

            const data = await response.json();

            if (response.ok) {
                message.textContent = "Завдання успішно створено";

                setTimeout(() => {
                    window.location.href = "/tasks";
                }, 700);

            } else {
                message.textContent =
                    data.error || "Не вдалося створити завдання";
            }

        } catch (error) {
            message.textContent =
                "Не вдалося з'єднатися із сервером";
        }
    });

    loadTaskSubjects();
}
const editTaskForm = document.getElementById("edit-task-form");

if (editTaskForm) {
    const taskId = editTaskForm.dataset.taskId;

    const titleInput = document.getElementById("task-title");
    const subjectSelect = document.getElementById("task-subject");
    const descriptionInput = document.getElementById("task-description");
    const deadlineInput = document.getElementById("task-deadline");
    const prioritySelect = document.getElementById("task-priority");
    const statusSelect = document.getElementById("task-status");
    const message = document.getElementById("task-form-message");

    async function loadEditTask() {
        try {
            const subjectsResponse = await fetch("/api/subjects");

            if (subjectsResponse.status === 401) {
                window.location.href = "/login";
                return;
            }

            if (!subjectsResponse.ok) {
                throw new Error("Не вдалося завантажити предмети");
            }

            const subjects = await subjectsResponse.json();

            subjectSelect.innerHTML = "";

            subjects.forEach((subject) => {
                const option = document.createElement("option");
                option.value = subject.id;
                option.textContent = subject.name;
                subjectSelect.appendChild(option);
            });

            const taskResponse = await fetch(`/api/tasks/${taskId}`);

            if (taskResponse.status === 401) {
                window.location.href = "/login";
                return;
            }

            if (!taskResponse.ok) {
                throw new Error("Не вдалося завантажити завдання");
            }

            const task = await taskResponse.json();

            titleInput.value = task.title;
            subjectSelect.value = task.subject_id;
            descriptionInput.value = task.description || "";
            deadlineInput.value = task.deadline || "";
            prioritySelect.value = task.priority;
            statusSelect.value = task.status;

        } catch (error) {
            if (message) {
                message.textContent = error.message;
            }
        }
    }

    loadEditTask();
    editTaskForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const taskData = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        subject_id: Number(subjectSelect.value),
        deadline: deadlineInput.value,
        priority: prioritySelect.value,
        status: statusSelect.value
    };

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(taskData)
        });

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Не вдалося зберегти зміни");
        }

        window.location.href = "/tasks";

    } catch (error) {
        if (message) {
            message.textContent = error.message;
        }
    }
    });
}

const statisticsContent = document.getElementById("statistics-content");

if (statisticsContent) {
    const loading = document.getElementById("statistics-loading");
    const message = document.getElementById("statistics-message");

    async function loadStatistics() {
        try {
            const response = await fetch("/api/statistics");

            if (response.status === 401) {
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error("Не вдалося завантажити статистику");
            }

            const statistics = await response.json();

            document.getElementById("statistics-total").textContent =
                statistics.total;

            document.getElementById("statistics-planned").textContent =
                statistics.planned;

            document.getElementById("statistics-progress").textContent =
                statistics.in_progress;

            document.getElementById("statistics-completed").textContent =
                statistics.completed;

            document.getElementById("statistics-percent").textContent =
                `${statistics.completion_percent}%`;

            document.getElementById("statistics-progress-bar").style.width =
                `${statistics.completion_percent}%`;

            loading.style.display = "none";
            statisticsContent.style.display = "block";

        } catch (error) {
            loading.style.display = "none";
            message.textContent = error.message;
        }
    }

    loadStatistics();
}
