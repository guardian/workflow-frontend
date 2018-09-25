console.log("I am the Workflow Service Worker");

self.addEventListener("push", (event) => {
    console.log("Received push event");
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    console.log("Notification clicked");
});

self.addEventListener("notificationclose", (event) => {
    console.log("Notification closed");
});