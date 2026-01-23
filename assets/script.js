// Small UX: mobile nav toggle, form feedback, and year injection
document.addEventListener('DOMContentLoaded',function(){
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle && navToggle.addEventListener('click',()=>{
    mainNav.classList.toggle('open');
  });

  // inject current year
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = y;

  // basic contact form submission feedback (static demo)
  const form = document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      alert('Thank you! This is a static demo. Please use the email button to place orders.');
      form.reset();
    });
  }

  /* Lightbox for images with .lightbox-img */
  const images = document.querySelectorAll('.lightbox-img');
  if(images && images.length){
    const overlay = document.createElement('div'); overlay.className = 'lightbox-overlay';
    overlay.innerHTML = '<div class="lightbox-inner"><button class="lightbox-close" aria-label="Close">✕</button><img src="" alt="expanded image"></div>';
    document.body.appendChild(overlay);
    const overlayImg = overlay.querySelector('img');
    const closeBtn = overlay.querySelector('.lightbox-close');

    images.forEach(img=>{
      img.style.cursor = 'zoom-in';
      img.addEventListener('click',()=>{
        const src = img.getAttribute('data-full') || img.src;
        overlayImg.src = src;
        overlay.classList.add('open');
      });
    });

    const close = ()=>{ overlay.classList.remove('open'); overlayImg.src = ''; };
    overlay.addEventListener('click',(e)=>{ if(e.target === overlay) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
  }
});

