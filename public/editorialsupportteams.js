import 'whatwg-fetch';

function addNewStaff(team) {
    var name = document.getElementById("name-entry-".concat(team)).value;
    var endpoint = "/api/supportTeams?name=".concat(name).concat("&team=").concat(team);
    fetch(endpoint, {
        method: 'PUT',
        credentials: 'same-origin'
    }).then(reloadOnComplete)
}

function reloadOnComplete(response) {
    if (response.status == 200) {
        location.reload();
    }
}

function toggleStaff(id) {
    var active = document.getElementById("status-".concat(id)).checked;
    var endpoint = "/api/supportTeams/toggle?id=".concat(id).concat("&active=").concat(active);
    fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin'
    }).then(reloadOnComplete)
}

window ? window.addNewStaff = addNewStaff : false
window ? window.toggleStaff = toggleStaff : false