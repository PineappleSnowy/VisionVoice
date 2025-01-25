document.addEventListener('DOMContentLoaded', (event) => {
    const complexity = localStorage.getItem('complexity');
    const speed = localStorage.getItem('speed');
    if (complexity) {
        const selectElement = document.getElementById('complexity');
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].text === complexity) {
                selectElement.selectedIndex = i;
                break;
            }
        }
    }
    const speed_dict = {
        'slow': 1,
        'slower': 4,
        'normal': 8,
        'faster': 12,
        'fast': 15
    }
    if (speed) {
        const selectElement = document.getElementById('speed');
        for (let i = 0; i < selectElement.options.length; i++) {
            if (speed_dict[selectElement.options[i].value] == speed) {
                selectElement.selectedIndex = i;
                break;
            }
        }
    }
});

function updateComplexity(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex].text;
    localStorage.setItem('complexity', selectedOption);
}

function updateSpeed(selectElement) {
    const selectedOption = selectElement.value;
    if (selectedOption === 'fast') {
        localStorage.setItem('speed', 15);
    } else if (selectedOption === 'faster') {
        localStorage.setItem('speed', 12);
    } else if (selectedOption === 'slower') {
        localStorage.setItem('speed', 4);
    } else if (selectedOption === 'slow') {
        localStorage.setItem('speed', 1);
    } else {
        localStorage.setItem('speed', 8);
    }
} 