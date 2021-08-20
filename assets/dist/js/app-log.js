import { getUserInfo } from "./app-firebaseauth.js";

let fillLog = async () => {
    let uid;
    await getUserInfo().then((data) => {
        uid = data.uid;
    });
    $(".table-responsive").hide();
    let itemProcessed = 0;
    await firebase
        .database()
        .ref(`users/${uid}/record`)
        .once("value", (snapshot) => {
            let dbJson = snapshot.val();
            if (dbJson === undefined || dbJson === null) {
                $(".card-body").html("Empty screenshoot!");
            } else {
                Object.entries(dbJson).forEach((data) => {
                    $("#fill-Log").append(`
                    <tr>
                        <td>${new Date(parseInt(data[0])).toLocaleString()}</td>
                        <td>${data[1]["event"]}</td>
                        <td><a data-image="${data[1]["picture"]}" target="_blank" class="view-ss">Screenshoot</a></td>
                    </tr>
                    `);
                    itemProcessed += 1;
                    if (itemProcessed === Object.entries(dbJson).length) {
                        $(".view-ss").click((event) => {
                            let image = new Image();
                            image.src = event.target.dataset.image;
                            let w = window.open("");
                            w.document.write(image.outerHTML);
                        });
                        let tables = $("#dataLog").DataTable({
                            retrieve: true,
                            order: [[0, "desc"]],
                            lengthMenu: [
                                [5, 20, 50, -1],
                                [5, 20, 50, "All"],
                            ],
                            buttons: [
                                { extend: "copy", className: "btn btn-primary shadow d-block d-md-inline-block d-lg-inline-block mb-2 mb-md-0 mb-lg-0 mr-0 mr-md-1 mr-lg-1", text: "Copy" },
                                { extend: "pdf", className: "btn btn-primary shadow d-block d-md-inline-block d-lg-inline-block mb-2 mb-md-0 mb-lg-0 mr-0 mr-md-1 mr-lg-1", text: "Export as PDF" },
                                { extend: "excel", className: "btn btn-primary shadow d-block d-md-inline-block d-lg-inline-block mb-2 mb-md-0 mb-lg-0 mr-0 mr-md-1 mr-lg-1", text: "Export as Excel" },
                            ],
                        });
                        tables.buttons(0, null).containers().appendTo("#exportLog");
                        tables.on("page", () => {
                            $(".view-ss").click((event) => {
                                let image = new Image();
                                image.src = event.target.dataset.image;
                                let w = window.open("");
                                w.document.write(image.outerHTML);
                            });
                        });
                        $(".loader-container").hide();
                        $(".table-responsive").show();
                    }
                });
            }
        });
};

export { fillLog };
