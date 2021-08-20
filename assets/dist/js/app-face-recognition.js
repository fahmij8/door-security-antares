import { getData, postData } from "./app-antares.js";
import { Toast } from "./app-display.js";
import { updateDevice } from "./app-device.js";
import { routePage } from "./app-route.js";
import { getUserInfo } from "./app-firebaseauth.js";

const setupVideos = async () => {
    $(".stream-content").hide();
    Toast.fire({
        icon: "info",
        title: "Preparing. Don't switch tabs!",
    });

    let lastIP = await getData(2);
    let streamUrl = `http://${lastIP.IP}`;
    const faceImagesPath = "./assets/images/";
    const modelPath = "./assets/models/";
    const faceLabels = ["Fahmi"];
    const distanceLimit = 0.6;
    let faceImagesCount = 2;
    let labeledFaceDescriptors;
    let faceMatcher;
    let ShowImage = document.getElementById("stream");
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext("2d");
    let myTimer;
    let restartCount = 0;

    const checkCamIP = (ip) => {
        fetch(ip + "/status")
            .then((res) => res.text())
            .then((text) => {
                Promise.all([faceapi.nets.faceLandmark68Net.load(modelPath), faceapi.nets.faceRecognitionNet.load(modelPath), faceapi.nets.ssdMobilenetv1.load(modelPath)]).then(() => {
                    prepLabeledImage();
                });
            })
            .catch((error) => {
                Toast.fire({
                    icon: "error",
                    title: "IP Camera error, check your connection",
                });
                setTimeout(() => {
                    window.location.href = "./#dashboard";
                    routePage();
                }, 1000);
            });
    };

    checkCamIP(streamUrl);

    let prepLabeledImage = async () => {
        labeledFaceDescriptors = await loadLabeledImages();
        faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, distanceLimit);
        Toast.fire({
            icon: "info",
            title: "All set!, click turn on stream to start",
        });
        ShowImage.src = "./assets/images/video.png";
        $(".stream-content").show();
        $(".loader-container").hide();
        $(".monitor-begin").click((event) => {
            let state = $(".monitor-begin").data();
            if (state.begin === 0) {
                $(".monitor-begin").data("begin", 1);
                showVideo();
                $(".monitor-begin").removeClass("btn-primary").addClass("btn-danger").html(`<i class="fal fa-cctv fa-fw"></i> Pause streaming`);
            } else {
                clearInterval(myTimer);
                $(".monitor-begin").data("begin", 0);
                $(".monitor-begin").removeClass("btn-danger").addClass("btn-primary").html(`<i class="fal fa-cctv fa-fw"></i> Resume streaming`);
            }
        });
    };

    let showVideo = () => {
        let state = $(".monitor-begin").data();
        clearInterval(myTimer);
        myTimer = setInterval(() => {
            error_handle();
        }, 200);
        ShowImage.src = streamUrl + "/capture?_cb=" + Math.random();
    };

    let error_handle = () => {
        restartCount++;
        clearInterval(myTimer);
        if (restartCount <= 2) {
            myTimer = setInterval(() => {
                showVideo();
            }, 200);
        } else {
            console.error("Showing video error");
        }
    };

    ShowImage.onload = () => {
        let state = $(".monitor-begin").data();
        if (state.begin === 0) {
            clearInterval(myTimer);
        } else if (state.begin === 1) {
            clearInterval(myTimer);
            restartCount = 0;
            canvas.setAttribute("width", ShowImage.width);
            canvas.setAttribute("height", ShowImage.height);
            context.drawImage(ShowImage, 0, 0, ShowImage.width, ShowImage.height);
            canvas.style.width = "100%";
            recognizeImage();
        } else {
            clearInterval(myTimer);
            restartCount = 0;
            canvas.setAttribute("width", ShowImage.width);
            canvas.setAttribute("height", ShowImage.height);
            context.drawImage(ShowImage, 0, 0, ShowImage.width, ShowImage.height);
            canvas.style.width = "100%";
            $(".monitor-begin").data("begin", 0);
        }
    };

    let recognizeImage = async () => {
        let displaySize = { width: canvas.width, height: canvas.height };
        const detections = await faceapi.detectAllFaces(canvas).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const results = resizedDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));
        results.forEach(async (result, i) => {
            let box = resizedDetections[i].detection.box;
            if (result["_label"] === "unknown") {
                let drawBox = new faceapi.draw.DrawBox(box, { label: "Intruder", boxColor: "red" });
                drawBox.draw(canvas);
                let images = canvas.toDataURL("image/png", 0.5);
                await getData(1).then(async (result) => {
                    let state = [1, 1, 1, result.servo];
                    await postData(state, 1);
                    await updateDevice();
                    $(".fill-alerts").prepend(`
                        <a class="dropdown-item d-flex align-items-center nav-alert">
                            <div class="mr-3">
                                <div class="icon-circle bg-danger">
                                    <i class="far fa-exclamation-triangle text-white"></i>
                                </div>
                            </div>
                            <div>
                                <div class="small text-gray-500">${new Date().toLocaleString()}</div>
                                <span class="font-weight-bold">Intruder detected!</span>
                            </div>
                        </a>
                        `);
                    $(".badge-counter").html($(".nav-alert").length);
                    let uid;
                    await getUserInfo().then((data) => {
                        uid = data.uid;
                    });
                    firebase.database().ref(`users/${uid}/record/${new Date().getTime()}`).set({
                        event: "Intruder Alert!",
                        picture: images,
                    });
                });
            } else {
                let drawBox = new faceapi.draw.DrawBox(box, { label: "Fahmi" });
                drawBox.draw(canvas);
                updateDevice();
            }
        });

        try {
            setTimeout(() => {
                showVideo();
            }, 100);
        } catch (e) {
            console.log(e);
            setTimeout(() => {
                showVideo();
            }, 200);
        }
    };

    let loadLabeledImages = () => {
        Toast.fire({
            icon: "info",
            title: "Hang on, almost there!",
        });
        try {
            return Promise.all(
                faceLabels.map(async (label) => {
                    const descriptions = [];
                    for (let i = 1; i <= faceImagesCount; i++) {
                        console.log(`Train images ${i}`);
                        const img = await faceapi.fetchImage(faceImagesPath + label + "/" + i + ".jpg");
                        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                        descriptions.push(detections.descriptor);
                    }
                    return new faceapi.LabeledFaceDescriptors(label, descriptions);
                })
            );
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: "Something happen, please contact administrator",
            });
            console.error(error);
        }
    };
};

export { setupVideos };
