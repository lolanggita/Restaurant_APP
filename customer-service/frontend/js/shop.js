
const API = {
  menus: '/browse/restaurants/1/menus',
  order: '/api/orders'
};

const rupiah = (v) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR'}).format(v||0);

const state = { cart: [] };

function saveCart(){ localStorage.setItem('cart', JSON.stringify(state.cart)); }
function loadCart(){ try{ state.cart = JSON.parse(localStorage.getItem('cart')) || []; }catch{ state.cart=[]; } }

function addToCart(item){
  const found = state.cart.find(x=>x.menu_id===item.menu_id);
  if(found){ found.qty += 1; } else { state.cart.push({...item, qty:1}); }
  saveCart(); renderCart();
}

function updateQty(id, delta){
  const it = state.cart.find(x=>x.menu_id===id);
  if(!it) return;
  it.qty += delta;
  if(it.qty <= 0){ state.cart = state.cart.filter(x=>x.menu_id!==id); }
  saveCart(); renderCart();
}

function removeItem(id){ state.cart = state.cart.filter(x=>x.menu_id!==id); saveCart(); renderCart(); }
function cartTotal(){ return state.cart.reduce((a,b)=>a + (b.price*b.qty), 0); }

function renderCart(){
  const root = document.getElementById('cartItems');
  if(state.cart.length===0){
    root.innerHTML = '<div class="loading">Keranjang kosong</div>';
  } else {
    root.innerHTML = state.cart.map(it=>`
      <div class="cart-item">
        <div style="flex:1">
          <div><b>${it.name}</b></div>
          <div class="price">${rupiah(it.price)}</div>
        </div>
        <div class="qty-box">
          <button onclick="updateQty(${it.menu_id},-1)">-</button>
          <span>${it.qty}</span>
          <button onclick="updateQty(${it.menu_id},1)">+</button>
        </div>
        <div>${rupiah(it.price*it.qty)}</div>
        <button class="btn btn-secondary" onclick="removeItem(${it.menu_id})">Hapus</button>
      </div>
    `).join('');
  }
  document.getElementById('cartTotal').textContent = rupiah(cartTotal());
}

async function loadMenus(){
  try {
    const res = await fetch(API.menus);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    const root = document.getElementById('menuList');
    
    if (!Array.isArray(data) || data.length === 0) {
      root.innerHTML = '<div class="loading">Tidak ada menu tersedia</div>';
      return;
    }
    
    root.innerHTML = data.map(m=>`
      <div class="card">
        <div class="card-body">
          <h3>${m.name}</h3>
          <div class="price">${rupiah(m.price)}</div>
          <small>Stok: ${m.stock}</small>
          <div style="margin-top:10px">
            <button class="btn btn-primary" data-menu-id="${m.id}" data-menu-name="${m.name.replace(/"/g, '&quot;')}" data-menu-price="${m.price}">+ Keranjang</button>
          </div>
        </div>
      </div>
    `).join('');
    
    // Add event listeners to all buttons
    root.querySelectorAll('button[data-menu-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = {
          menu_id: parseInt(btn.getAttribute('data-menu-id')),
          name: btn.getAttribute('data-menu-name'),
          price: parseFloat(btn.getAttribute('data-menu-price'))
        };
        addToCart(item);
      });
    });
  } catch (error) {
    console.error('Error loading menus:', error);
    const root = document.getElementById('menuList');
    root.innerHTML = '<div class="loading">Gagal memuat menu. Pastikan provider service berjalan di port 4001.</div>';
  }
}

async function checkout(){
  const msg = document.getElementById('cartMsg'); msg.textContent='';
  const token = localStorage.getItem('token');
  if(!token){ location.href='/login.html'; return; }
  if(state.cart.length===0){ msg.textContent='Keranjang kosong.'; return; }
  try{
    const payload = { items: state.cart.map(it=>({ menuId: it.menu_id, qty: it.qty })) };
    const res = await fetch(API.order,{method:'POST',headers:{'Content-Type':'application/json', Authorization: `Bearer ${token}`},body:JSON.stringify(payload)});
    const out = await res.json();
    if(!res.ok){ msg.textContent = (out?.detail?.error||out?.error||'Gagal checkout'); return; }
    state.cart = []; saveCart(); renderCart();
    msg.textContent = `Sukses! Order #${out.id} total ${rupiah(out.total)}.`;
    setTimeout(()=> location.href='/orders.html', 700);
  }catch(e){ msg.textContent = 'Gagal menghubungi server.'; }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const token = localStorage.getItem('token');
  if(!token){ location.href='/login.html'; return; }
  loadCart(); renderCart(); loadMenus();
  document.getElementById('checkoutBtn').addEventListener('click', checkout);
});
