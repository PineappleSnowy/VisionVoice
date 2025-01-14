document.addEventListener('DOMContentLoaded', (event) => {
    const complexity = localStorage.getItem('complexity');
    if (complexity) {
        const selectElement = document.getElementById('complexity');
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].text === complexity) {
                selectElement.selectedIndex = i;
                break;
            }
        }
    }
});

function updateAriaLabel(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex].text;
    localStorage.setItem('complexity', selectedOption);
}