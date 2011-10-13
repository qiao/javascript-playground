function $(id) {
    return document.getElementById(id);    
}

function strip(str) {
    return str.replace(/\s+/g, '');
}

window.onload = function() {
    var plainTextArea = $('plaintext_area'),
        keyInput = $('key_input'),
        encryptButton = $('encrypt_button'),
        cipherTextArea = $('ciphertext_area');

    encryptButton.onclick = function() {
        plainTextArea.value = strip(plainTextArea.value).toUpperCase();
    };
};