/* Cart logic: persistent localStorage cart, mini-cart, toast and floating badge */
(function(){
  const STORAGE_KEY = 'masalaandmug_cart_v1';
  let cart = { items: [] };

  function loadCart(){
    try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) cart = JSON.parse(raw); }catch(e){ cart = {items:[]}; }
  }

  function saveCart(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }catch(e){ /* ignore */ }
  }

  function getTotals(){
    const count = cart.items.reduce((s,i)=>s + (i.qty||1),0);
    const total = cart.items.reduce((s,i)=>s + (i.qty||1) * (Number(i.price)||0),0);
    return {count,total};
  }

  function renderBadge(){
    const bc = document.getElementById('floatingCount');
    const cc = document.getElementById('cartCount');
    const hc = document.getElementById('headerCartCount');
    const {count,total} = getTotals();
    if(bc) bc.textContent = count;
    if(cc) cc.textContent = count;
    if(hc) hc.textContent = count;
    const totalEl = document.getElementById('cartTotal'); if(totalEl) totalEl.textContent = total;
    // hide mini cart if empty
    const mini = document.getElementById('miniCart');
    if(!mini) return;
    if(count === 0) mini.setAttribute('aria-hidden','true');
    // pulse header cart when items added
    const headerCart = document.getElementById('headerCart');
    if(headerCart){
      headerCart.classList.remove('pulse');
      // update title/tooltip
      headerCart.title = `View cart (${count} item${count===1? '': 's'})`;
      // force reflow then add class to retrigger animation
      void headerCart.offsetWidth;
      if(count>0) headerCart.classList.add('pulse');
    }
    // update mobile sticky badge if present
    const stickyBadge = document.getElementById('stickyCartBadge');
    if(stickyBadge) stickyBadge.textContent = count;
    // also update sticky button title
    const stickyBtn = document.getElementById('stickyCartMobile'); if(stickyBtn) stickyBtn.title = `Open cart (${count} item${count===1? '': 's'})`;
  }

  function showToast(message, timeout=2500){
    const toast = document.getElementById('toast'); if(!toast) return;
    const node = document.createElement('div'); node.className = 'toast-msg'; node.textContent = message;
    toast.appendChild(node);
    setTimeout(()=>{ node.style.opacity = '0'; setTimeout(()=>{ node.remove(); },350); }, timeout);
  }

  function findItemIndex(name){ return cart.items.findIndex(i=>i.name === name); }

  function addItem(item){
    const idx = findItemIndex(item.name);
    if(idx > -1){ cart.items[idx].qty = (cart.items[idx].qty||1) + (item.qty||1); }
    else { cart.items.push(Object.assign({qty:1}, item)); }
    saveCart(); renderBadge(); renderMiniCart(); showToast(`${item.name} added to cart.`);
    // fly-to-cart animation for delight
    try{ flyToCart(item); }catch(e){}
  }

  function updateQty(name, qty){ const idx = findItemIndex(name); if(idx > -1){ cart.items[idx].qty = qty; if(qty<=0) cart.items.splice(idx,1); saveCart(); renderBadge(); renderMiniCart(); } }

  function removeItem(name){ const idx = findItemIndex(name); if(idx>-1){ cart.items.splice(idx,1); saveCart(); renderBadge(); renderMiniCart(); } }

  // Save for later: POST to demo backend, fallback to localStorage
  async function saveForLater(item){
    try{
      await fetch('/api/save-for-later', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ key: 'demo-user', item }) });
      showToast(`${item.name} saved for later (server)`);
    }catch(e){
      // fallback: persist locally
      const key = 'masalaandmug_saved_v1';
      try{ const raw = localStorage.getItem(key); const arr = raw ? JSON.parse(raw) : []; arr.push(item); localStorage.setItem(key, JSON.stringify(arr)); showToast(`${item.name} saved for later (local)`); }catch(err){ showToast('Could not save for later'); }
    }
  }

  function renderMiniCart(){
    const container = document.getElementById('miniCartItems'); if(!container) return;
    container.innerHTML = '';
    if(cart.items.length === 0){ container.innerHTML = '<div class="muted" style="padding:0.6rem">Your cart is empty.</div>'; return; }
    cart.items.forEach(it=>{
      const el = document.createElement('div'); el.className = 'mini-cart-item';
      el.innerHTML = `<img src="${it.image || 'assets/images/masala_chai.jpg'}" alt="${it.name}"><div class="meta"><h5>${it.name}</h5><div>₹${it.price} each</div><div class="qty">Qty: <button class="qty-minus" data-name="${it.name}">-</button> <span class="qty-val">${it.qty}</span> <button class="qty-plus" data-name="${it.name}">+</button> <button class="remove-item" data-name="${it.name}">Remove</button></div></div>`;
      container.appendChild(el);
    });
    // wire up qty controls
    container.querySelectorAll('.qty-plus').forEach(btn=>btn.addEventListener('click',()=>{ const name = btn.dataset.name; const idx = findItemIndex(name); if(idx>-1) updateQty(name, cart.items[idx].qty+1); }));
    container.querySelectorAll('.qty-minus').forEach(btn=>btn.addEventListener('click',()=>{ const name = btn.dataset.name; const idx = findItemIndex(name); if(idx>-1) updateQty(name, cart.items[idx].qty-1); }));
    container.querySelectorAll('.remove-item').forEach(btn=>btn.addEventListener('click',()=>{ removeItem(btn.dataset.name); }));
  }

  // wire add-to-cart buttons
  function initAddButtons(){
    document.querySelectorAll('.add-to-cart').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const name = btn.dataset.name || btn.textContent.trim();
        const price = Number(btn.dataset.price) || 0;
        const image = btn.dataset.image || '';
        addItem({name,price,image});
      });
    });
    const heroBtn = document.getElementById('heroAddToCart'); if(heroBtn) heroBtn.addEventListener('click',()=>{ const name = heroBtn.dataset.name||'Masala Chai'; addItem({name,price: Number(heroBtn.dataset.price)||60,image:heroBtn.dataset.image||'assets/images/masala_chai.jpg'}); });
  }

  // mini-cart toggle & actions (floatingCart removed)
  function initFloatingCart(){
    const mini = document.getElementById('miniCart');
    const close = document.getElementById('miniCartClose');
    const view = document.getElementById('viewCartBtn');
    const checkout = document.getElementById('checkoutBtn');
    const headerCart = document.getElementById('headerCart');
    // apply configured position (left or right)
    try{
      const cfg = (window.__masalaCartConfig && window.__masalaCartConfig.position) || 'left';
      if(mini){ mini.classList.remove('left','right'); mini.classList.add(cfg === 'right' ? 'right' : 'left'); }
    }catch(e){ /* ignore */ }
    if(mini){
      // open mini cart when items added: we renderBadge toggles to open when items exist elsewhere
    }
    if(headerCart && mini){
      headerCart.addEventListener('click', ()=>{
        const isOpen = mini.getAttribute('aria-hidden') === 'false';
        mini.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
        if(!isOpen) trapFocus(mini); else releaseFocus();
      });
    }
    // header settings persistence: mirror selection into mini-cart class
    const posSelect = document.getElementById('headerCartPosition');
    const POS_KEY = 'masalaandmug_cart_position';
    function applyPos(v){ if(!mini) return; mini.classList.remove('left','right'); mini.classList.add(v === 'right' ? 'right' : 'left'); }
    if(posSelect){
      const saved = localStorage.getItem(POS_KEY) || posSelect.value || 'left';
      posSelect.value = saved;
      applyPos(saved);
      posSelect.addEventListener('change', e=>{ const v = e.target.value; try{ localStorage.setItem(POS_KEY, v); }catch(err){} applyPos(v); });
      // allow closing the popup
      const closeSettings = document.getElementById('closeSettings'); if(closeSettings){ closeSettings.addEventListener('click', ()=>{ const popup = document.getElementById('headerSettingsPopup'); if(popup) popup.setAttribute('aria-hidden','true'); }); }
      // toggle popup on gear click
      const gear = document.getElementById('headerSettings'); if(gear){ gear.addEventListener('click', ()=>{ const popup = document.getElementById('headerSettingsPopup'); if(!popup) return; const shown = popup.getAttribute('aria-hidden') === 'false'; popup.setAttribute('aria-hidden', shown ? 'true' : 'false'); } ); }
    }
    if(close && mini) close.addEventListener('click',()=>{ mini.setAttribute('aria-hidden','true'); releaseFocus(); });
    if(view) view.addEventListener('click',()=>{ /* let link do navigation */ });
    if(checkout) checkout.addEventListener('click',()=>{ alert('Proceeding to checkout is not implemented in this static demo.'); });
  }

  // Replace simple focus trap with optional focus-trap library (focus-trap) if available
  let focusTrapInstance = null;
  function trapFocus(root){
    try{
      if(window.createFocusTrap){ // if focus-trap library provides createFocusTrap
        focusTrapInstance = window.createFocusTrap(root, { escapeDeactivates: true, clickOutsideDeactivates: true });
        focusTrapInstance.activate();
      } else if(window.focusTrap && typeof window.focusTrap === 'function'){
        focusTrapInstance = window.focusTrap(root);
        focusTrapInstance.activate && focusTrapInstance.activate();
      } else {
        // fallback: set focus to first focusable
        const focusable = root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if(focusable && focusable[0]) focusable[0].focus();
      }
    }catch(e){ console.warn('trapFocus fallback', e); }
  }

  function releaseFocus(){ try{ if(focusTrapInstance && focusTrapInstance.deactivate) focusTrapInstance.deactivate(); focusTrapInstance = null; }catch(e){} }

  // fly-to-cart animation: clone thumbnail and animate toward cart badge position
  function flyToCart(item){
    // find an image in DOM matching item.image or the first .lightbox-img
    const src = item.image || document.querySelector('.lightbox-img')?.src;
    if(!src) return;
    // find the first product element that matches the name
    const sourceEl = Array.from(document.querySelectorAll('img, .card')).find(el=>{ try{ return (el.alt && el.alt.indexOf(item.name)!==-1) || (el.closest && el.closest('.card') && el.closest('.card').querySelector('h3') && el.closest('.card').querySelector('h3').textContent.indexOf(item.name)!==-1); }catch(e){return false;} });
    const img = document.createElement('img'); img.src = src; img.className = 'fly-clone'; img.style.width = '120px'; img.style.height = '90px'; img.style.objectFit = 'cover'; img.style.borderRadius = '8px';
    document.body.appendChild(img);
    let rectStart = sourceEl ? (sourceEl.getBoundingClientRect()) : {left: window.innerWidth/2, top: window.innerHeight/2, width:120, height:90};
    img.style.left = (rectStart.left + window.scrollX) + 'px'; img.style.top = (rectStart.top + window.scrollY) + 'px';
    // target: cart badge if exists, else top-right corner
    const badge = document.getElementById('cartCount') || document.getElementById('cartTotal');
    const rectEnd = badge ? badge.getBoundingClientRect() : {left: window.innerWidth - 60, top: 40};
    // compute transform
    const dx = (rectEnd.left + window.scrollX) - (rectStart.left + window.scrollX);
    const dy = (rectEnd.top + window.scrollY) - (rectStart.top + window.scrollY);
    requestAnimationFrame(()=>{
      img.style.transition = 'transform .7s cubic-bezier(.2,.9,.2,1), opacity .4s ease';
      img.style.transform = `translate(${dx}px, ${dy}px) scale(.2)`;
      img.style.opacity = '0.6';
    });
    setTimeout(()=>{ img.remove(); }, 900);
  }

  // initialize
  loadCart(); document.addEventListener('DOMContentLoaded',()=>{ initAddButtons(); initFloatingCart(); renderBadge(); renderMiniCart();
    // wire sticky mobile cart button
    const sticky = document.getElementById('stickyCartMobile');
    const mini = document.getElementById('miniCart');
    if(sticky && mini){
      sticky.addEventListener('click', ()=>{
        const isOpen = mini.getAttribute('aria-hidden') === 'false';
        mini.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
        if(!isOpen) trapFocus(mini); else releaseFocus();
      });
    }
  });

  // expose for debugging
  window.__masalaCart = {
    getCart: ()=>cart,
    addItem: addItem,
    removeItem: removeItem,
    updateQty: updateQty
  };
})();

