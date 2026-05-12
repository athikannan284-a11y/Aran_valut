// Globals
let currentScreen = 'screen-splash';
let docs = [...mockDocuments]; // From data.js
let modalCallback = null;

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  // Simulate splash screen delay
  setTimeout(() => {
    goScreen('screen-onboard');
  }, 4500);

  // Initialize docs list
  renderDocs(docs);
});

// --- NAVIGATION ---
function goScreen(screenId) {
  document.getElementById(currentScreen).classList.remove('active');
  document.getElementById(screenId).classList.add('active');
  currentScreen = screenId;

  // Bottom Nav Highlighting
  if (screenId === 'screen-home' || screenId === 'screen-search' || screenId === 'screen-profile') {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    if (screenId === 'screen-home') document.querySelectorAll('.nav-btn')[0].classList.add('active');
    if (screenId === 'screen-search') document.querySelectorAll('.nav-btn')[1].classList.add('active');
    if (screenId === 'screen-profile') document.querySelectorAll('.nav-btn')[4].classList.add('active');
  }

  // Focus search input when going to search screen
  if(screenId === 'screen-search') {
    setTimeout(() => {
      document.getElementById('search-input').focus();
    }, 400);
  }
}

// --- ONBOARDING ---
let currentSlide = 1;
function nextSlide() {
  if (currentSlide === 3) {
    goOTP();
    return;
  }
  document.getElementById(`ob${currentSlide}`).classList.remove('active');
  document.getElementById(`ob${currentSlide}`).classList.add('exit');
  document.getElementById(`dot${currentSlide-1}`).classList.remove('active');
  
  currentSlide++;
  
  document.getElementById(`ob${currentSlide}`).classList.add('active');
  document.getElementById(`dot${currentSlide-1}`).classList.add('active');
  
  if (currentSlide === 3) {
    document.getElementById('btn-next').innerText = "Continue";
  }
}

// --- AUTHENTICATION ---
function goOTP() {
  goScreen('screen-otp');
  setTimeout(() => { document.getElementById('phone-input').focus(); }, 400);
}

function validatePhone() {
  const input = document.getElementById('phone-input');
  const btn = document.getElementById('btn-send-otp');
  input.value = input.value.replace(/[^0-9]/g, ''); // Numbers only
  // Enable after 6+ digits (demo friendly; real app needs 10)
  if (input.value.length >= 6) {
    btn.disabled = false;
  } else {
    btn.disabled = true;
  }
}

let otpTimerInterval;
function sendOTP() {
  const phone = document.getElementById('phone-input').value;
  if (!phone || phone.length < 6) {
    showToast('⚠️ Please enter a valid mobile number');
    return;
  }

  // Show sending state
  const sendBtn = document.getElementById('btn-send-otp');
  sendBtn.innerText = 'Sending OTP...';
  sendBtn.disabled = true;

  setTimeout(() => {
    sendBtn.innerText = 'Send OTP';
    sendBtn.disabled = false;

    document.getElementById('phone-display').innerText = '+91 ' + phone;
    document.getElementById('auth-phone-step').classList.add('hidden');
    document.getElementById('auth-otp-step').classList.remove('hidden');

    // Show OTP sent toast
    showToast('📱 OTP sent to +91 ' + phone);

    // Setup OTP input navigation
    const otpInputs = document.querySelectorAll('.otp-box');
    otpInputs.forEach(inp => { inp.value = ''; });
    otpInputs.forEach((input, index) => {
      // Remove old listeners by cloning
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
    });

    const freshInputs = document.querySelectorAll('.otp-box');
    freshInputs.forEach((input, index) => {
      input.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length === 1) {
          if (index < 5) freshInputs[index + 1].focus();
        }
      });
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.value === '') {
          if (index > 0) freshInputs[index - 1].focus();
        }
      });
    });

    // Auto-focus first box
    setTimeout(() => { freshInputs[0].focus(); }, 300);

    // 🎯 AUTO-FILL demo OTP after 2s so user sees it work
    setTimeout(() => {
      const demoOTP = '1 2 3 4 5 6'.split(' ');
      const boxes = document.querySelectorAll('.otp-box');
      demoOTP.forEach((digit, i) => {
        setTimeout(() => {
          boxes[i].value = digit;
          boxes[i].classList.add('otp-filled');
          if (i < 5) boxes[i + 1].focus();
        }, i * 120);
      });
      setTimeout(() => {
        showToast('✅ Demo OTP auto-filled: 123456');
      }, 800);
    }, 1500);

    // Countdown timer
    let time = 30;
    document.getElementById('timer-count').innerText = time;
    clearInterval(otpTimerInterval);
    otpTimerInterval = setInterval(() => {
      time--;
      document.getElementById('timer-count').innerText = time;
      if (time <= 0) {
        clearInterval(otpTimerInterval);
        document.getElementById('otp-timer').innerHTML = '<span class="link" onclick="resendOTP()">Resend OTP</span>';
      }
    }, 1000);
  }, 1200);
}

