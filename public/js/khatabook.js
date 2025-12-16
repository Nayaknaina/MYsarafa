(function(){
  // Wait for DataTables to be available and then initialize
  function waitForDataTable(cb){
    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.dataTable) return cb();
    setTimeout(function(){ waitForDataTable(cb); }, 150);
  }

  function initKhatabookTable(){
    if (!window.jQuery || !window.jQuery.fn || !window.jQuery.fn.dataTable) return;
    const $ = window.jQuery;

    const kbTable = $('#khatabook-table').DataTable({
      dom: 'Bfrtip',
      buttons: [ { extend: 'print', text: '<i class="fa fa-print"></i> Print', className: 'dt-print-btn' }, { extend: 'csv', text: 'CSV' } ],
      ajax: { url: '/ledger/transaction/list', dataSrc: function(d){ return d && d.data ? d.data : []; }, xhrFields: { withCredentials: true } },
      columns: [
        { data: null, render: function(d,t,r,meta){ return meta.row + 1; } },
        { data: 'date', render: function(d){ return d ? new Date(d).toLocaleString() : ''; } },
        { data: 'note', render: function(d){ return d || ''; } },

        { data: 'old_amount', render: function(d){ return (window.formatAmount||function(v){return v;})(d); } },
        { data: 'amount_in', render: function(d){ return (window.formatAmount||function(v){return v;})(d); } },
        { data: 'amount_out', render: function(d){ return (window.formatAmount||function(v){return v;})(d); } },
        { data: 'final_amount', render: function(d){ return (window.formatAmount||function(v){return v;})(d); } },

        { data: 'old_gold', render: function(d){ return (window.formatWeight||function(v){return v;})(d,'gm'); } },
        { data: 'gold_in', render: function(d){ return (window.formatWeight||function(v){return v;})(d,'gm'); } },
        { data: 'gold_out', render: function(d){ return (window.formatWeight||function(v){return v;})(d,'gm'); } },
        { data: 'final_gold', render: function(d){ return (window.formatWeight||function(v){return v;})(d,'gm'); } },

        { data: 'old_silver', render: function(d){ return (window.formatWeight||function(v){return v;})(d,'gm'); } },
        { data: 'silver_in', render: function(d){ return (window.formatWeight||function(v){return v;})(d,'gm'); } },
        { data: 'silver_out', render: function(d){ return (window.formatWeight||function(v){return v;})(d,'gm'); } },
        { data: 'final_silver', render: function(d){ return (window.formatWeight||function(v){return v;})(d,'gm'); } },

        { data: null, orderable:false, render: function(){ return '<button class="action-btn">Open</button>'; } }
      ],
      pageLength: 25,
      responsive: true,
      footerCallback: function(row,data,start,end,display){
        var api = this.api();
        var sum = function(idx){ return api.column(idx, { page: 'current' }).data().reduce(function(a,b){ return a + (Number(b)||0); }, 0); };
        try{
          var el = document.getElementById.bind(document);
          if (el('kb-total-old-cash')) el('kb-total-old-cash').textContent = (window.formatAmount||String)(sum(3));
          if (el('kb-total-cash-in')) el('kb-total-cash-in').textContent = (window.formatAmount||String)(sum(4));
          if (el('kb-total-cash-out')) el('kb-total-cash-out').textContent = (window.formatAmount||String)(sum(5));
          if (el('kb-total-final-cash')) el('kb-total-final-cash').textContent = (window.formatAmount||String)(sum(6));

          if (el('kb-total-old-gold')) el('kb-total-old-gold').textContent = (window.formatWeight||String)(sum(7),'gm');
          if (el('kb-total-gold-in')) el('kb-total-gold-in').textContent = (window.formatWeight||String)(sum(8),'gm');
          if (el('kb-total-gold-out')) el('kb-total-gold-out').textContent = (window.formatWeight||String)(sum(9),'gm');
          if (el('kb-total-final-gold')) el('kb-total-final-gold').textContent = (window.formatWeight||String)(sum(10),'gm');

          if (el('kb-total-old-silver')) el('kb-total-old-silver').textContent = (window.formatWeight||String)(sum(11),'gm');
          if (el('kb-total-silver-in')) el('kb-total-silver-in').textContent = (window.formatWeight||String)(sum(12),'gm');
          if (el('kb-total-silver-out')) el('kb-total-silver-out').textContent = (window.formatWeight||String)(sum(13),'gm');
          if (el('kb-total-final-silver')) el('kb-total-final-silver').textContent = (window.formatWeight||String)(sum(14),'gm');

          // update summary cards
          var inAmt = sum(4); var outAmt = sum(5); var net = inAmt + outAmt;
          var inCard = document.querySelector('.kb-amount.kb-in'); if (inCard) inCard.textContent = (window.formatAmount||String)(inAmt);
          var outCard = document.querySelector('.kb-amount.kb-out'); if (outCard) outCard.textContent = (window.formatAmount||String)(outAmt);
          var netCard = document.querySelector('.kb-amount.kb-net'); if (netCard) netCard.textContent = (window.formatAmount||String)(net);
        }catch(e){ console.error('kb footer update', e); }
      }
    });

    // wire customer select to reload khatabook
    var kbs = document.getElementById('khatabook-customer-select');
    if (kbs){
      kbs.addEventListener('change', function(){
        var cid = this.value || '';
        if (cid) kbTable.ajax.url('/ledger/transaction/list?customer=' + encodeURIComponent(cid)).load();
        else kbTable.ajax.url('/ledger/transaction/list').load();
        var mainSel = document.getElementById('ledger-customer-select'); if (mainSel) mainSel.value = cid;
      });
    }

    // mobile card rendering
    function renderKhatabookMobile(){
      try{
        var rows = kbTable.rows({ page: 'current' }).data().toArray();
        var mobileEl = document.getElementById('khatabook-mobile-list');
        if (!mobileEl) return;
        mobileEl.innerHTML = '';
        rows.forEach(function(r){
          var card = document.createElement('div'); card.className='kb-mobile-card';
          var headName = r.cname || r.cust_no || 'Customer';
          var finalAmt = (window.formatAmount||String)(r.final_amount);
          var g = (window.formatWeight||String)(r.final_gold,'gm');
          var s = (window.formatWeight||String)(r.final_silver,'gm');
          card.innerHTML = '<div class="kb-mobile-head"><strong>' + headName + '</strong><span class="kb-mobile-amt">' + finalAmt + '</span></div>' +
                           '<div class="kb-mobile-body"><div>Cash: ' + finalAmt + '</div><div>Gold: ' + g + '</div><div>Silver: ' + s + '</div><div class="kb-mobile-note">' + (r.note||'') + '</div></div>';
          mobileEl.appendChild(card);
        });
        if (window.innerWidth <= 700) { document.getElementById('khatabook-table').style.display='none'; mobileEl.style.display='block'; }
        else { document.getElementById('khatabook-table').style.display='table'; mobileEl.style.display='none'; }
      }catch(e){ /* ignore */ }
    }

    $('#khatabook-table').on('draw.dt', renderKhatabookMobile);
    window.khatabookTable = kbTable;
  }

  // kick off when ready
  waitForDataTable(initKhatabookTable);

  // Mobile: customer list & per-customer panel
  function initKhatabookMobileUI(){
    // only run on small screens
    try{
      var custListEl = document.getElementById('kb-customer-list');
      if (!custListEl) return;

      async function fetchCustomers(){
        try{
          var resp = await fetch('/ledger/customer/list?all=1', { credentials: 'same-origin' });
          if (!resp.ok) return [];
          var json = await resp.json(); return json.data || [];
        }catch(e){ return []; }
      }

      function makeCustomerCard(c){
        var div = document.createElement('div'); div.className='kb-cust-card';
        div.style.display='flex'; div.style.alignItems='center'; div.style.gap='10px'; div.style.padding='10px'; div.style.border='1px solid #eee'; div.style.borderRadius='8px';
        var avatar = document.createElement('div'); avatar.style.width='44px'; avatar.style.height='44px'; avatar.style.borderRadius='22px'; avatar.style.background='#ddd'; avatar.style.display='flex'; avatar.style.alignItems='center'; avatar.style.justifyContent='center'; avatar.style.fontWeight='700'; avatar.textContent = (c.name||' ')[0] || '?';
        var info = document.createElement('div'); info.style.flex='1';
        var name = document.createElement('div'); name.textContent = c.name || 'Unknown'; name.style.fontWeight='700';
        var sub = document.createElement('div'); sub.style.fontSize='12px'; sub.style.color='#666'; sub.textContent = c.cust_no ? c.cust_no : (c.mobile_no || '');
        info.appendChild(name); info.appendChild(sub);
        var bal = document.createElement('div'); bal.style.textAlign='right'; bal.innerHTML = '<div style="font-size:14px; font-weight:700">' + (window.formatAmount?window.formatAmount(c.amount_balance): (c.amount_balance||0)) + '</div><div style="font-size:12px;color:#666">' + (window.formatWeight?window.formatWeight(c.gold_balance,'gm') : (c.gold_balance||0) + 'g') + '</div>';
        div.appendChild(avatar); div.appendChild(info); div.appendChild(bal);
        div.dataset.cid = c._id;
        div.addEventListener('click', function(){ openCustomerPanel(c._id, c); });
        return div;
      }

      async function populateMobileCustomerList(){
        custListEl.innerHTML = '<div style="padding:12px; text-align:center; color:#666">Loading customers...</div>';
        var arr = await fetchCustomers();
        custListEl.innerHTML = '';
        if (!arr || arr.length === 0){ custListEl.innerHTML = '<div style="padding:12px; text-align:center; color:#666">No customers</div>'; return; }
        arr.forEach(function(c){ custListEl.appendChild(makeCustomerCard(c)); });
      }

      // open per-customer panel
      async function openCustomerPanel(cid, customer){
        var panel = document.getElementById('khatabook-customer-panel');
        var nameEl = document.getElementById('kb-cust-name');
        var backBtn = document.getElementById('kb-cust-back');
        var entriesEl = document.getElementById('kb-cust-entries');
        var cashEl = document.getElementById('kb-cust-cash');
        var goldEl = document.getElementById('kb-cust-gold');
        var silverEl = document.getElementById('kb-cust-silver');
        if (!panel) return;
        nameEl.textContent = customer && customer.name ? customer.name : 'Customer';
        panel.style.display = 'block';

        backBtn.onclick = function(){ panel.style.display='none'; };

        // fetch transactions for this customer
        entriesEl.innerHTML = '<div style="padding:12px; text-align:center; color:#666">Loading entries...</div>';
        try{
          var resp = await fetch('/ledger/transaction/list?customer=' + encodeURIComponent(cid), { credentials: 'same-origin' });
          if (!resp.ok){ entriesEl.innerHTML = '<div style="padding:12px; text-align:center; color:#c00">Could not load entries</div>'; return; }
          var json = await resp.json(); var txns = json.data || [];

          if (!txns.length){ entriesEl.innerHTML = '<div style="padding:18px; text-align:center; color:#666">No entries yet.<br/><button id="kb-add-first" class="ledger-add-member-btn" style="margin-top:12px;">Add transaction</button></div>'; var btn = document.getElementById('kb-add-first'); if (btn) btn.addEventListener('click', function(){ document.getElementById('kb-add-asset').focus(); }); }
          else {
            entriesEl.innerHTML = '';
            txns.forEach(function(t){
              var row = document.createElement('div'); row.style.padding='10px'; row.style.borderBottom='1px solid #f2f2f2';
              var left = document.createElement('div'); left.style.fontSize='12px'; left.style.color='#666'; left.textContent = (new Date(t.date)).toLocaleString();
              var right = document.createElement('div'); right.style.textAlign='right'; right.innerHTML = '<div style="font-weight:700">' + (t.amount_in? (window.formatAmount?window.formatAmount(t.amount_in):t.amount_in) : (t.amount_out? (window.formatAmount?window.formatAmount(t.amount_out):t.amount_out) : '')) + '</div><div style="font-size:12px;color:#666">' + (t.note||'') + '</div>';
              row.appendChild(left); row.appendChild(right); entriesEl.appendChild(row);
            });
          }

          // compute summary totals from txns
          var cash = 0, gold = 0, silver = 0;
          txns.forEach(function(t){ cash += Number(t.amount_in||0) - Number(t.amount_out||0); gold += Number(t.gold_in||0) - Number(t.gold_out||0); silver += Number(t.silver_in||0) - Number(t.silver_out||0); });
          cashEl.textContent = (window.formatAmount?window.formatAmount(cash):cash);
          goldEl.textContent = (window.formatWeight?window.formatWeight(gold,'gm'): (gold + 'g'));
          silverEl.textContent = (window.formatWeight?window.formatWeight(silver,'gm'): (silver + 'g'));

          // wire bottom add buttons to this customer context
          var addIn = document.getElementById('kb-add-in');
          var addOut = document.getElementById('kb-add-out');
          var assetSel = document.getElementById('kb-add-asset');
          var valInput = document.getElementById('kb-add-value');

          function doAdd(isIn){
            var asset = assetSel.value || 'cash';
            var val = Number(valInput.value || 0);
            if (!val){ toastr.error('Enter value'); return; }
            var payload = { customer: cid, date: new Date().toISOString(), note: (asset + ' quick entry') };
            if (asset === 'cash'){ if (isIn) payload.amount_in = val; else payload.amount_out = val; }
            if (asset === 'gold'){ if (isIn) payload.gold_in = val; else payload.gold_out = val; }
            if (asset === 'silver'){ if (isIn) payload.silver_in = val; else payload.silver_out = val; }
            // post
            fetch('/ledger/transaction/new', { method:'POST', credentials:'same-origin', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
              .then(r=>r.json().then(j=>({ok:r.ok, json:j}))).then(function(res){
                if (!res.ok){ toastr.error((res.json && res.json.message) ? res.json.message : 'Failed'); return; }
                toastr.success('Added');
                // refresh panel
                openCustomerPanel(cid, customer);
                // refresh main tables
                if (window.khatabookTable && window.khatabookTable.ajax) window.khatabookTable.ajax.reload(null,false);
                if (typeof listTable !== 'undefined' && listTable && listTable.ajax) listTable.ajax.reload(null,false);
                if (typeof table !== 'undefined' && table && table.ajax) table.ajax.reload(null,false);
              }).catch(function(e){ console.error('add txn', e); toastr.error('Error'); });
          }

          if (addIn) { addIn.onclick = function(){ doAdd(true); }; }
          if (addOut) { addOut.onclick = function(){ doAdd(false); }; }

        }catch(e){ entriesEl.innerHTML = '<div style="padding:12px; text-align:center; color:#c00">Error loading entries</div>'; }
      }

      // init
      populateMobileCustomerList();

      // ensure customer list shown on small screens
      function adaptView(){ if (window.innerWidth <= 700){ document.getElementById('khatabook-table').style.display='none'; document.getElementById('khatabook-mobile-list').style.display='block'; } else { document.getElementById('khatabook-table').style.display='table'; document.getElementById('khatabook-mobile-list').style.display='none'; } }
      window.addEventListener('resize', adaptView); adaptView();

    }catch(e){ console.error('init mobile UI', e); }
  }

  // Kick off mobile UI (after DataTables init) - safe to call now
  try{ initKhatabookMobileUI(); }catch(e){ /* ignore */ }

})();
