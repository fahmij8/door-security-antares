import { getData, postData } from "./app-antares.js";

let updateDevice = async () => {
    await getData(1).then((result) => {
        if (result.lamp === 1 && result.buzzer === 1) {
            onUpdateDevice("alarm", 1);
        } else {
            onUpdateDevice("alarm", 0);
        }
        if (result.lock === 1) {
            onUpdateDevice("lock", 1);
        } else {
            onUpdateDevice("lock", 0);
        }
        if (result.servo === 1) {
            onUpdateDevice("servo", 1);
        } else {
            onUpdateDevice("servo", 0);
        }
    });
    await getData(3).then((result) => {
        if (result.reed === 1) {
            $(".dev-reed-status").html("Door Closed");
            $(".dev-reed-icon").removeClass("text-gray-300").addClass("text-success");
        } else {
            $(".dev-reed-status").html("Door Opened");
            $(".dev-reed-icon").removeClass("text-success").addClass("text-gray-300");
        }
    });
};

let onUpdateDevice = (device, state) => {
    if (state === 1) {
        $(`.dev-${device}-on`).addClass("disabled");
        $(`.dev-${device}-off`).removeClass("disabled");
        $(`.dev-${device}-icon`).removeClass("text-gray-300").addClass("text-success");
        if (device === "lock") {
            $(`.dev-${device}-icon`).removeClass("fa-lock").addClass("fa-unlock");
        }
    } else {
        $(`.dev-${device}-on`).removeClass("disabled");
        $(`.dev-${device}-off`).addClass("disabled");
        $(`.dev-${device}-icon`).removeClass("text-success").addClass("text-gray-300");
        if (device === "lock") {
            $(`.dev-${device}-icon`).removeClass("fa-unlock").addClass("fa-lock");
        }
    }
};

let buttonDeviceHandler = () => {
    $(".dev-alarm-on").click(() => onPostDevice("alarm", 1));
    $(".dev-alarm-off").click(() => onPostDevice("alarm", 0));
    $(".dev-lock-on").click(() => onPostDevice("lock", 1));
    $(".dev-lock-off").click(() => onPostDevice("lock", 0));
    $(".dev-servo-on").click(() => onPostDevice("servo", 1));
    $(".dev-servo-off").click(() => onPostDevice("servo", 0));
};

let onPostDevice = async (device, states) => {
    await getData(1).then(async (result) => {
        let tempState = [result.lamp, result.buzzer, result.lock, result.servo];
        if (device === "alarm") {
            tempState = [states, states, result.lock, result.servo];
        } else if (device === "lock") {
            tempState = [result.lamp, result.buzzer, states, result.servo];
        } else {
            tempState = [result.lamp, result.buzzer, result.lock, states];
        }
        await postData(tempState, 1);
        updateDevice();
    });
};

export { updateDevice, buttonDeviceHandler };
