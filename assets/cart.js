// Cart page specific script - advanced version
document.addEventListener('DOMContentLoaded', function(){
  // Quantity validation
  const MAX_QTY = 10;
  const MIN_QTY = 1;

  function validateQty(qty) {
    return Math.max(MIN_QTY, Math.min(MAX_QTY, qty));
  }

  // Show loading state
  function setLoading(element, loading) {
    if (loading) {
      element.classList.add('loading');
    } else {
      element.classList.remove('loading');
    }
  }

  // Show error message
  function showError(element, message) {
    let errorEl = element.querySelector('.error-msg');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'error-msg';
      element.appendChild(errorEl);
    }
    errorEl.textContent = message;
    setTimeout(() => errorEl.remove(), 3000);
  }

  // Shipping calculator
  function updateShipping() {
    const select = document.getElementById('shippingSelect');
    const costEl = document.getElementById('shippingCost');
    if (!select || !costEl) return;
    const cost = select.value === 'standard' ? 50 : select.value === 'express' ? 100 : 0;
    costEl.textContent = `₹${cost}`;
    // Update total
    const subtotal = (window.__masalaCart && window.__masalaCart.getCart()) ? window.__masalaCart.getCart().items.reduce((s,i)=>s + i.price * i.qty,0) : 0;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax + cost;
    document.getElementById('pageTotal').textContent = total;
  }

  function renderPage(){
    const cart = (window.__masalaCart && window.__masalaCart.getCart()) || {items:[]};
    const itemsEl = document.getElementById('cartItems'); itemsEl.innerHTML = '';
    if(!cart.items.length){ itemsEl.innerHTML = '<div class="muted">Your cart is empty. Continue shopping to add items.</div>'; document.getElementById('pageSubtotal').textContent='0'; document.getElementById('pageTax').textContent='0'; document.getElementById('pageTotal').textContent='0'; return; }
    cart.items.forEach(it=>{
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="left" style="display:flex;gap:0.8rem;align-items:center;flex:1">
          <img src="${it.image||'assets/images/masala_chai.jpg'}" alt="${it.name}" style="width:96px;height:72px;object-fit:cover;border-radius:6px">
          <div class="details">
            <h4 class="title" style="margin:0">${it.name}</h4>
            <div class="variant">₹${it.price} each</div>
            <div class="item-note">
              <textarea placeholder="Add a note (e.g., extra spice)" maxlength="100">${it.note || ''}</textarea>
            </div>
          </div>
        </div>
        <div class="right" style="display:flex;flex-direction:column;align-items:flex-end;gap:0.6rem">
          <div class="actions" style="display:flex;gap:0.5rem;align-items:center">
            <button class="page-qty-minus" data-name="${it.name}">-</button>
            <span class="page-qty">${it.qty}</span>
            <button class="page-qty-plus" data-name="${it.name}">+</button>
            <button class="page-remove" data-name="${it.name}">Remove</button>
          </div>
          <div class="price" style="font-weight:700">₹${(it.price * it.qty).toFixed(0)}</div>
        </div>
      `;
      itemsEl.appendChild(row);
    });

    // summary
    const subtotal = cart.items.reduce((s,i)=>s + i.price * i.qty,0);
    const tax = Math.round(subtotal * 0.05);
    const shipping = parseInt(document.getElementById('shippingCost')?.textContent.replace('₹','') || 0);
    const total = subtotal + tax + shipping;
    document.getElementById('pageSubtotal').textContent = subtotal;
    document.getElementById('pageTax').textContent = tax;
    document.getElementById('pageTotal').textContent = total;

    // wire buttons (qty and remove) inside the updated cart-item structure
    itemsEl.querySelectorAll('.page-qty-plus').forEach(b=>b.addEventListener('click',()=>{ const name = b.dataset.name; const current = window.__masalaCart.getCart().items.find(i=>i.name===name); const newQty = validateQty((current.qty||1) + 1); window.__masalaCart.updateQty(name, newQty); renderPage(); renderMiniCart(); }));
    itemsEl.querySelectorAll('.page-qty-minus').forEach(b=>b.addEventListener('click',()=>{ const name = b.dataset.name; const current = window.__masalaCart.getCart().items.find(i=>i.name===name); const newQty = validateQty((current.qty||1) - 1); window.__masalaCart.updateQty(name, newQty); renderPage(); renderMiniCart(); }));
    itemsEl.querySelectorAll('.page-remove').forEach(b=>b.addEventListener('click',()=>{ window.__masalaCart.removeItem(b.dataset.name); renderPage(); renderMiniCart(); }));

    // wire note updates
    itemsEl.querySelectorAll('.item-note textarea').forEach(ta=>{
      ta.addEventListener('input', (e)=>{
        const name = e.target.closest('.cart-item').querySelector('.title').textContent;
        const item = window.__masalaCart.getCart().items.find(i=>i.name===name);
        if (item) item.note = e.target.value;
        // Save to localStorage or something
        const cart = window.__masalaCart.getCart();
        try { localStorage.setItem('masalaandmug_cart_v1', JSON.stringify(cart)); } catch(e){}
      });
    });
  }
  renderPage();

  // coupon apply uses demo backend if running
  const applyBtn = document.getElementById('applyCoupon');
  if(applyBtn){
    applyBtn.addEventListener('click', async ()=>{
      const code = document.getElementById('couponCode').value.trim();
      if(!code) return showError(applyBtn.closest('.coupon-section'), 'Enter a coupon code');
      setLoading(applyBtn, true);
      const subtotal = (window.__masalaCart && window.__masalaCart.getCart()) ? window.__masalaCart.getCart().items.reduce((s,i)=>s + i.price * i.qty,0) : 0;
      try{
        const res = await fetch('/api/validate-coupon', { method: 'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ code, subtotal }) });
        const j = await res.json();
        const out = document.getElementById('couponResult');
        if(j.ok){ out.textContent = `Applied ${j.coupon}: -₹${j.discount} (${j.description})`; }
        else { out.textContent = j.message || 'Invalid coupon'; showError(applyBtn.closest('.coupon-section'), j.message || 'Invalid coupon'); }
        renderPage();
      }catch(e){ showError(applyBtn.closest('.coupon-section'), 'Coupon service unavailable'); }
      setLoading(applyBtn, false);
    });
  }

  // mobile sticky bar: scroll to the order summary instead of duplicating CTA
  const mobileBtn = document.getElementById('mobileCheckoutBtn');
  if(mobileBtn){
    mobileBtn.addEventListener('click', ()=>{
      const summary = document.getElementById('cartSummary');
      if(summary){ summary.scrollIntoView({behavior:'smooth', block:'center'}); }
    });
  }

  // saved for later: fetch saved list from demo server under key 'demo-user'
  async function loadSaved(){
    setLoading(document.getElementById('savedForLater'), true);
    try{
      const r = await fetch('/api/saved/demo-user');
      const j = await r.json();
      const el = document.getElementById('savedList');
      const container = document.getElementById('savedForLater');
      if(!el) return;
      el.innerHTML = '';
      if(j.saved && j.saved.length){
        // show section when there are items
        if(container) container.style.display = '';
        j.saved.forEach(it=>{
          const d = document.createElement('div'); d.style.display='flex'; d.style.justifyContent='space-between'; d.style.padding='0.4rem 0';
          d.innerHTML = `<div>${it.name} • ₹${it.price}</div><div><button class="restore" data-name="${it.name}">Restore</button></div>`;
          el.appendChild(d);
        });
        el.querySelectorAll('.restore').forEach(b=>b.addEventListener('click', ()=>{
          const name = b.dataset.name;
          const saved = j.saved.find(x=>x.name===name);
          if(saved){ window.__masalaCart.addItem(saved); alert('Restored to cart (demo)'); loadSaved(); }
        }));
      } else {
        // hide section when empty to avoid empty whitespace
        if(container) container.style.display = 'none';
      }
    }catch(e){ console.warn(e); const container = document.getElementById('savedForLater'); if(container) container.style.display = 'none'; }
    setLoading(document.getElementById('savedForLater'), false);
  }
  loadSaved();

  // Add shipping calculator
  const summary = document.getElementById('cartSummary');
  if (summary) {
    const shippingDiv = document.createElement('div');
    shippingDiv.className = 'shipping-calculator';
    shippingDiv.innerHTML = `
      <label for="shippingSelect">Shipping Method</label>
      <select id="shippingSelect">
        <option value="free">Free Shipping (₹0)</option>
        <option value="standard">Standard (₹50)</option>
        <option value="express">Express (₹100)</option>
      </select>
      <div class="shipping-cost" id="shippingCost">₹0</div>
    `;
    summary.insertBefore(shippingDiv, summary.querySelector('.gift'));
    document.getElementById('shippingSelect').addEventListener('change', updateShipping);
  }
});
