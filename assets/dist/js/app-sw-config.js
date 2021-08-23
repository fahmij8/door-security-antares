export function showNotif() {
    const title = "Smart door security";
    const options = {
        body: "Intruder alert!, please check your log report",
        icon: "./assets/images/favicon.png",
        badge: "./assets/images/favicon.png",
    };
    if (Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(function (registration) {
            registration.showNotification(title, options);
        });
    } else {
        console.error("Fitur notifikasi tidak diijinkan.");
    }
}

self.addEventListener("notificationclick", function (event) {
    if (!event.action) {
        console.log("Notification Click.");
        event.notification.close();
        return;
    }
});

export let registerSW = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
        await navigator.serviceWorker
            .register("./app-sw.js")
            .then((swReg) => {
                console.log("Service Worker is registered", swReg);
                requestPermision();
            })
            .catch(function (error) {
                console.error("Service Worker Error", error);
            });
        // Request Notifikasi
        function requestPermision() {
            Notification.requestPermission().then(function (result) {
                if (result === "denied") {
                    console.log("Notification : off");
                    return result;
                } else if (result === "default") {
                    console.log("Notification : null");
                    return result;
                } else {
                    console.log("Notification : on");
                }

                navigator.serviceWorker.getRegistration().then(function (registration) {
                    registration.pushManager
                        .subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array("BC99XEM_SyFWhdnGq9n3MoBjcu9EWNf7uhEkecGkWuIbrFWGIAggILDFlwQS6TnAgetPDR7E6d7PgVq7EAHkkTw"),
                        })
                        .then(function () {
                            console.log("Notification setting success");
                        })
                        .catch(function (err) {
                            console.error("Tidak dapat melakukan subscribe ", err.message);
                        });
                });
            });
        }

        function urlBase64ToUint8Array(base64String) {
            const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
            const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; i++) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }
    } else {
        console.warn("Push messaging is not supported");
    }
};
