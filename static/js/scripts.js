function shrinkDiv() {
    var topContainer = document.querySelector('.top-container');
    var shrinkButton = document.querySelector('.shrink-button');

    if (topContainer.classList.contains('shrink')) {
        // Expand the div
        topContainer.classList.remove('shrink');
        shrinkButton.textContent = '-';
    } else {
        // Shrink the div
        topContainer.classList.add('shrink');
        shrinkButton.textContent = '+';
    }
}

function shrinkDiv2() {
    var midContainer = document.querySelector('.middle-container');
    var shrinkButton = document.querySelector('.shrink-button2');

    if (midContainer.classList.contains('shrink')) {
        // Expand the div
        midContainer.classList.remove('shrink');
        shrinkButton.textContent = '-';
    } else {
        // Shrink the div
        midContainer.classList.add('shrink');
        shrinkButton.textContent = '+';
    }
}

function shrinkDiv3() {
    var botContainer = document.querySelector('.bottom-container');
    var shrinkButton = document.querySelector('.shrink-button3');

    if (botContainer.classList.contains('shrink')) {
        // Expand the div
        botContainer.classList.remove('shrink');
        shrinkButton.textContent = '-';
    } else {
        // Shrink the div
        botContainer.classList.add('shrink');
        shrinkButton.textContent = '+';
    }
}

window.onload = function () {
    var signalTypes = ["WazeACCIDENT", "WazeHAZARD", "WazeJAM", "WazeROAD_CLOSED", "WazeWEATHERHAZARD", "FurtoCelular", "RouboCelular", "temperature", "precipitation"];
    var chekedSignalTypes = ["WazeACCIDENT", "WazeHAZARD", "WazeJAM"];
    for (let i = 0; i < signalTypes.length; i++) {
        var type = signalTypes[i];
        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.id = type;
        checkbox.value = type;
        if (chekedSignalTypes.includes(type)) {
            checkbox.checked = true;
        }
        var label = document.createElement('label');
        label.htmlFor = type;
        label.appendChild(document.createTextNode(type));
        document.querySelector('#signalTypes').appendChild(checkbox);
        document.querySelector('#signalTypes').appendChild(label);
        document.querySelector('#signalTypes').appendChild(document.createElement('br'));
    }

    $("#nFreqs").on('input', function () {
        $("#nFreqsValue").text("Nº freqs.:" + Math.pow(2, $(this).val()));
    });
    $("#threshold").on('input', function () {
        $("#thresholdValue").text("Thresh.:" + $(this).val());
    });
    // call a click on the update button
    document.querySelector('#heatmapUpdate').click();
}