class Response {
    /**
     * creates object for success response
     * @param {Number} statuscode 
     * @param {String} message 
     * @param {Object} other 
     * @returns Object 
     */
    static success(statuscode,message,other){
        return {
            result :{
                code : statuscode,
                message : message,
                ...other,
            }
        }
    }
}


module.exports = Response