function resendOTP() {
  const boxes = document.querySelectorAll('.otp-box');
  boxes.forEach(b => { b.value = ''; });
  document.getElementById('otp-timer').innerHTML = 'Resend OTP in <span id="timer-count">30</span>s';
  sendOTPTimer();
  showToast('📱 OTP resent!');
}

function sendOTPTimer() {
  let time = 30;
  clearInterval(otpTimerInterval);
  otpTimerInterval = setInterval(() => {
    time--;
    const el = document.getElementById('timer-count');
    if (el) el.innerText = time;
    if (time <= 0) {
      clearInterval(otpTimerInterval);
      document.getElementById('otp-timer').innerHTML = '<span class="link" onclick="resendOTP()">Resend OTP</span>';
    }
  }, 1000);
}

function verifyOTP() {
  const boxes = document.querySelectorAll('.otp-box');
  const enteredOTP = Array.from(boxes).map(b => b.value).join('');

  if (enteredOTP.length < 6) {
    showToast('⚠️ Please enter the 6-digit OTP');
    // Shake animation on empty boxes
    boxes.forEach(b => {
      if (!b.value) {
        b.classList.add('otp-error');
        setTimeout(() => b.classList.remove('otp-error'), 600);
      }
    });
    return;
  }

  const btn = document.getElementById('btn-verify-otp');
  const originalText = btn.innerText;
  btn.innerText = '🔐 Verifying Device...';
  btn.disabled = true;

  setTimeout(() => {
    showToast('📱 New device detected. Logging out other sessions...');
    setTimeout(() => {
      btn.innerText = originalText;
      btn.disabled = false;
      goScreen('screen-home');
      showToast('✅ அரண் Verified: Single device active.');
    }, 1500);
  }, 1000);
}

function backToPhone() {
  document.getElementById('auth-otp-step').classList.add('hidden');
  document.getElementById('auth-phone-step').classList.remove('hidden');
}

function logout() {
  showModal('Logout', 'Are you sure you want to log out of VaultX?', () => {
    goScreen('screen-splash');
    setTimeout(() => { goOTP(); }, 1000);
    showToast('🚪 Logged out successfully');
  });
}

// --- DASHBOARD ---
function filterCat(catId) {
  document.querySelectorAll('.cat-chip').forEach(chip => chip.classList.remove('active'));
  event.target.classList.add('active');
  
  if (catId === 'all') {
    renderDocs(docs);
  } else {
    const filtered = docs.filter(d => d.category === catId);
    renderDocs(filtered);
  }
}

