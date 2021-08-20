import { getUserInfo, logOut } from "./app-firebaseauth.js";
import { sbInit, dashboardCheckDeviceStatus } from "./app-display.js";
import { setupVideos } from "./app-face-recognition.js";
import { buttonDeviceHandler } from "./app-device.js";
import { fillLog } from "./app-log.js";

const loadPage = (page) => {
    fetch(`./assets/pages/${page}.html`)
        .then((response) => {
            return response.text();
        })
        .then((html) => {
            let content = document.querySelector("#starter-content");
            firebase.auth().onAuthStateChanged(async (user) => {
                if (!user && page !== "login") {
                    // Tell user to login
                    content.innerHTML = "Redirecting ...";
                    window.location.href = "./#login";
                    routePage();
                } else if (!user && page === "login") {
                    // Display Login page
                    content.innerHTML = html;
                    $("#login").click(() => {
                        let provider = new firebase.auth.GoogleAuthProvider();
                        firebase.auth().signInWithRedirect(provider);
                    });
                    $("body").attr("class", "bg-gradient-light");
                } else if (user && page === "login") {
                    // Redirect to dashboard
                    content.innerHTML = "Redirecting ...";
                    window.location.href = "./#dashboard";
                    routePage();
                } else {
                    let uid;
                    await getUserInfo().then((data) => {
                        uid = data.uid;
                    });
                    const dbRef = firebase.database().ref(`users/${uid}`);
                    await dbRef
                        .get()
                        .then(async (snapshot) => {
                            if (!snapshot.exists()) {
                                await dbRef.set({ registered: "true" });
                            }
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                    // Display corresponding page
                    await loadShell(html, "#fillContent");
                }
            });
        })
        .catch((error) => {
            console.log(error);
            routeNotFound();
        });
};

const loadShell = async (contentToAppend, elements) => {
    let page = window.location.hash.substr(1);
    let content = document.querySelector("#starter-content");
    fetch(`./assets/pages/navshell.html`)
        .then((response) => {
            return response.text();
        })
        .then((html) => {
            if ($("#accordionSidebar").length === 0) {
                // If shell is not loaded yet
                content.innerHTML = html;
                $("body").removeAttr("class");
                $("body").attr("id", "page-top");
                // Reinitialize Handler
                sbInit();
                $(".handle-all-alerts").click(() => {
                    window.location.href = "#log";
                    setTimeout(() => routePage(), 10);
                });
                // Profile Navbar
                getUserInfo().then((data) => {
                    $("#dashboard-name").html(data.displayName);
                    $("#dashboard-pic").attr("src", data.photoURL);
                    $("#dashboard-logout").click(() => {
                        logOut();
                    });
                });
                // Click Navigation Link Handler
                $(".nav-handler").click(() => {
                    window.location.href = `#${page}`;
                    setTimeout(() => routePage(), 10);
                });
            }

            // Clear navigation active state
            $("#nav-dash").removeClass("active");
            $("#nav-monitor").removeClass("active");
            $("#nav-log").removeClass("active");

            // Append html
            document.querySelector(elements).innerHTML = contentToAppend;

            if (page === "dashboard") {
                console.log("Page Dashboard");
                $("#nav-dash").addClass("active");
                $(".dash-check").click(() => {
                    dashboardCheckDeviceStatus();
                });
                $(".dash-monitoring").click(() => {
                    window.location.href = "#monitor";
                    setTimeout(() => routePage(), 10);
                });
                $(".dash-log").click(() => {
                    window.location.href = "#log";
                    setTimeout(() => routePage(), 10);
                });
            } else if (page === "monitor") {
                console.log("Page Monitor");
                $("#nav-monitor").addClass("active");
                setupVideos();
                buttonDeviceHandler();
            } else if (page === "log") {
                console.log("Page Logging");
                $("#nav-log").addClass("active");
                fillLog();
            }
        })
        .catch((error) => {
            console.log(error);
            console.log("Page not found!");
            fetch(`./assets/pages/404.html`)
                .then((response) => {
                    return response.text();
                })
                .then(async (html) => {
                    content.innerHTML = html;
                });
        });
};

const routePage = () => {
    let page = window.location.hash.substr(1);
    if (page == "") page = "login";
    loadPage(page);
};

const routeNotFound = () => {
    let content = document.querySelector("#fillContent");
    console.log("Page not found!");
    fetch(`./assets/pages/404.html`)
        .then((response) => {
            return response.text();
        })
        .then((html) => {
            content.innerHTML = html;
        });
};

export { routePage };
