module.exports = {
    not: function(value) {
        return !value;
    },
    or: function(...args) {
       
        args.pop();
        return args.some(val => !!val);
    },
    eq : function(a,b) {
        return a===b;
    },
    gt : function(a,b){
        return a > b;
    },
    formatDate :function(datetime){
         if (!datetime) {
                return ""; 
            }
            const date = new Date(datetime);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
    },
    json : function(context){
        return JSON.stringify(context);
    },
    if_eq :  function(a, b, opts) {
    return a === b ? opts.fn(this) : opts.inverse(this);
     }

    
};
