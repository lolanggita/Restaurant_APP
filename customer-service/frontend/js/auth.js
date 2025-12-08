const API_BASE = '/api/auth'; // Fixed: Add /api prefix to match your server routes

function showTab(tab){
  document.getElementById('loginForm').style.display = tab==='login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab==='register' ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach(btn=>btn.classList.remove('active'));
  document.querySelector(`.tab-btn[onclick="showTab('${tab}')"]`).classList.add('active');
}

const token = localStorage.getItem('token');
if (token) { 
  window.location.href = '/'; // Redirect to index.html (menu/dashboard)
}

document.getElementById('loginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const res = await fetch(`${API_BASE}/login`, {
    method:'POST', 
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if(res.ok){
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/'; // Redirect to index.html (menu/dashboard)
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
    method:'POST', 
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  const data = await res.json();
  
  if(res.ok){
    // Fixed: Show success message AND redirect after a short delay
    document.getElementById('registerMessage').textContent = 'Registrasi berhasil. Redirecting...';
    document.getElementById('registerMessage').className = 'message success'; // Optional: add success styling
    
    // Wait a bit then redirect to login
    setTimeout(() => {
      // Auto-login after successful registration
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      
      fetch(`${API_BASE}/login`, {
        method:'POST', 
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      })
      .then(loginRes => {
        return loginRes.json().then(loginData => {
          if(loginRes.ok){
            localStorage.setItem('token', loginData.token);
            localStorage.setItem('user', JSON.stringify(loginData.user));
            window.location.href = '/'; // Redirect to index.html (menu/dashboard)
          } else {
            window.location.href = '/login.html'; // Go back to login if auto-login fails
          }
        });
      })
      .catch(() => {
        window.location.href = '/login.html'; // Fallback to login
      });
    }, 1500);
  } else {
    document.getElementById('registerMessage').textContent = data.error || 'Registrasi gagal';
    document.getElementById('registerMessage').className = 'message error'; // Optional: add error styling
  }
});