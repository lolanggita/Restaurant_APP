
const API_BASE = '/auth';

function showTab(tab){
  document.getElementById('loginForm').style.display = tab==='login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab==='register' ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach(btn=>btn.classList.remove('active'));
  document.querySelector(`.tab-btn[onclick="showTab('${tab}')"]`).classList.add('active');
}

const token = localStorage.getItem('token');
if (token) { window.location.href = '/'; }

document.getElementById('loginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const res = await fetch(`${API_BASE}/login`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if(res.ok){
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/';
  }else{
    document.getElementById('loginMessage').textContent = data.error || 'Login gagal';
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const body = {
    name: document.getElementById('registerName').value,
    email: document.getElementById('registerEmail').value,
    password: document.getElementById('registerPassword').value,
    role: document.getElementById('registerRole').value
  };
  const res = await fetch(`${API_BASE}/register`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  const data = await res.json();
  document.getElementById('registerMessage').textContent = res.ok ? 'Registrasi berhasil. Silakan login.' : (data.error || 'Registrasi gagal');
});
