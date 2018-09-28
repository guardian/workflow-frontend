self.addEventListener("push", (event) => {
    const { title, body, url } = event.data.json();
    self.registration.showNotification(title, {
        body, data: { url }
    });
});

self.addEventListener("notificationclick", (event) => {
    const { url } = event.notification.data;

    event.notification.close();
    clients.openWindow(url);
});