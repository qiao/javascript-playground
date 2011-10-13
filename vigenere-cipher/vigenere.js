/**
 * @fileoverview Vigenere cipher
 * @requires Caeser
 */

var Vigenere = (function() {

    function strip(str) {
        return str.replace(/\s+/g, '');
    }

    function ascii(char) {
        return char.charCodeAt(0);
    }

    function circularShiftLeft(array) {
        array.push(array.shift());
    }

    var Vigenere = {
        encrypt: function(plaintext, key) {
            var i, plainChar, startIndex, cipherChars;

            plaintext = strip(plaintext).toUpperCase(); 
            key = key.toUpperCase().split('');

            cipherChars = [];
            for (i = 0; plainChar = plaintext[i]; ++i) {
                startIndex = ascii(key[0]) - ascii('A');
                cipherChars.push(Caeser.encrypt(plainChar, startIndex));
                circularShiftLeft(key);
            }

            return cipherChars.join('');
        },

        decrypt: function(ciphertext, key) {
            var i, cipherChar, startIndex, plainChars;

            ciphertext = strip(ciphertext).toUpperCase();
            key = key.toUpperCase().split('');
            
            plainChars = [];
            for (i = 0; cipherChar = ciphertext[i]; ++i) {
                startIndex = ascii(key[0]) - ascii('A');
                plainChars.push(Caeser.decrypt(cipherChar, startIndex));
                circularShiftLeft(key);
            }

            return plainChars.join('');
        },
    };

    return Vigenere;

})();
