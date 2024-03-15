function shrinkGeral(container, button, symbol1='-', symbol2='+') {
    var configContainer = document.querySelector(container);
    var shrinkButton = document.querySelector(button);

    
    if (configContainer.classList.contains('shrink')) {
        // Expand the div
        configContainer.classList.remove('shrink');
        shrinkButton.textContent = symbol1;
    } else {
        // Shrink the div
        configContainer.classList.add('shrink');
        shrinkButton.textContent = symbol2;
    }

}

function shrinkConfig() {
    /*shrinkGeral('.config-container', '.shrink-button1', '-', '⚙');*/
    var configContainer = document.querySelector('.config-container');
    var shrinkButton = document.querySelector('.shrink-button1');
    var configMenu = document.querySelector('#config-menu');
    
    if (configContainer.classList.contains('shrink')) {
        // Expand the div
        configContainer.classList.remove('shrink');
        configMenu.style.display = 'flex';
        shrinkButton.textContent = '-';
    } else {
        // Shrink the div
        configContainer.classList.add('shrink');
        shrinkButton.textContent = '⚙';
        configMenu.style.display = 'none';
    }
}

function shrinkLeft() {
    shrinkGeral('.left-container', '.shrink-button2');
}

function shrinkBottom() {
    shrinkGeral('.bottom-container', '.shrink-button3');
}


window.onload = function () {
    // var signalTypes = ["Accident", "Hazard", "Jam", "Road Closed", "Weather Hazard", "Phone Theft", "Phone Robbery", "Temperature", "Precipitation"];
    // var chekedSignalTypes = ["Accident", "Jam", "Road Closed", "Weather Hazard", "Phone Theft", "Phone Robbery"];
    // for (let i = 0; i < signalTypes.length; i++) {
    //     var type = signalTypes[i];
    //     var checkbox = document.createElement('input');
    //     checkbox.type = "checkbox";
    //     checkbox.id = type;
    //     checkbox.value = type;
    //     if (chekedSignalTypes.includes(type)) {
    //         checkbox.checked = true;
    //     }
    //     var label = document.createElement('label');
    //     label.htmlFor = type;
    //     label.appendChild(document.createTextNode(type));
    //     document.querySelector('#signalTypes').appendChild(checkbox);
    //     document.querySelector('#signalTypes').appendChild(label);
    //     document.querySelector('#signalTypes').appendChild(document.createElement('br'));

    //     var option = document.createElement('option');
    //     option.value = type;
    //     option.text = type;
    //     document.querySelector('#signalMap').appendChild(option);
    // }


    $("#mapUpdateFill").on('click', function () {
        updateSpatialFill();
    });

    $("#nFreqs").on('input', function () {
        $("#nFreqsValue").text("Nº freqs.:" + $(this).val());
    });
    $("#threshold").on('input', function () {
        $("#thresholdValue").text("Thresh.:" + $(this).val());
    });

    $("#bottomPanel").on('change', function () {
        if ($("#bottomPanel").val() == "timeseries") {
            LoadTimeSeries();
        } else if ($("#bottomPanel").val() == "scatter") {
            LoadScatter();
        }
    });
    

    fetch('/get_signal_types')
        .then(response => response.json())
        .then(signalTypes => {
            signalTypes.forEach(d => {
                var option = document.createElement('option');
                option.value = d;
                option.text = d;
                document.querySelector('#signalMap').appendChild(option);
                
            document.querySelector(".shrink-button1").click();
            document.querySelector('#heatmapUpdate').click();
            })
            loadFile();
            LoadTable();
            LoadProj();
        });
}