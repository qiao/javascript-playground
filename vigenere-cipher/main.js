function $(id) {
    return document.getElementById(id);    
}


window.onload = function() {
    var plainTextArea = $('plaintext_area'),
        keyInput = $('key_input'),
        encryptButton = $('encrypt_button'),
        cipherTextArea = $('ciphertext_area');

    encryptButton.onclick = function() {
        console.log(plainTextArea.value);
    };
};
