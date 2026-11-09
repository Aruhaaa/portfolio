// Asks "are you sure?" before a form that has a data-confirm message is sent (delete buttons)
document.addEventListener('submit', function (e) {
    var form = e.target;
    var message = form && form.getAttribute && form.getAttribute('data-confirm');
    if (message && !window.confirm(message)) e.preventDefault();
});
