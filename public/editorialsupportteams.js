import 'whatwg-fetch';

function addNewStaff(team) {
    var name = document.getElementById("name-entry-"+team).value.replace(/[^\w\s.,!?/]/gi, '');
    var endpoint = `/api/editorialSupportTeams?name=${name}&team=${team}`;
    fetch(endpoint, {
        method: 'PUT',
        credentials: 'same-origin'
    }).then(function(response) {
        if (response.status === 304) {
            alert('Staff member already exists');
        } else {
            reloadOnComplete(response);
        }
    })
}

function reloadOnComplete(response) {
    if (response.status === 200) {
        location.reload();
    }
}

function toggleStaff(id) {
    var active = document.getElementById("editorialSupportStatus-"+id).checked;
    var endpoint = `/api/editorialSupportTeams/toggle?id=${id}&active=${active}`;
    fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin'
    }).then(reloadOnComplete)
}

function updateStatus(id, startText) {
    var text = document.getElementById("editorialSupportDescription-"+id).value.replace(/[^\w\s.,!?/]/gi, '');
    if (text !== startText) {
        var endpoint = `/api/editorialSupportTeams/update?id=${id}&description=${text}`;
        fetch(endpoint, {
            method: 'POST',
            credentials: 'same-origin'
        }).then(reloadOnComplete)
    }
}

function deleteStaff(team) {
    var text = document.getElementById("delete-name-entry-"+team).value.replace(/[^\w\s.,!?/]/gi, '');
    var endpoint = `/api/editorialSupportTeams?name=${text}&team=${team}`;
    fetch(endpoint, {
        method: 'DELETE',
        credentials: 'same-origin'
    }).then(function(response){
        var status = response.status;
        if (status === 200) {
            alert(`${text} from ${team} successfully deleted`);
            location.reload();
        }
        else if (status === 406) {
            alert(`Cannot delete: ${text} from ${team} is duplicated`);
        }
        else if (status === 404) {
            alert(`Cannot delete: ${text} from ${team} does not exist`);
        }
    })
}

window ? window.addNewStaff = addNewStaff : false
window ? window.toggleStaff = toggleStaff : false
window ? window.updateStatus = updateStatus : false
window ? window.deleteStaff = deleteStaff : false