/* Cart position settings (persisted) */
(function(){
  const KEY = 'masalaandmug_cart_position';
  // prefer explicit window config, then localStorage
  const cfgPos = (window.__masalaCartConfig && window.__masalaCartConfig.position) || localStorage.getItem(KEY) || 'left';
  function applyPos(pos){ const mini = document.getElementById('miniCart'); if(mini){ mini.classList.remove('left','right'); mini.classList.add(pos); } }
  // apply initial
  document.addEventListener('DOMContentLoaded', ()=>{ applyPos(cfgPos);
    const sel = document.getElementById('cartPositionSelect'); if(!sel) return; sel.value = cfgPos; sel.addEventListener('change', ()=>{ const v = sel.value; try{ localStorage.setItem(KEY, v); }catch(e){} applyPos(v); });
  });
})();

/* Cart page: empty state, mobile sticky bar, checkout modal stepper */
(function(){
  function formatCurrency(v){ return Math.round(v); }
  function renderCartPage(){
    const page = document.getElementById('cartItems'); if(!page) return;
    const cart = (window.__masalaCart && window.__masalaCart.getCart()) || {items:[]};
    const summarySubtotal = document.getElementById('pageSubtotal'); const summaryTax = document.getElementById('pageTax'); const summaryTotal = document.getElementById('pageTotal'); const mobileCount = document.getElementById('mobileCount'); const mobileTotal = document.getElementById('mobileTotal');
    page.innerHTML = '';
    if(!cart.items.length){
      page.innerHTML = `<div class="empty-state"><img src="assets/images/masala_chai.jpg" alt="Empty"><h3>Your cart is empty</h3><p class="muted">Add some delicious chai or coffee to get started.</p><p style="margin-top:0.8rem"><a class="btn btn-primary" href="index.html">Continue Shopping</a></p></div>`;
      if(summarySubtotal) summarySubtotal.textContent = '0'; if(summaryTax) summaryTax.textContent='0'; if(summaryTotal) summaryTotal.textContent='0'; if(mobileCount) mobileCount.textContent='0'; if(mobileTotal) mobileTotal.textContent='0'; toggleMobileBar(false); return; }

    // populate items list
    cart.items.forEach(it=>{
      const row = document.createElement('div'); row.className='card'; row.style.display='flex'; row.style.gap='0.6rem'; row.style.padding='0.6rem'; row.style.alignItems='center';
      // stock example
      const stockTxt = (Math.random()>0.9) ? '<div class="muted">Only 2 left</div>' : '<div class="muted">In stock</div>';
      row.innerHTML = `<img src="${it.image||'assets/images/masala_chai.jpg'}" style="width:96px;height:72px;object-fit:cover;border-radius:6px"><div style="flex:1"><h4 style="margin:0">${it.name}</h4><div>₹${it.price} each</div>${stockTxt}<div style="margin-top:0.4rem">Qty: <button class="page-qty-minus" data-name="${it.name}">-</button> <span class="page-qty">${it.qty}</span> <button class="page-qty-plus" data-name="${it.name}">+</button> <button class="page-remove" data-name="${it.name}">Remove</button> <button class="save-later" data-name="${it.name}">Save for later</button></div></div><div style="font-weight:700">₹${(it.price * it.qty).toFixed(0)}</div>`;
      page.appendChild(row);
    });

  // summary (shipping removed per user request)
  const subtotal = cart.items.reduce((s,i)=>s + i.price * i.qty,0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  if(summarySubtotal) summarySubtotal.textContent = formatCurrency(subtotal);
  if(summaryTax) summaryTax.textContent = formatCurrency(tax);
  if(summaryTotal) summaryTotal.textContent = formatCurrency(total);
    if(mobileCount) mobileCount.textContent = cart.items.reduce((s,i)=>s + i.qty,0);
    if(mobileTotal) mobileTotal.textContent = formatCurrency(total);
    toggleMobileBar(true);

    // wire buttons
    page.querySelectorAll('.page-qty-plus').forEach(b=>b.addEventListener('click',()=>{ window.__masalaCart.updateQty(b.dataset.name, (window.__masalaCart.getCart().items.find(i=>i.name===b.dataset.name).qty||1) + 1); renderCartPage(); renderMiniCart(); renderBadge(); }));
    page.querySelectorAll('.page-qty-minus').forEach(b=>b.addEventListener('click',()=>{ const it = window.__masalaCart.getCart().items.find(i=>i.name===b.dataset.name); window.__masalaCart.updateQty(b.dataset.name, (it.qty||1) - 1); renderCartPage(); renderMiniCart(); renderBadge(); }));
    page.querySelectorAll('.page-remove').forEach(b=>b.addEventListener('click',()=>{ window.__masalaCart.removeItem(b.dataset.name); renderCartPage(); renderMiniCart(); renderBadge(); }));
    page.querySelectorAll('.save-later').forEach(b=>b.addEventListener('click',()=>{
      const it = cart.items.find(x=>x.name === b.dataset.name);
      if(!it) return;
      // save to server/local and remove from cart
      saveForLater(it);
      removeItem(it.name);
      renderCartPage();
      renderMiniCart();
      renderBadge();
    }));
  }

  function toggleMobileBar(show){ const bar = document.getElementById('mobileStickyBar'); if(!bar) return; bar.setAttribute('aria-hidden', show ? 'false' : 'true'); bar.style.display = show ? 'flex' : 'none'; }

  // coupon apply (server-validated if backend is available)
  function initCoupon(){
    const btn = document.getElementById('applyCoupon'); if(!btn) return;
    btn.addEventListener('click', async ()=>{
      const code = document.getElementById('couponCode').value.trim(); if(!code){ alert('Enter a coupon code'); return; }
      const cartData = window.__masalaCart && window.__masalaCart.getCart ? window.__masalaCart.getCart() : {items:[]};
      const subtotal = cartData.items.reduce((s,i)=>s + i.price * i.qty,0);
      try{
        const res = await fetch('/api/validate-coupon', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ code, subtotal }) });
        const j = await res.json();
        const out = document.getElementById('couponResult');
        if(j.ok){ out && (out.textContent = `Applied ${j.coupon}: -₹${j.discount} (${j.description})`); showToast(`Coupon ${j.coupon} applied: -₹${j.discount}`); }
        else { out && (out.textContent = j.message || 'Invalid coupon'); showToast('Coupon invalid'); }
      }catch(e){ alert('Coupon service unavailable'); }
      renderCartPage();
    });
  }

  // checkout modal stepper + demo payment flow
  function initCheckoutModal(){
    const modal = document.getElementById('checkoutModal');
    const openBtn = document.getElementById('pageCheckout');
    const mobileBtn = document.getElementById('mobileCheckoutBtn');
    const close = document.getElementById('closeCheckout');
    const prev = document.getElementById('prevStep');
    const next = document.getElementById('nextStep');
    // Use all steps, but reorder logic: Cart → Address → Review → Payment
    let steps = Array.from(document.querySelectorAll('#checkoutSteps .step'));
    let idx = 0;

    function renderStepContent(){
      if(!modal) return;
      const content = modal.querySelector('#checkoutContent');
      if(!content) return;
      // clear and render per-step content
      content.innerHTML = '';
      const title = document.createElement('div'); title.className = 'step-title'; title.textContent = steps[idx] ? steps[idx].textContent : `Step ${idx+1}`;
      content.appendChild(title);

      // determine which step we're on
      const stepLabel = steps[idx] && steps[idx].textContent ? steps[idx].textContent.toLowerCase() : '';
      if(stepLabel.indexOf('review') !== -1){
        // Enhanced review summary layout
        const cart = (window.__masalaCart && window.__masalaCart.getCart && window.__masalaCart.getCart()) || {items:[]};
        const list = document.createElement('div'); list.className = 'review-list';
        list.style.marginTop = '0.6rem';
        if(!cart.items.length) list.innerHTML = '<div class="muted">No items in your cart.</div>';
        else {
          list.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:1rem">
            <thead><tr style="font-weight:700;border-bottom:1px solid #eee"><th style="text-align:left;padding:0.4rem">Item</th><th style="text-align:right;padding:0.4rem">Qty</th><th style="text-align:right;padding:0.4rem">Price</th><th style="text-align:right;padding:0.4rem">Total</th></tr></thead>
            <tbody>
              ${cart.items.map(it=>`<tr><td style="padding:0.4rem">${it.name}</td><td style="text-align:right;padding:0.4rem">${it.qty}</td><td style="text-align:right;padding:0.4rem">₹${Math.round(it.price)}</td><td style="text-align:right;padding:0.4rem;font-weight:700">₹${Math.round((Number(it.price)||0)*(it.qty||1))}</td></tr>`).join('')}
            </tbody>
          </table>`;
        }
        content.appendChild(list);
        const subtotal = cart.items.reduce((s,i)=>s + (Number(i.price)||0) * (i.qty||1), 0);
        const tax = Math.round(subtotal * 0.05);
        const total = subtotal + tax;
        const sums = document.createElement('div'); sums.style.marginTop='1rem';
        sums.innerHTML = `<div style="font-size:1.1rem">Items total: <strong>₹${Math.round(subtotal)}</strong></div><div style="font-size:1.1rem">Estimated tax: <strong>₹${Math.round(tax)}</strong></div><div style="margin-top:0.6rem;font-size:1.2rem;font-weight:700">Total: <strong>₹${Math.round(total)}</strong></div>`;
        content.appendChild(sums);
        const proceed = document.createElement('div'); proceed.style.marginTop='1.2rem'; proceed.innerHTML = `<button id="toPaymentBtn" class="btn btn-primary">Proceed to Payment</button>`;
        content.appendChild(proceed);
        const toPayment = content.querySelector('#toPaymentBtn'); if(toPayment) toPayment.addEventListener('click', ()=>{ idx = Math.min(idx+1, steps.length-1); renderStepContent(); });
      } else if(stepLabel.indexOf('payment') !== -1){
        const cart = (window.__masalaCart && window.__masalaCart.getCart && window.__masalaCart.getCart()) || {items:[]};
        const subtotal = cart.items.reduce((s,i)=>s + (Number(i.price)||0) * (i.qty||1), 0);
        const tax = Math.round(subtotal * 0.05);
        const total = subtotal + tax;
        // Order summary printout
        const printBox = document.createElement('div'); printBox.className = 'checkout-payment-summary';
        printBox.innerHTML = `
          <h4 style="margin-bottom:0.6rem;font-size:1.2rem;font-weight:700">Order Summary</h4>
          <div id="printOrderSummary">
            <table style="width:100%;border-collapse:collapse;font-size:1rem">
              <thead><tr style="font-weight:700;border-bottom:1px solid #eee"><th style="text-align:left;padding:0.4rem">Item</th><th style="text-align:right;padding:0.4rem">Qty</th><th style="text-align:right;padding:0.4rem">Price</th><th style="text-align:right;padding:0.4rem">Total</th></tr></thead>
              <tbody>
                ${cart.items.map(it=>`<tr><td style="padding:0.4rem">${it.name}</td><td style="text-align:right;padding:0.4rem">${it.qty}</td><td style="text-align:right;padding:0.4rem">₹${Math.round(it.price)}</td><td style="text-align:right;padding:0.4rem;font-weight:700">₹${Math.round((Number(it.price)||0)*(it.qty||1))}</td></tr>`).join('')}
              </tbody>
            </table>
            <div style="margin-top:0.8rem;font-size:1.1rem">Tax: <strong>₹${Math.round(tax)}</strong></div>
            <div style="margin-top:0.4rem;font-size:1.2rem;font-weight:700">Final Total: <strong>₹${Math.round(total)}</strong></div>
            <div style="margin-top:0.4rem;font-size:1rem;color:#6b4226">Round-off: <strong>₹${Math.round(total)}</strong></div>
          </div>
          <div style="margin-top:0.8rem;display:flex;gap:0.6rem"><button id="printSummaryBtn" class="btn btn-outline">Print Summary</button><button id="exportPdfBtn" class="btn btn-outline">Export PDF</button></div>
        `;
        content.appendChild(printBox);
        // Print button logic
        const printBtn = content.querySelector('#printSummaryBtn');
        if(printBtn){
          printBtn.addEventListener('click', ()=>{
            const summary = content.querySelector('#printOrderSummary');
            if(!summary) return;
            // Hide everything except the summary, print, then restore
            const originalBody = document.body.innerHTML;
            const printHtml = `<div style='max-width:480px;margin:auto;padding:1.2rem;font-family:Poppins,sans-serif;'>${summary.innerHTML}</div>`;
            document.body.innerHTML = printHtml;
            window.print();
            // Restore after print (optional)
            setTimeout(()=>{ document.body.innerHTML = originalBody; }, 100);
          });
        }
        // PDF export button (optional, UI only)
        const pdfBtn = content.querySelector('#exportPdfBtn');
        if(pdfBtn){
          pdfBtn.addEventListener('click', ()=>{
            alert('PDF export feature coming soon!');
          });
        }
        // Payment button
        const box = document.createElement('div'); box.className = 'checkout-payment';
        box.innerHTML = `
          <div style="margin-top:0.6rem">Items total: <strong>₹${Math.round(subtotal)}</strong></div>
          <div>Estimated tax: <strong>₹${Math.round(tax)}</strong></div>
        `;
        content.appendChild(box);
        // wire demo pay button
        const payBtn = content.querySelector('#payNowBtn');
        if(payBtn){
          payBtn.addEventListener('click', async ()=>{
            payBtn.disabled = true; payBtn.textContent = 'Processing...';
            await new Promise(r=>setTimeout(r, 1100));
            try{
              const current = (window.__masalaCart && window.__masalaCart.getCart && window.__masalaCart.getCart()) || {items:[]};
              const names = current.items.map(i=>i.name);
              names.forEach(n=>{ try{ window.__masalaCart.removeItem(n); }catch(e){} });
            }catch(e){}
            if(window.__masalaRenderCartPage) window.__masalaRenderCartPage();
            content.innerHTML = '<div class="payment-success" style="padding:1rem"><h3>Payment successful</h3><p>Your payment was processed. Thank you for your order.</p></div>';
            setTimeout(()=>{ if(modal) modal.setAttribute('aria-hidden','true'); }, 1300);
          });
        }
      } else {
        // Default simple content for other steps
        const info = document.createElement('div'); info.className = 'checkout-info';
        info.style.padding = '0.6rem 0';
        info.textContent = `Step: ${steps[idx] ? steps[idx].textContent : (idx+1)}`;
        content.appendChild(info);
      }
      // mark active step visually
      steps.forEach((s,i)=> s.classList.toggle('current', i===idx));
    }

    function show(){ if(!modal) return; modal.setAttribute('aria-hidden', 'false'); renderStepContent(); }
    function hide(){ if(!modal) return; modal.setAttribute('aria-hidden','true'); }

    openBtn && openBtn.addEventListener('click', ()=>{ idx=0; show(); });
    mobileBtn && mobileBtn.addEventListener('click', ()=>{ idx=0; show(); });
    close && close.addEventListener('click', hide);
    prev && prev.addEventListener('click', ()=>{ if(idx>0){ idx--; renderStepContent(); } });
    next && next.addEventListener('click', ()=>{ if(idx<steps.length-1){ idx++; renderStepContent(); } else { /* final submit handled in payment or review step */ hide(); } });
  }

  document.addEventListener('DOMContentLoaded', ()=>{ renderCartPage(); initCoupon(); initCheckoutModal(); });
  // expose for manual refreshes
  window.__masalaRenderCartPage = renderCartPage;
})();
