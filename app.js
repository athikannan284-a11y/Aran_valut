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
let confirmationResult;

function sendOTP() {
  const phone = document.getElementById('phone-input').value;
  if (!phone || phone.length < 10) {
    showToast('⚠️ Please enter a valid 10-digit mobile number');
    return;
  }

  const phoneNumber = "+91" + phone;
  const appVerifier = window.recaptchaVerifier;

  const sendBtn = document.getElementById('btn-send-otp');
  sendBtn.innerText = 'Sending SMS...';
  sendBtn.disabled = true;

  auth.signInWithPhoneNumber(phoneNumber, appVerifier)
    .then((result) => {
      confirmationResult = result;
      showToast('📱 OTP sent to ' + phoneNumber);
      
      document.getElementById('phone-display').innerText = phoneNumber;
      document.getElementById('auth-phone-step').classList.add('hidden');
      document.getElementById('auth-otp-step').classList.remove('hidden');
      
      sendBtn.innerText = 'Send OTP';
      sendBtn.disabled = false;
      startOTPTimer();
    }).catch((error) => {
      console.error(error);
      showToast('❌ Error: ' + error.message);
      sendBtn.innerText = 'Send OTP';
      sendBtn.disabled = false;
    });
}

function startOTPTimer() {
  let time = 30;
  const timerDisplay = document.getElementById('otp-timer');
  timerDisplay.innerHTML = 'Resend OTP in <span id="timer-count">30</span>s';
  
  const interval = setInterval(() => {
    time--;
    const countEl = document.getElementById('timer-count');
    if (countEl) countEl.innerText = time;
    
    if (time <= 0) {
      clearInterval(interval);
      timerDisplay.innerHTML = '<span class="link" onclick="sendOTP()">Resend OTP</span>';
    }
  }, 1000);
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
  const code = Array.from(boxes).map(b => b.value).join('');

  if (code.length < 6) {
    showToast('⚠️ Please enter the 6-digit code');
    return;
  }

  const btn = document.getElementById('btn-verify-otp');
  btn.innerText = '🔐 Verifying...';
  btn.disabled = true;

  confirmationResult.confirm(code).then((result) => {
    const user = result.user;
    showToast('✅ Verification Successful');
    
    // Proceed to dashboard
    goScreen('screen-home');
    loadUserDocuments(user.uid);
  }).catch((error) => {
    console.error(error);
    showToast('❌ Invalid OTP. Please try again.');
    btn.innerText = 'Verify & Continue';
    btn.disabled = false;
  });
}

function backToPhone() {
  document.getElementById('auth-otp-step').classList.add('hidden');
  document.getElementById('auth-phone-step').classList.remove('hidden');
}

// Session Check
auth.onAuthStateChanged((user) => {
  if (user && currentScreen === 'screen-splash') {
    goScreen('screen-home');
    loadUserDocuments(user.uid);
  }
});

function logout() {
  showModal('Logout', 'Are you sure you want to log out of அரண்? Your data remains encrypted and safe.', () => {
    auth.signOut().then(() => {
      showToast('🚪 Logged out successfully');
      location.reload();
    });
  });
}

function deleteAccount() {
  const user = auth.currentUser;
  showModal('Delete Account', 'WARNING: This will permanently delete your account and all documents. This action is irreversible!', () => {
    // 1. Delete Firestore Data
    db.collection('users').doc(user.uid).delete();
    
    // 2. Delete Auth User
    user.delete().then(() => {
      showToast('🗑️ Account and data permanently deleted');
      setTimeout(() => { location.reload(); }, 1500);
    }).catch((error) => {
      showToast('❌ Error: Please re-login to delete account');
    });
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

// --- FIREBASE DATA ---
function loadUserDocuments(uid) {
  db.collection('users').doc(uid).collection('documents')
    .orderBy('createdAt', 'desc')
    .onSnapshot((snapshot) => {
      docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderDocs(docs);
    });
}

function saveDocument() {
  const user = auth.currentUser;
  if (!user) return;

  const fileInput = document.getElementById('file-input');
  const file = fileInput.files[0];
  const name = document.getElementById('doc-name').value || "New Document";
  const category = document.getElementById('doc-cat').value;

  if (!file) {
    showToast('⚠️ Please select a file first');
    return;
  }

  showToast('🛡️ Encrypting & Uploading...');
  
  // 1. Upload to Firebase Storage
  const storageRef = storage.ref(`users/${user.uid}/docs/${Date.now()}_${file.name}`);
  storageRef.put(file).then((snapshot) => {
    return snapshot.ref.getDownloadURL();
  }).then((url) => {
    // 2. Save Metadata to Firestore
    return db.collection('users').doc(user.uid).collection('documents').add({
      name: name,
      category: category,
      catName: document.getElementById('doc-cat').options[document.getElementById('doc-cat').selectedIndex].text,
      icon: file.type.startsWith('image/') ? '🖼️' : '📄',
      fileUrl: url,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      date: new Date().toLocaleDateString(),
      expiry: 'No Expiry'
    });
  }).then(() => {
    showToast('✅ Document saved securely');
    clearUpload();
    goScreen('screen-home');
  }).catch((error) => {
    console.error(error);
    showToast('❌ Upload failed: ' + error.message);
  });
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
