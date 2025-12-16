module.exports = {
    not: function (value) {
        return !value;
    },
    or: function (...args) {
        args.pop();
        return args.some((val) => !!val);
    },
    eq: function (a, b) {
        return a === b;
    },
    gt: function (a, b) {
        return a > b;
    },
    lt: function (a, b){
        return a < b;
    },
    gte: function (a, b) {
        return a >= b;
    },
    formatDate: function (datetime) {
        if (!datetime) {
            return "";
        }
        const date = new Date(datetime);
        const options = { year: "numeric", month: "long", day: "numeric" };
        return date.toLocaleDateString("en-US", options);
    },
    json: function (context) {
        return JSON.stringify(context);
    },
    if_eq: function (a, b, opts) {
        return a === b ? opts.fn(this) : opts.inverse(this);
    },
    ifEquals: function (a, b, opts) {
        return a == b ? opts.fn(this) : opts.inverse(this);
    },
    getTrendClass: function (trend) {
        if (trend === "up") return "up";
        if (trend === "down") return "down";
        return "same";
    },
    getTrendIcon: function (trend) {
        if (trend === "up") return "arrow-up";
        if (trend === "down") return "arrow-down";
        return "minus";
    },
    formatNumber: function (value, locale, options) {
        return value ? value.toLocaleString(locale, options) : "N/A";
    },
    dateFormat: function (date) {
        return new Date(date).toLocaleString("en-IN");
    },
    truncate: function (str, len) {
        if (str.length && str.length > len) return str.substring(0, len) + "...";
        return str;
    },
    formatNumberIN: function (num) {
        return Math.abs(num).toLocaleString("en-IN");
    },
    formatGold: function (num) {
        const value = (num === undefined || num === null || isNaN(num)) ? 0 : parseFloat(num);
        const formatted = value.toFixed(2);
        return value >= 0 ? `+${formatted}` : formatted;
    },
    initials: function (name) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return '?'; // fallback
        }

        return name
            .trim()
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    },
    formatDateShort: function (date) {
        const d = new Date(date);
        return d.toLocaleDateString("en-IN");
    },
    timeAgo: function (date) {
        const now = new Date();
        const diff = now - new Date(date);
        const days = Math.floor(diff / 86400000);
        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        return `${days} days ago`;
    },
     date: function (year) {
            return new Date().getFullYear();
    }
};
