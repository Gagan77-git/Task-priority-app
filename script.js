// ---------------- SUPABASE SETUP ----------------
const supabaseUrl = "https://ldtdlhrkdnnhhpilyejy.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkdGRsaHJrZG5uaGhwaWx5ZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODAxNzEsImV4cCI6MjA5MzA1NjE3MX0.DdRq-spwBRpnpe4z6mNH8ShAHq5zn3rgSSdKUTcr-Y0"; // keep your key

const client = supabase.createClient(supabaseUrl, supabaseKey);

// ---------------- GLOBAL STATE ----------------
let tasks = [];
let editId = null;

// ---------------- AUTH ----------------
async function checkUser() {
  const { data: { user } } = await client.auth.getUser();

  if (user) {
    document.getElementById("app").style.display = "block";
    loadTasks();
  } else {
    document.getElementById("app").style.display = "none";
  }
}

window.signUp = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await client.auth.signUp({ email, password });

  if (error) alert(error.message);
  else alert("Signup successful! Check email.");
};

window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) alert(error.message);
  else {
    alert("Login successful!");
    checkUser();
  }
};

window.logout = async function () {
  await client.auth.signOut();
  document.getElementById("app").style.display = "none";
};

// ---------------- LOAD TASKS ----------------
async function loadTasks() {
  const { data: { user } } = await client.auth.getUser();

  if (!user) return;

  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("id", { ascending: true });

  if (error) {
    console.log("Load error:", error);
    return;
  }

  tasks = data;
  renderTasks();
}

// ---------------- ADD TASK ----------------
window.addTask = async function () {
  const input = document.getElementById("taskInput");
  const priority = document.getElementById("priority").value;

  if (input.value.trim() === "") {
    alert("Task cannot be empty!");
    return;
  }

  const { data: { user } } = await client.auth.getUser();

  if (!user) {
    alert("Please login first");
    return;
  }

  const { error } = await client.from("tasks").insert([
    {
      text: input.value,
      priority: priority,
      done: false,
      user_id: user.id
    }
  ]);

  if (error) {
    console.log("Add error:", error);
    alert(error.message);
    return;
  }

  input.value = "";
  loadTasks();
};

// ---------------- RENDER TASKS ----------------
function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach(task => {
    const li = document.createElement("li");

    li.className = task.priority.toLowerCase();
    if (task.done) li.classList.add("done");

    const text = document.createElement("span");
    text.innerText = `[${task.priority}] ${task.text}`;

    const doneBtn = document.createElement("button");
    doneBtn.innerText = "✔";
    doneBtn.onclick = () => markDone(task.id, task.done);

    const editBtn = document.createElement("button");
    editBtn.innerText = "✏";
    editBtn.onclick = () => editTask(task);

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "🗑";
    deleteBtn.onclick = () => deleteTask(task.id);

    li.appendChild(text);
    li.appendChild(doneBtn);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

// ---------------- DELETE TASK ----------------
async function deleteTask(id) {
  await client.from("tasks").delete().eq("id", id);
  loadTasks();
}

// ---------------- MARK DONE ----------------
async function markDone(id, current) {
  await client
    .from("tasks")
    .update({ done: !current })
    .eq("id", id);

  loadTasks();
}

// ---------------- EDIT TASK ----------------
function editTask(task) {
  document.getElementById("taskInput").value = task.text;
  document.getElementById("priority").value = task.priority;
  editId = task.id;
}

// ---------------- UPDATE TASK ----------------
window.updateTask = async function () {
  const input = document.getElementById("taskInput");
  const priority = document.getElementById("priority").value;

  if (!editId) {
    alert("Click edit first!");
    return;
  }

  if (input.value.trim() === "") {
    alert("Task cannot be empty!");
    return;
  }

  await client
    .from("tasks")
    .update({
      text: input.value,
      priority: priority
    })
    .eq("id", editId);

  editId = null;
  input.value = "";
  loadTasks();
};

// ---------------- CLEAR TASKS ----------------
window.clearTasks = async function () {
  if (confirm("Delete all tasks?")) {
    await client.from("tasks").delete().neq("id", 0);
    loadTasks();
  }
};

// ---------------- SORT TASKS ----------------
window.sortTasks = function () {
  const order = { High: 1, Medium: 2, Low: 3 };
  tasks.sort((a, b) => order[a.priority] - order[b.priority]);
  renderTasks();
};

// ---------------- INIT ----------------
checkUser();