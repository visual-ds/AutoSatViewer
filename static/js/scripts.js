function shrinkGeral(container, button) {
    var configContainer = document.querySelector(container);
    var shrinkButton = document.querySelector(button);

    if (configContainer.classList.contains('shrink')) {
        // Expand the div
        configContainer.classList.remove('shrink');
        shrinkButton.textContent = '-';
    } else {
        // Shrink the div
        configContainer.classList.add('shrink');
        shrinkButton.textContent = '+';
    }

}

function shrinkConfig() {
    shrinkGeral('.config-container', '.shrink-button1');

}

function shrinkLeft() {
    shrinkGeral('.left-container', '.shrink-button2');
}

function shrinkBottom() {
    shrinkGeral('.bottom-container', '.shrink-button3');
}


window.onload = function () {
    var signalTypes = ["Accident", "Hazard", "Jam", "Road Closed", "Weather Hazard", "Phone Theft", "Phone Robbery", "Temperature", "Precipitation"];
    var chekedSignalTypes = ["Accident", "Jam", "Road Closed", "Weather Hazard", "Phone Theft", "Phone Robbery"];
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

        var option = document.createElement('option');
        option.value = type;
        option.text = type;
        document.querySelector('#signalMap').appendChild(option);
    }


    $("#mapUpdateFill").on('click', function () {
        updateSpatialFill();
    });

    $("#nFreqs").on('input', function () {
        $("#nFreqsValue").text("Nº freqs.:" + Math.pow(2, $(this).val()));
    });
    $("#threshold").on('input', function () {
        $("#thresholdValue").text("Thresh.:" + $(this).val());
    });
    // call a click on the update button
    document.querySelector('#heatmapUpdate').click();
}