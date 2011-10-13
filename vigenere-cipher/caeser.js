var Caeser = (function() {

    function ascii(char) {
        return char.charCodeAt(0);
    }

    function substitute(text, sequence) {
        var chars = [];

        text = strip(text).toUpperCase();
        for (i = 0; i < text.length; ++i) {
            chars.push(sequence[text.charCodeAt(i) - ascii('A')]);
        }

        return chars.join('');
    }

    function strip(str) {
        return str.replace(/\s+/g, '');
    }

    var Caeser = {
        encrypt: function(plaintext, shiftAmount) {
            var sequence = [];
            for (i = 0; i < 26; ++i) {
                sequence.push(String.fromCharCode(ascii('A') + (shiftAmount + i) % 26));
            }

            return substitute(plaintext, sequence);
        },

        decrypt: function(ciphertext, shiftAmount) {
            var sequence = new Array(26);
            for (i = 0; i < 26; ++i) {
                sequence[(shiftAmount + i) % 26] = String.fromCharCode(ascii('A') + i);
            }

            return substitute(ciphertext, sequence);
        },
    };

    return Caeser;

})();
