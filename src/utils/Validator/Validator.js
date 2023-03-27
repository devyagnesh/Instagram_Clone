class Validator {
    /**
     * Tests whether the given string is a valid phone number or email address.
     *
     * @param {string} str - The string to be tested.
     * @returns {boolean} - True if the string matches the pattern for a valid phone number or email address, false otherwise.
     */
    static isEmailOrPhone(str) {
      return this.isEmail(str) || this.isMobileNumber(str);
    }
  
    /**
     * 
     * @param {String} str - the string to be tested 
     * @returns  {boolean} - True if the given string is one of the email or phone or username otherwise false
     */
    static isValidEmailOrPhoneOrUsername(str){
      return this.isEmail(str) || this.isMobileNumber(str) || this.isValidUsername(str);
    }
  
  
    /**
     * checks wether given string is valid phone number or not
     * @param {String} str
     * @returns Boolean
     */
    static isMobileNumber(str) {
      const pattern = /^\d{10}$/;
      return pattern.test(str);
    }
  
    /**
     * checks wethere username is valid or not
     * @param {String} str
     * @returns Boolean
     */
    static isValidUsername(str) {
      const pattern = /^[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/;
      return pattern.test(str);
    }
  
    /**
     * this function checks wether entered password has 2 Uppercase letters , 1 special character, 2 digits, 3 lowercase character, and string length is 8 characters long
     * @param {String} str
     * @returns Boolean
     */
    static isStrongPassword(str) {
      const pattern = /^([a-zA-Z0-9!@#$&*]).{8}$/;
      return pattern.test(str);
    }
  
    /**
     * isEmail function checks wether given string is email or not
     * @param {String} str
     * @returns Boolean
     */
    static isEmail(str) {
      const pattern =
        /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
      return pattern.test(str);
    }
  
    /**
     * function checkes wether given two value matches or not
     * @param {*} str1
     * @param {*} str2
     * @returns Boolean
     */
    static isCompareTo(str1, str2) {
      return str1 === str2;
    }
  }
  
  module.exports = Validator;
  