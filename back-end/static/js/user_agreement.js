document.addEventListener("DOMContentLoaded", function() {
    fetch('/get_user_agreement_text')
        .then(response => response.text())
        .then(data => {
            document.getElementById('agreement-content').innerHTML = data;
        })
        .catch(error => console.error('Error fetching agreement text:', error));
});