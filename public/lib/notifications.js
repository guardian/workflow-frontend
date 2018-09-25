export function registerNotifications() {
    navigator.serviceWorker.register("/assets/build/sw.bundle.js")
        .then(({ pushManager }) => {
            console.log("Registered service worker");
            const applicationServerKey = urlB64ToUint8Array(_wfConfig.webPush.publicKey);

            return pushManager.getSubscription().then((sub) => {
                if(sub) {
                    console.log("Already subscribed");
                    console.log(JSON.stringify(sub));
                } else {
                    return pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
                        .then((sub) => {
                            console.log("Created subscription");
                            console.log(JSON.stringify(sub));
                        });
                }
            });
        }).catch(err => {
            console.log(`Unable to register service worker ${err}`);
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