import angular from 'angular';

const serviceWorkerURL = "/assets/build/sw.bundle.js";

export function subscriptionsSupported() {
    return 'serviceWorker' in navigator;
}

export function registerServiceWorker() {
    if(subscriptionsSupported()) {
        navigator.serviceWorker.register(serviceWorkerURL)
            .then(({ pushManager }) => {
                console.log("Registered service worker");
            }).catch(err => {
                console.log(`Unable to register service worker ${err}`);
            });
    }
}

export function registerSubscription(query) {
    // TODO MRB: handle service worker not being registered yet (disable button?)
    return navigator.serviceWorker.getRegistration(serviceWorkerURL).then(({ pushManager }) => {
        return getBrowserSubscription(pushManager).then((sub) => {
            return saveSubscription(sub, query);
        });
    }).catch(err => {
        console.error("Unable to register subscription", err);
    });
}

function getBrowserSubscription(pushManager) {
    return pushManager.getSubscription().then((sub) => {
        if(sub) {
            console.log("Already subscribed");
            return sub;
        } else {
            const applicationServerKey = urlB64ToUint8Array(_wfConfig.webPush.publicKey);

            return pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
                .then((sub) => {
                    console.log("Created subscription");
                    return sub;
                });
        }
    });
}

function saveSubscription(sub, query) {
    return fetch("/api/notifications" + query, {
        method: "POST",
        body: JSON.stringify(sub),
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    }).then(( { status }) => {
        if(status == 200) {
            console.log("Saved notification subscription to server");
            return true;
        } else {
            throw new Error(`Status ${status}`);
        }
    }).catch((err) => {
        console.error("Unable to save notification subscription to server", err);
    });
}

// Stupid pointless juggling of key formats. The web-push CLI outputs in some
// format that we then have to convert into an array. Why the hell can't the
// API just accept the string format?!
//   https://github.com/GoogleChromeLabs/web-push-codelab/blob/master/app/scripts/main.js
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }