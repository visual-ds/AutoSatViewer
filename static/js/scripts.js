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