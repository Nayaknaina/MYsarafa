
const LedgerCustomer = require('../models/ledger.model');
const LedgerTx = require('../models/ledgerTx.model');
const User = require('../models/user.model');
const XLSX = require('xlsx');
const fs = require('fs');

exports.createCustomer = async (req, res, next) => {
  try {
    const { name, mobile_no, email, address,  cust_no,type_of_customer } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const existing = await LedgerCustomer.findOne({
      name: name.trim(),
      mobile_no: mobile_no.trim(),
      createdBy: req.user._id
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Customer with same name and mobile already exists!'
      });
    }

    // optional: enforce mobile format or unique cust_no
    const payload = {
      name: name.trim(),
      mobile_no: mobile_no ? mobile_no.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      address: address || '',
      type: type_of_customer === 'supplier' ? 'supplier' : 'customer',
      createdBy: req.user ? req.user._id : undefined,
      amount_balance: req.body.amount_balance ? Number(req.body.amount_balance) : 0,
      gold_balance: req.body.gold_balance ? Number(req.body.gold_balance) : 0,
      silver_balance: req.body.silver_balance ? Number(req.body.silver_balance) : 0,
      
    };

    if (cust_no) payload.cust_no = cust_no;

    const ledger = new LedgerCustomer(payload);
    await ledger.save();

    return res.status(201).json({ success: true, message: 'Customer created', data: ledger });
  } catch (err) {
    // handle duplicate key
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate value', error: err.message });
    }
    next(err);
  }
};


