const axios = require("axios");
const RateHistory = require("../models/RateHistory.model");
let lastPrices = {};
const moment = require('moment');

exports.getRates = async (req, res) => {
    const { date } = req.query;
    let rates = [];
    let historicalDates = [];

   
    const aggregationResult = await RateHistory.aggregate([
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } },
        { $sort: { _id: -1 } }
    ]).exec();
    console.log("historicalDate aggregation result ", aggregationResult);
    

    historicalDates = aggregationResult.map(d => d._id);
    console.log("historical dates", historicalDates);
    

    if (date && date !== 'latest') {
        const start = moment(date).startOf('day').toDate();
        const end = moment(date).endOf('day').toDate();
        rates = await RateHistory.find({
            createdAt: { $gte: start, $lte: end }
        }).lean();
    } else {
        rates = await RateHistory.find().sort({ createdAt: -1 }).limit(2).lean(); 
    }

   
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      
        res.json({ rates, historicalDates, noData: rates.length === 0 });
    } else {
      
        res.render('goldPrices', {
            rates,
            historicalDates,
            title: 'Live Precious Metal Rates',
            noData: rates.length === 0
        });
    }
};


exports.historyPage = async (req, res) => {
    try {
        const { date } = req.query;
        let rates = [];

        const aggregationResult = await RateHistory.aggregate([
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } },
            { $sort: { _id: -1 } }
        ]).exec();

        const historicalDates = aggregationResult.map(d => d._id);

        if (date && date !== 'latest') {
            const start = moment(date).startOf('day').toDate();
            const end = moment(date).endOf('day').toDate();
            rates = await RateHistory.find({ createdAt: { $gte: start, $lte: end } }).lean();
        } else {
            rates = await RateHistory.find().sort({ createdAt: -1 }).limit(20).lean();
        }

        return res.render('rates-history', { rates, historicalDates, selectedDate: date || 'latest', layout: 'main' });
    } catch (err) {
        console.error('Error rendering rates history page:', err);
        return res.status(500).render('500', { errorMessage: 'Unable to load rates history' });
    }
};

// Render admin page to update/add rates
exports.updatePage = async (req, res) => {
    try {
        // show last known rates for convenience
        const latest = await RateHistory.find().sort({ createdAt: -1 }).limit(2).lean();
        return res.render('rates-update', { latest, layout: false });
    } catch (err) {
        console.error('Error rendering rates update page:', err);
        return res.status(500).render('500', { errorMessage: 'Unable to load update page' });
    }
};

// Accept admin POST to insert a new rate record
exports.postUpdate = async (req, res) => {
    try {
        const { metal, price, currency } = req.body;
        if (!metal || !price) {
            return res.status(400).json({ success: false, message: 'metal and price are required' });
        }
        const numericPrice = Number(price);
        if (Number.isNaN(numericPrice)) {
            return res.status(400).json({ success: false, message: 'price must be a number' });
        }

        const entry = await RateHistory.create({ metal: metal.toUpperCase(), price: numericPrice, currency: currency || 'INR' });

        // If request came from a form submit, redirect back to the update page
        if (!req.xhr && req.headers.accept.indexOf('json') === -1) {
            return res.redirect('/rates/update');
        }

        return res.json({ success: true, entry });
    } catch (err) {
        console.error('Error creating rate entry:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.fetchAndStoreRates = async () => {
    const metals = ['XAU', 'XAG'];
    const headers = { 'x-access-token': process.env.METAL_API_KEY };

    for (const metal of metals) {
        try {
            const response = await axios.get(`https://www.goldapi.io/api/${metal}/INR`, { headers });
            console.log('API Response:', response.data);
            const data = response.data;
            const prevRate = await RateHistory.findOne({ metal, currency: 'INR' })
                .sort({ createdAt: -1 })
                .limit(1);
        
             let priceTrend = 'same';
            if (prevRate) {
                if (data.price > prevRate.price) priceTrend = 'up';
                else if (data.price < prevRate.price) priceTrend = 'down';
            }

            await RateHistory.create({ ...data, metal, currency: 'INR', ...changes });
        } catch (error) {
            console.error(`Error fetching ${metal} rates:`, error);
        }
    }
};


const cron = require('node-cron');
cron.schedule('0 0 * * *', () => {
  console.log('⏰ Cron running daily ', new Date().toLocaleTimeString());
    exports.fetchAndStoreRates();
}, { timezone: 'Asia/Kolkata' });