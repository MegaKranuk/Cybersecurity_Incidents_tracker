let incidents = [];
let editId = null;

let currentSortField = null;
let currentSortAsc = true;

const form = document.getElementById("createForm");
const tableBody = document.getElementById ('itemsTableBody');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const tagError = document.getElementById('tagError');
const criticalityError = document.getElementById('criticalityError');
const commentError = document.getElementById('commentError');


const criticalityOrder = {
    "Низька критичність": 1,
    "Трохи критично": 2,
    "Середня критичність": 3,
    "Відчутна критичність": 4,
    "Дуже критично": 5
};

const dateField = document.getElementById('dateInput');

const today = new Date().toISOString().split("T")[0];
dateField.max = today;

const tagField = document.getElementById('tagSelect');
const criticalityField = document.getElementById ('criticalitySelect');
const reporterField = document.getElementById('reporterInput');
const commentField = document.getElementById('commentInput');

const dateError = document.getElementById ('dateError');
const reporterError = document.getElementById ('reporterError');

async function loadIncidents() {
  const res = await fetch("http://localhost:3000/api/incidents", {
      cache: "no-store" 
  });
  const data = await res.json();
  incidents = data.items;
  render();
}

async function createIncident(incident) {
  const res = await fetch("http://localhost:3000/api/incidents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(incident)
  });

  if (!res.ok) {
      const errorData = await res.json();
      console.error("Деталі помилки від сервера:", errorData);
      throw new Error(`Помилка ${res.status}: Некоректні дані`);
  }

  await loadIncidents();
}

async function updateIncident(id, incident) {
  const res = await fetch(`http://localhost:3000/api/incidents/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(incident)
  });

  if (!res.ok) {
      throw new Error(`Помилка ${res.status} при оновленні`);
  }

  await loadIncidents();
}

async function deleteIncident(id) {
  await fetch(`http://localhost:3000/api/incidents/${id}`, {
    method: "DELETE"
  });

  await loadIncidents();
}

function sanitize(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}

function render(list = incidents){
    tableBody.innerHTML = "";

    if (list.length === 0) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="7">Немає записів</td>
        </tr>
    `;
    return;
    }

    list.forEach((incident, index) => {
        const row =   `
        <tr>
            <td>${index + 1}</td>
            <td>${incident.date}</td>
            <td>${incident.tag}</td>
            <td>${incident.criticality}</td>
            <td>${sanitize (incident.reporter)}</td>
            <td>${sanitize (incident.comment)}</td>
            <td>
                <button data-id = "${incident.id}" class = "editBtn">Редагувати</button>
                <button data-id = "${incident.id}" class = "deleteBtn">Видалити</button>
            </td>
        </tr>
        `; 
        tableBody.innerHTML += row;
    });

}

function validate(){
    let isValid = true;

    if(dateField.value === ""){
        dateError.innerText = "Виберіть дату!";
        isValid = false;
    } else {
        dateError.innerText = "";
    }

    if(tagField.value === ""){
        tagError.innerText = "Виберіть тип!";
        isValid = false;
    } else {
        tagError.innerText = "";
    }

    if(criticalityField.value === ""){
        criticalityError.innerText = "Виберіть критичність!";
        isValid = false;
    } else {
        criticalityError.innerText = "";
    }

    if(reporterField.value.length < 5){
        reporterError.innerText = "Ім'я мінімум 5 символів!";
        isValid = false;
    } else {
        reporterError.innerText = "";
    }

    if(commentField.value.length < 15){
        commentError.innerText = "Опис мінімум 15 символів!";
        isValid = false;
    } else {
        commentError.innerText = "";
    }

    return isValid;
}

form.addEventListener("submit", async function(e){
    e.preventDefault();

    if (!validate()) {
        console.log("Валідація не пройдена.");
        return;
    }

    const data = {
        date: dateField.value,
        tag: tagField.value,
        criticality: criticalityField.value,
        reporter: reporterField.value,
        comment: commentField.value
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText; 
    
    submitBtn.disabled = true;
    submitBtn.innerText = "Відправка ...";

    try {
        console.log("Чекаємо 2 секунди перед відправкою...");
        
        await sleep(2000); 

        if (editId) {
            await updateIncident(editId, data);
            editId = null;
        } else {
            await createIncident(data);
        }

        form.reset();
        reporterField.focus(); 
        console.log("Успішно збережено!");

    } catch (error) {
        console.error("Помилка при роботі з сервером:", error);
        alert("Помилка з'єднання з сервером.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
});

tableBody.addEventListener("click", async function(e){
    const id = e.target.dataset.id; 
    if (!id) return;

    if (e.target.classList.contains("deleteBtn")){
        await deleteIncident(id); 
    }

    if (e.target.classList.contains("editBtn")){
        const item = incidents.find(i => i.id == id); 

        dateField.value = item.date;
        tagField.value = item.tag;
        criticalityField.value = item.criticality;
        reporterField.value = item.reporter;
        commentField.value = item.comment;

        editId = item.id;
        reporterField.focus();
    }
});

function sortByDate() {
    incidents.sort((a, b) => new Date (a.date) - new Date (b.date));
    render();
}

function filterByTag(tag){
    if (!tag){
        render();
        return;
    }

    const filtered = incidents.filter (i => i.tag === tag);
    render(filtered);
}

document.querySelectorAll("th[data-field]").forEach(header => {
    header.style.cursor = "pointer";

    header.addEventListener("click", function () {
        const field = this.dataset.field;

        if (currentSortField === field) {
            currentSortAsc = !currentSortAsc;
        } else {
            currentSortField = field;
            currentSortAsc = true;
        }

        incidents.sort((a, b) => {

            if (field === "date") {
                return currentSortAsc
                    ? new Date(a.date) - new Date(b.date)
                    : new Date(b.date) - new Date(a.date);
            }

            if (field === "criticality") {
                const aValue = criticalityOrder[a.criticality] || 0;
                const bValue = criticalityOrder[b.criticality] || 0;

                return currentSortAsc
                    ? aValue - bValue
                    : bValue - aValue;
            }

            if (field === "tag") {
                return currentSortAsc
                    ? a.tag.localeCompare(b.tag)
                    : b.tag.localeCompare(a.tag);
            }

            return 0;
        });

        document.querySelectorAll("th[data-field] span")
            .forEach(span => span.textContent = "⬍");

        this.querySelector("span").textContent =
            currentSortAsc ? "↑" : "↓";

        render();
    });
});
loadIncidents();