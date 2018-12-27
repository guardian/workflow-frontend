import { registerServiceWorker, registerSubscription } from './lib/notifications';

console.log("Welcome to the subscriptions admin page");
registerServiceWorker();

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("add-word-form").onsubmit = (e) => {
        e.preventDefault();
        registerSubscription(`?phrase=${e.target[0].value}`).then(() => {
            window.location.reload();
        }).catch(err => {
            window.alert("Error adding phrase subscription");
            console.error(err);
        });
    }
});