const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const { authMiddleware } = require('../middleware/auth');
const {upload} = require('../middleware/upload');
const profileImageMiddleware = require('../middleware/profileImageMiddleware');

const LedgerCustomer = require('../models/ledger.model');
const LedgerTx = require('../models/ledgerTx.model');

router.post('/bulk-upload', authMiddleware,upload, ledgerController.bulkupload);

router.post('/customer/new', authMiddleware, ledgerController.createCustomer);

router.get('/customer/list', authMiddleware, ledgerController.listCustomers);

router.post('/transaction/new', authMiddleware, ledgerController.createTransaction);

router.get('/transaction/list', authMiddleware, ledgerController.listTransactions);

router.get('/tryKhatabook',authMiddleware,  profileImageMiddleware,  ledgerController.tryKhatabook);

router.get('/', authMiddleware, profileImageMiddleware, ledgerController.renderPage);

router.get('/:id', async (req, res) => {
  try {
    const customer = await LedgerCustomer.findById(req.params.id)
      .select('name amount_balance gold_balance silver_balance')
      .lean();

    if (!customer) return res.status(404).send('Customer not found');

    const customers = await LedgerCustomer.find({ type: { $in: ['customer', 'supplier'] } })
      .select('name _id')
      .sort({ name: 1 })
      .lean();

    const totals = await LedgerCustomer.aggregate([
      { $match: { type: { $in: ['customer', 'supplier'] } } },
      {
        $group: {
          _id: null,
          totalCash: { $sum: '$amount_balance' },
          totalGold: { $sum: '$gold_balance' },
          totalSilver: { $sum: '$silver_balance' }
        }
      }
    ]);

    const { totalCash = 0, totalGold = 0, totalSilver = 0 } = totals[0] || {};

    res.render('trykhata', {
      layout: false,
      customers,
      totalCash,
      totalGold,
      totalSilver,
      customer: {
        _id: customer._id,
        name: customer.name,
        cash: customer.amount_balance,
        gold: customer.gold_balance,
        silver: customer.silver_balance,
        entries: [] // will be loaded via JS
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/customer/:id', async (req, res) => {
  try {
    const customer = await LedgerCustomer.findById(req.params.id)
      .select('name amount_balance gold_balance silver_balance entries')
      .lean();

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    res.json({
      _id: customer._id,
      name: customer.name,
      cash: customer.amount_balance || 0,
      gold: customer.gold_balance || 0,
      silver: customer.silver_balance || 0,
      entries: customer.entries || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;
