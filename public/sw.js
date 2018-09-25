console.log("I am the Workflow Service Worker");

self.addEventListener("push", (event) => {
    const { title } = event.data.json();
    self.registration.showNotification(title);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    console.log("Notification clicked");
});

self.addEventListener("notificationclose", (event) => {
    console.log("Notification closed");
});