exports.listCustomers = async (req, res, next) => {
  try {
    // allow optional query to fetch all
    // const { all } = req.query;
    // const filter = {};
    // if (!all && req.user) filter.createdBy = req.user._id;

    // const list = await LedgerCustomer.find(filter).sort({ createdAt: -1 }).lean();
    const filter = { createdBy: req.user._id };

    const list = await LedgerCustomer.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};


exports.renderPage = async (req, res, next) => {
  try {
    // Pass minimal context to the template; layout 'main' used by default
    return res.render('ledger', { user: req.user, title: 'Udhar Ledger',query: req.query });
  } catch (err) {
    next(err);
  }
};
// exports.tryKhatabook = async (req, res, next) => {
//  try {
//     const customers = await LedgerCustomer.find({ 
//       type: { $in: ['customer', 'supplier'] } 
//     })
//       .select('name _id')
//       .sort({ name: 1 })
//       .lean();

//     console.log('Fetched customers:', customers);

//     const totals = await LedgerCustomer.aggregate([
//       { $match: { type: 'customer' } },
//       {
//         $group: {
//           _id: null,
//           totalCash: { $sum: '$amount_balance' },
//           totalGold: { $sum: '$gold_balance' },
//           totalSilver: { $sum: '$silver_balance' }
//         }
//       }
//     ]);

//     const { totalCash = 0, totalGold = 0, totalSilver = 0 } = totals[0] || {};

//     res.render('trykhata', {
//       layout: false,
//       customers,
//       totalCash,
//       totalGold,
//       totalSilver,
//       customer: { name: '', cash: 0, gold: 0, silver: 0, entries: [] } // dummy
//     });
//   } catch (err) {
//     res.status(500).send('Server Error');
//   }
// };

exports.tryKhatabook = async (req, res, next) => {
  try {
      const user = await User.findById(req.user.id).lean();
        if (!user) {
          return res.status(404).render('error', {
            statusCode: 404,
            title: 'User Not Found',
            errorMessage: 'No user found with the provided credentials.',
            layout: false
          });
        }
      const { id } = req.params;
      const urlType = req.query.type;

   
      let customer = { name: '', cash: 0, gold: 0, silver: 0, entries: [] };
      if (id) {
        const found = await LedgerCustomer.findById(id).lean();
        if (found) {
          customer = {
            _id: found._id,
            name: found.name,
            mobile_no: found.mobile_no || '',
            cash: found.amount_balance || 0,
            gold: found.gold_balance || 0,
            silver: found.silver_balance || 0,
            entries: found.entries || []
          };
        }
      }

    const customers = await LedgerCustomer.find({ 
      createdBy:user,
      type: { $in: ['customer', 'supplier'] } 
    })
      .select('name _id mobile_no type amount_balance gold_balance silver_balance entries createdAt ')
      .sort({ name: 1 })
      .lean();

    const totals = await LedgerCustomer.aggregate([
      // { $match: { type: { $in: ['customer', 'supplier'] } } },
       { $match: { createdBy: user._id } },
      {
        $group: {
          _id: null,
          totalCash: { $sum: '$amount_balance' },
          totalGold: { $sum: '$gold_balance' },
          totalSilver: { $sum: '$silver_balance' }
        }
      }
    ]);
    console.log("totals",totals);
    const { totalCash = 0, totalGold = 0, totalSilver = 0 } = totals[0] || {};

    res.render('trykhata', {
      user,
      title:'Khatabook | MySarafa', 
      customers,
      totalCash,
      totalGold,
      totalSilver,
      customer,
      urlType:urlType || 'customer'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Create a new transaction (udhar list row)
exports.createTransaction = async (req, res, next) => {
  const user = await User.findById(req.user.id).lean();
        if (!user) {
          return res.status(404).render('error', {
            statusCode: 404,
            title: 'User Not Found',
            errorMessage: 'No user found with the provided credentials.',
            layout: false
          });
        }
 try {
    const { customerId, type, amount, transactionType } = req.body;

    // Validate
    if (!customerId || !type || !amount || !transactionType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['cash', 'gold', 'silver'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    if (!['gave', 'got'].includes(transactionType)) {
      return res.status(400).json({ error: 'Invalid transactionType' });
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Find customer
    const customer = await LedgerCustomer.findById(customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Update balance
    const fieldMap = {
      cash: 'amount_balance',
      gold: 'gold_balance',
      silver: 'silver_balance'
    };
    const field = fieldMap[type];
    const delta = transactionType === 'gave' ? -amountNum : +amountNum;
    customer[field] += delta;

    // Create entry
    const entry = {
      date: new Date(),
      item: type,
      amount: amountNum,
      transactionType,
      balance: {
        cash: customer.amount_balance,
        gold: customer.gold_balance,
        silver: customer.silver_balance
      }
    };

    // Push to entries array
    customer.entries = customer.entries || [];
    customer.entries.unshift(entry); // newest first

    // Save customer
    await customer.save();
    console.log("customer came",customer);

    // Optional: Save to LedgerTx (for audit log)
    const tx = new LedgerTx({
      date: entry.date,
      customer: customer._id,
      cname: customer.name,
      cust_no: customer.cust_no || '',

      // Map to your LedgerTx schema
      ...(type === 'cash' && {
        old_amount: customer.amount_balance - delta,
        amount_in: transactionType === 'got' ? amountNum : 0,
        amount_out: transactionType === 'gave' ? amountNum : 0,
        final_amount: customer.amount_balance
      }),
      ...(type === 'gold' && {
        old_gold: customer.gold_balance - delta,
        gold_in: transactionType === 'got' ? amountNum : 0,
        gold_out: transactionType === 'gave' ? amountNum : 0,
        final_gold: customer.gold_balance
      }),
      ...(type === 'silver' && {
        old_silver: customer.silver_balance - delta,
        silver_in: transactionType === 'got' ? amountNum : 0,
        silver_out: transactionType === 'gave' ? amountNum : 0,
        final_silver: customer.silver_balance
      }),

      type: 'udhar',
      createdBy: req.user?._id
    });
    await tx.save();
    console.log("transaction came",tx);// Calculate totals for this user
  const userTotals = await LedgerCustomer.aggregate([
  { $match: { createdBy: req.user._id } },
  {
    $group: {
      _id: null,
      totalCash: { $sum: "$amount_balance" },
      totalGold: { $sum: "$gold_balance" },
      totalSilver: { $sum: "$silver_balance" }
    }
  }
]);

const totals = userTotals[0] || { totalCash: 0, totalGold: 0, totalSilver: 0 };



    // Return updated data
    res.json({
      success: true,
      user,
      totals,
      balances: {
        cash: customer.amount_balance,
        gold: customer.gold_balance,
        silver: customer.silver_balance
      },
      entry: {
        date: entry.date,
        item: type,
        amount: amountNum,
        transactionType,
        balanc: entry.balance
      }
    });

  } catch (err) {
    console.error('Transaction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// List transactions
exports.listTransactions = async (req, res, next) => {
  try {
    const { startDate, endDate, customer } = req.query;
    console.log("quwery got cleared",req.query)

    const filter = {
      createdBy: req.user._id   
    };
    console.log("1",filter)

    if (customer) {
      // Optional: extra safety - verify the customer belongs to this user
      const customerDoc = await LedgerCustomer.findOne({
        _id: customer,
        createdBy: req.user._id
      });
      console.log("2",customerDoc)
      if (!customerDoc && customer) {
        return res.json({ success: true, data: [] }); // or 403
      }
      filter.customer = customer;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const list = await LedgerTx.find(filter)
      // optional, for display
      .sort({ date: -1 })
      .lean();

    return res.json({ success: true, data: list });
  } catch (err) {
    console.error(err);
    next(err);
  }
};


exports.bulkupload = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
        if (!user) {
          return res.status(404).render('error', {
            statusCode: 404,
            title: 'User Not Found',
            errorMessage: 'No user found with the provided credentials.',
            layout: false
          });
        }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const added = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      const name = (row.Name || row.name || row.Customer || '').toString().trim();
      if (!name) {
        errors.push(`Row ${rowNum}: Name is required`);
        continue;
      }

    
      let rawType = (row.Type || row.type || row.TYPE || row.Category || '').toString().trim();
      let type = 'customer'; 

      if (rawType) {
        rawType = rawType.toLowerCase();
        if (['supplier', 'suppliers', 'vendor', 'vendors', 'sup', 's'].includes(rawType)) {
          type = 'supplier';
        } else if (['customer', 'cust', 'c', 'client', 'party'].includes(rawType)) {
          type = 'customer';
        }
       
      }

      try {
        const cust = await LedgerCustomer.create({
          name,
          mobile_no: (row.Mobile || row.mobile_no || row.Phone || '').toString().trim(),
          email: (row.Email || row.email || '').toString().trim(),
          address: (row.Address || row.address || '').toString().trim(),
          type: type  ,
          createdBy:user._id
        });
        added.push(cust);
      } catch (e) {
        errors.push(`Row ${rowNum}: ${e.message}`);
      }
    }

    fs.unlink(filePath, () => {});

    return res.json({
      success: true,
      added: added.length,
      errors: errors.length ? errors : null,
      customers: added
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};