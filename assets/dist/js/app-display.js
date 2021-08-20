import { getData } from "./app-antares.js";

const sbInit = () => {
    !(function (l) {
        "use strict";
        l("#sidebarToggle, #sidebarToggleTop").on("click", function (e) {
            l("body").toggleClass("sidebar-toggled"), l(".sidebar").toggleClass("toggled"), l(".sidebar").hasClass("toggled") && l(".sidebar .collapse").collapse("hide");
        }),
            l(window).resize(function () {
                l(window).width() < 768 && l(".sidebar .collapse").collapse("hide"), l(window).width() < 480 && !l(".sidebar").hasClass("toggled") && (l("body").addClass("sidebar-toggled"), l(".sidebar").addClass("toggled"), l(".sidebar .collapse").collapse("hide"));
            }),
            l("body.fixed-nav .sidebar").on("mousewheel DOMMouseScroll wheel", function (e) {
                var o;
                768 < l(window).width() && ((o = (o = e.originalEvent).wheelDelta || -o.detail), (this.scrollTop += 30 * (o < 0 ? 1 : -1)), e.preventDefault());
            }),
            l(document).on("scroll", function () {
                100 < l(this).scrollTop() ? l(".scroll-to-top").fadeIn() : l(".scroll-to-top").fadeOut();
            }),
            l(document).on("click", "a.scroll-to-top", function (e) {
                var o = l(this);
                l("html, body")
                    .stop()
                    .animate({ scrollTop: l(o.attr("href")).offset().top }, 1e3, "easeInOutExpo"),
                    e.preventDefault();
            });
    })(jQuery);
};

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
});

const dashboardCheckDeviceStatus = async () => {
    $(".dash-check").addClass("disabled").html("Please wait ...");
    let lastIP = await getData(2);
    let streamUrl = `http://${lastIP.IP}`;
    Promise.all([
        await fetch(streamUrl + "/status")
            .then((res) => res.text())
            .then(() => {
                $(".dash-cam-border").removeClass("border-left-danger").addClass("border-left-success");
                $(".dash-cam-text").removeClass("text-danger").addClass("text-success");
                $(".dash-cam-stat").html("Activated");
            })
            .catch((error) => {
                console.error(error);
                $(".dash-cam-border").removeClass("border-left-success").addClass("border-left-danger");
                $(".dash-cam-text").removeClass("text-success").addClass("text-danger");
                $(".dash-cam-stat").html("Deactivated");
            }),
        await getData(4, "unparsed")
            .then((data) => {
                let microcontrollerStatus = JSON.parse(JSON.parse(data));
                let lastUpTime = microcontrollerStatus["m2m:cin"]["lt"];
                let isUp = false;
                console.log(lastUpTime);
                let padZeroFront = (number) => {
                    if (typeof number === "number") {
                        number = number.toString();
                        if (number.length === 1) {
                            number = "0" + number;
                        }
                    }
                    return number;
                };
                if (new Date().getFullYear() === parseInt(lastUpTime.slice(0, 4))) {
                    if (padZeroFront(new Date().getMonth() + 1) === lastUpTime.slice(4, 6)) {
                        if (padZeroFront(new Date().getDate()) === lastUpTime.slice(6, 8)) {
                            if (padZeroFront(new Date().getHours()) === lastUpTime.slice(9, 11)) {
                                if (new Date().getMinutes() - 20 <= parseInt(lastUpTime.slice(11, 13))) {
                                    isUp = true;
                                }
                            }
                        }
                    }
                }
                if (isUp) {
                    $(".dash-esp-border").removeClass("border-left-danger").addClass("border-left-success");
                    $(".dash-esp-text").removeClass("text-danger").addClass("text-success");
                    $(".dash-esp-stat").html("Activated");
                } else {
                    $(".dash-esp-border").removeClass("border-left-success").addClass("border-left-danger");
                    $(".dash-esp-text").removeClass("text-success").addClass("text-danger");
                    $(".dash-esp-stat").html("Deactivated");
                }
            })
            .catch((error) => {
                console.error(error);
                $(".dash-esp-border").removeClass("border-left-success").addClass("border-left-danger");
                $(".dash-esp-text").removeClass("text-success").addClass("text-danger");
                $(".dash-esp-stat").html("Error!");
            }),
    ]).then(() => {
        $(".dash-lu").html(`Last system up checked : ${new Date().toLocaleString()}`);
        $(".dash-check").removeClass("disabled").html("Check Status");
    });
};

export { sbInit, Toast, dashboardCheckDeviceStatus };
