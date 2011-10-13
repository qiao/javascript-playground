/**
 * @fileoverview Vigenere cipher
 * @requires Caeser
 */

var Vigenere = (function() {

    // standard frequency for each char in English
    standardFrequency = {
        'A': .082, 'B': .015, 'C': .028, 'D': .043,
        'E': .127, 'F': .022, 'G': .020, 'H': .061,
        'I': .070, 'J': .002, 'K': .008, 'L': .040,
        'M': .024, 'N': .067, 'O': .075, 'P': .019,
        'Q': .001, 'R': .060, 'S': .063, 'T': .091,
        'U': .028, 'V': .010, 'W': .023, 'X': .001,
        'Y': .020, 'Z': .001
    };

    // remove all whitespaces in a string
    function strip(str) {
        return str.replace(/\s+/g, '');
    }

    // convert from char to ascii
    function ascii(char) {
        return char.charCodeAt(0);
    }

    // convert from ascii to char
    function chr(ascii) {
        return String.fromCharCode(ascii);
    }

    // shift an array left cicularly
    function circularShiftLeft(array) {
        array.push(array.shift());
    }

    // get the frequency table of each char in a string
    function getFrequencyTable(str) {
        var i, charCount, charFrequency;

        // count occurence of each char in the string
        charCount = {};
        for (i = 0; i < 26; ++i) {
            charCount[chr(i + ascii('A'))] = 0;
        }
        for (i = 0; i < str.length; ++i) {
            ++charCount[str[i]];
        }

        // frequency of each char in the string
        charFrequency = {};
        for (i = 0; i < 26; ++i) {
            charFrequency[chr(i + ascii('A'))] = 
                charCount[chr(i + ascii('A'))] / str.length;
        }

        return charFrequency;
    }

    // calculate the index of coincidence between the 
    // stardard and the given frequency
    function indexOfCoincidence(frequencyTable) {
        var i, c, idx;

        idx = 0;
        for (i = 0; i < 26; ++i) {
            c = chr(i + ascii('A'));
            idx += frequencyTable[c] * standardFrequency[c];
        }

        return idx;
    }

    // divide the string into groups
    function divide(str, numGroups) {
        var i, groups;

        groups = [];
        for (i = 0; i < numGroups; ++i) {
            groups.push([]);
        }
        for (i = 0; i < str.length; ++i) {
            groups[i % numGroups].push(str[i]);
        }
        for (i = 0; i < numGroups; ++i) {
            groups[i] = groups[i].join('');
        }

        return groups;
    }

    // get the most probable Caeser shift amount and the corresponding difference of a ciphertext 
    function bestCaeserShift(ciphertext) {
        var plaintext, shiftAmount, bestShiftAmount, bestOffset, index, 
            difference, bestDifference;

        bestShiftAmount = 0;
        bestDifference = Number.MAX_VALUE;
        for (shiftAmount = 0; shiftAmount < 26; ++shiftAmount) {
            plaintext = Caeser.decrypt(ciphertext, shiftAmount);
            index = indexOfCoincidence(getFrequencyTable(plaintext));
            difference = Math.abs(index - 0.065); // 0.065 is the index for natural English
            if (difference < bestDifference) {
                bestDifference = difference;
                bestShiftAmount = shiftAmount;
            }
        }

        return [bestShiftAmount, bestDifference];
    }

    var Vigenere = {
        encrypt: function(plaintext, key) {
            var i, plainChar, shiftAmount, cipherChars;

            plaintext = strip(plaintext).toUpperCase(); 
            key = key.toUpperCase().split('');

            cipherChars = [];
            for (i = 0; plainChar = plaintext[i]; ++i) {
                shiftAmount = ascii(key[0]) - ascii('A');
                cipherChars.push(Caeser.encrypt(plainChar, shiftAmount));
                circularShiftLeft(key);
            }

            return cipherChars.join('');
        },

        decrypt: function(ciphertext, key) {
            var i, cipherChar, shiftAmount, plainChars;

            ciphertext = strip(ciphertext).toUpperCase();
            key = key.toUpperCase().split('');
            
            plainChars = [];
            for (i = 0; cipherChar = ciphertext[i]; ++i) {
                shiftAmount = ascii(key[0]) - ascii('A');
                plainChars.push(Caeser.decrypt(cipherChar, shiftAmount));
                circularShiftLeft(key);
            }

            return plainChars.join('');
        },

        crack: function(ciphertext, maxKeyLength) {
            var i, keyLen,
                groups, groupIndex, group, 
                info,
                plaintexts,
                shiftAmounts, shiftAmount, difference, totalDifference,

                overall;


            overall = [];

            // enumerate key length
            for (keyLen = 1; keyLen <= maxKeyLength; ++keyLen) {

                // get groups
                groups = divide(ciphertext, keyLen);

                totalDifference = 0;
                plaintexts = [];
                // enumerate shift amount for each group
                for (groupIndex = 0; groupIndex < groups.length; ++groupIndex) {
                    group = groups[groupIndex];

                    info = bestCaeserShift(group);
                    shiftAmount = info[0];
                    difference = info[1];

                    totalDifference += difference;
                    plaintexts.push(Caeser.decrypt(group, shiftAmount));
                }

                // build plaintext 
                plaintext = [];
                for (i = 0; i < ciphertext.length; ++i) {
                    plaintext.push(plaintexts[i % keyLen].charAt(i / keyLen));
                }
                plaintext = plaintext.join('');

                overall.push([totalDifference, plaintext]);
            }

            return overall;
        },
    };


    return Vigenere;

})();
