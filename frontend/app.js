let incidents = JSON.parse(localStorage.getItem("incidents"))|| [];
let editId = null;

const form = document.getElementById("createForm");
const tableBody = document.getElementById ('itemsTableBody');

const dateField = document.getElementById('dateInput');

const today = new Date().toISOString().split("T")[0];
dateField.max = today;

const tagField = document.getElementById('tagSelect');
const criticalityField = document.getElementById ('criticalitySelect');
const reporterField = document.getElementById('reporterInput');
const commentField = document.getElementById('commentInput');

const dateError = document.getElementById ('dateError');
const reporterError = document.getElementById ('reporterError');

function sanitize(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}



function render(list = incidents){
    tableBody.innerHTML = "";

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

    localStorage.setItem("incidents", JSON.stringify(incidents));
}

function validate(){
    let isValid = true;

    if(dateField.value === ""){
        dateError.innerText = "Виберіть дату!";
        isValid = false;
    } else {
        dateError.innerText = "";
    }

    if(reporterField.value.length < 5){
        reporterError.innerText = "Ім'я мінімум 5 символів!";
        isValid = false;
    } else {
        reporterError.innerText = "";
    }

    return isValid;
}

form.addEventListener("submit", function(e){
    e.preventDefault();

    if (!validate()) return;

    const data = {
        id: editId || Date.now(),
        date: dateField.value,
        tag: tagField.value,
        criticality: criticalityField.value,
        reporter: reporterField.value,
        comment: commentField.value
    };

    if (editId){
        incidents = incidents.map(item =>
            item.id === editId ? data: item
        );
        editId = null;
    } else {
        incidents.push(data);
    }

    render();
    form.reset();
    reporterField.focus(); 
});

tableBody.addEventListener ("click", function(e){
    const id = Number(e.target.dataset.id);
    if (!id) return;

    if (e.target.classList.contains("deleteBtn")){
        incidents = incidents.filter(item => item.id !== id);
        render()
    }

    if (e.target.classList.contains("editBtn")){
        const item = incidents.find(i => i.id === id);

        dateField.value = item.date;
        tagField.value = item.tag;
        criticalityField.value = item.criticality;
        reporterField.value = item.reporter;
        commentField.value = item.comment;

        editId = id;
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

function filterByCriticality(criticality){
    if (!criticality){
        render();
        return;
    }

    const filtered = incidents.filter (i => i.criticality === criticality);
    render(filtered);
}

render();