function renderDocs(dataList, containerId = 'docs-list') {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  if (dataList.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">No documents found.</div>`;
    return;
  }

  dataList.forEach(doc => {
    const docHTML = `
      <div class="doc-item" onclick="openDoc('${doc.id}')">
        <div class="doc-icon">${doc.icon}</div>
        <div class="doc-details">
          <div class="doc-name">${doc.name}</div>
          <div class="doc-meta">
            <span>${doc.catName}</span>
            <span>·</span>
            <span>${doc.date}</span>
          </div>
        </div>
        <div class="doc-action">›</div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', docHTML);
  });
}

function showShare() {
  showModal('Family Sharing', 'Invite family members to access your secure vault?', () => {
    showToast('🔗 Invitation link copied');
  });
}

// --- UPLOAD FLOW ---
function triggerUpload() {
  document.getElementById('file-input').click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('upload-zone').classList.add('hidden');
  document.querySelector('.upload-or').classList.add('hidden');
  document.querySelector('.upload-methods').classList.add('hidden');
  document.getElementById('upload-preview').classList.remove('hidden');
  
  document.getElementById('preview-filename').innerText = file.name;
  
  const imgPreview = document.getElementById('preview-img');
  const pdfPreview = document.getElementById('preview-pdf');

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      imgPreview.src = e.target.result;
      imgPreview.style.display = 'block';
      pdfPreview.classList.add('hidden');
    }
    reader.readAsDataURL(file);
    simulateAI();
  } else {
    imgPreview.style.display = 'none';
    pdfPreview.classList.remove('hidden');
    simulateAI();
  }
}

function simulateAI() {
  const aiResult = document.getElementById('ai-result');
  const aiTags = document.getElementById('ai-tags');
  
  aiResult.innerText = "Scanning document...";
  aiTags.innerHTML = '';
  
  setTimeout(() => {
    aiResult.innerText = "Aadhaar Card Detected";
    aiTags.innerHTML = `
      <div class="ai-tag">99.8% Match</div>
      <div class="ai-tag">Govt ID</div>
      <div class="ai-tag">AATHI KUMAR</div>
    `;
    
    document.getElementById('doc-name').value = "My Aadhaar Card";
    document.getElementById('doc-cat').selectedIndex = 0;
  }, 2000);
}

function clearUpload() {
  document.getElementById('upload-zone').classList.remove('hidden');
  document.querySelector('.upload-or').classList.remove('hidden');
  document.querySelector('.upload-methods').classList.remove('hidden');
  document.getElementById('upload-preview').classList.add('hidden');
  document.getElementById('file-input').value = "";
}

function saveDocument() {
  showToast('🔒 Document encrypted and saved!');
  
  // Simulate adding to list
  const name = document.getElementById('doc-name').value || "New Document";
  docs.unshift({
    id: 'doc_new_' + Date.now(),
    name: name,
    type: 'Uploaded',
    category: 'gov',
    catName: '🏛️ Govt IDs',
    date: 'Just now',
    expiry: 'No Expiry',
    icon: '📄'
  });
  
  renderDocs(docs);
  clearUpload();
  goScreen('screen-home');
}

// --- NEURAL SCANNER ---
function startNeuralScan() {
  const viewport = document.getElementById('scan-viewport');
  const nodesContainer = document.getElementById('neural-nodes');
  const line = document.getElementById('scan-line');
  
  viewport.classList.add('active');
  line.classList.add('scanning');
  nodesContainer.innerHTML = '';
  
  // Create neural nodes effect
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const node = document.createElement('div');
      node.className = 'neural-node';
      node.style.left = Math.random() * 100 + '%';
      node.style.top = Math.random() * 100 + '%';
      nodesContainer.appendChild(node);
      
      // Randomly link to another node
      if (nodesContainer.children.length > 1) {
        const link = document.createElement('div');
        link.className = 'neural-link';
        link.style.left = node.style.left;
        link.style.top = node.style.top;
        link.style.width = Math.random() * 100 + 'px';
        link.style.transform = `rotate(${Math.random() * 360}deg)`;
        nodesContainer.appendChild(link);
      }
    }, i * 150);
  }
  
  setTimeout(() => {
    line.classList.remove('scanning');
    viewport.classList.remove('active');
    document.getElementById('scan-result').classList.remove('hidden');
    showToast('🧠 Neural analysis complete');
  }, 3500);
}

function saveScanResult() {
  showToast('🛡️ Scan saved to அரண்!');
  docs.unshift({
    id: 'doc_new_' + Date.now(),
    name: 'Neural Scanned Doc',
    type: 'Identity',
    category: 'gov',
    catName: '🏛️ Govt IDs',
    date: 'Just now',
    expiry: 'No Expiry',
    icon: '🪪'
  });
  renderDocs(docs);
  
  document.getElementById('scan-result').classList.add('hidden');
  goScreen('screen-home');
}

// --- SEARCH ---
function quickSearch(term) {
  document.getElementById('search-input').value = term;
  doSearch(term);
}

function doSearch(val) {
  const term = val.toLowerCase();
  const container = document.getElementById('search-results');
  
  if (term.length === 0) {
    container.innerHTML = `
      <div class="search-empty">
        <span style="font-size:48px">🔍</span>
        <p>Search your documents instantly</p>
      </div>`;
    return;
  }
  
  const filtered = docs.filter(d => 
    d.name.toLowerCase().includes(term) || 
    d.type.toLowerCase().includes(term) ||
    d.catName.toLowerCase().includes(term)
  );
  
  if (filtered.length > 0) {
    renderDocs(filtered, 'search-results');
  } else {
    container.innerHTML = `
      <div class="search-empty">
        <span style="font-size:48px">🤖</span>
        <p>No documents found for "${val}"</p>
      </div>`;
  }
}

// --- DOCUMENT VIEWER ---
function openDoc(id) {
  const doc = docs.find(d => d.id === id);
  if (!doc) return;
  
  document.getElementById('viewer-doc-name').innerText = doc.name;
  document.getElementById('viewer-doc-icon').innerText = doc.icon;
  
  document.getElementById('vm-type').innerText = doc.type;
  document.getElementById('vm-cat').innerText = doc.catName;
  document.getElementById('vm-date').innerText = doc.date;
  document.getElementById('vm-expiry').innerText = doc.expiry;
  
  goScreen('screen-viewer');
}

function showDocOptions() {
  showModal('Document Options', 'Update metadata, set expiry reminder, or move to hidden vault.', () => {
    showToast('Options applied');
  });
}

function confirmDelete() {
  showModal('Delete Document', 'Are you sure you want to permanently delete this document? This action cannot be undone.', () => {
    showToast('🗑️ Document deleted');
    goScreen('screen-home');
  });
}

// --- SETTINGS / UTILS ---
function toggleThis(element) {
  element.classList.toggle('active');
  if(element.classList.contains('active')) {
    showToast('Feature enabled');
  } else {
    showToast('Feature disabled');
  }
}

// --- TOAST NOTIFICATIONS ---
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// --- MODAL SYSTEM ---
function showModal(title, msg, onConfirm) {
  document.getElementById('modal-title').innerText = title;
  document.getElementById('modal-msg').innerText = msg;
  
  if (title.toLowerCase().includes('delete') || title.toLowerCase().includes('logout')) {
    document.getElementById('modal-icon').innerText = '⚠️';
    document.getElementById('modal-confirm').style.background = 'linear-gradient(135deg, #ef233c, #d90429)';
  } else {
    document.getElementById('modal-icon').innerText = 'ℹ️';
    document.getElementById('modal-confirm').style.background = 'linear-gradient(135deg, #4361ee, #7209b7)';
  }

  modalCallback = onConfirm;
  document.getElementById('modal-overlay').classList.add('show');
  
  document.getElementById('modal-confirm').onclick = function() {
    closeModal();
    if(modalCallback) modalCallback();
  };
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
  modalCallback = null;
}
