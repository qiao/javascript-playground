function $(id) {
    return document.getElementById(id);    
}

function strip(str) {
    return str.replace(/\s+/g, '');
}

var sampleText = "Once the length of the key is known the ciphertext can be rewritten into that many columns with each column corresponding to a single letter of the key Each column consists of plaintext that has been encrypted by a single Caesar cipher the Caesar key shift is just the letter of the Vigenere key that was used for that column Using methods similar to those used to break the Caesar cipher the letters in the ciphertext can be discovered";

window.onload = function() {
    var plainTextArea = $('plaintext_area'),
        sampleButton = $('sample_button'),
        keyInput = $('key_input'),
        encryptButton = $('encrypt_button'),
        cipherTextArea = $('ciphertext_area'),
        crackButton = $('crack_button'),
        crackList = $('crack_list'),
        listTitle = $('list_title');

    sampleButton.onclick = function() {
        plainTextArea.value = strip(sampleText).toUpperCase();
    };

    encryptButton.onclick = function() {
        plainTextArea.value = strip(plainTextArea.value).toUpperCase();
        keyInput.value = strip(keyInput.value).toUpperCase();
        cipherTextArea.value = Vigenere.encrypt(plainTextArea.value, keyInput.value);
    };

    crackButton.onclick = function() {
        var i, li, div;

        listTitle.style.display = 'block';

        cipherTextArea.value = strip(cipherTextArea.value).toUpperCase();
        crackInfo = Vigenere.crack(cipherTextArea.value, 10);
        for (i = 0; i < crackInfo.length; ++i) {
            li = document.createElement('li');
            li.innerHTML = crackInfo[i][1];
            crackList.appendChild(li);
        }
    };
};
