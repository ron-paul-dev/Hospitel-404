// public/js/comments.js
// Clinician Comments — connected to Node.js + MySQL backend

const API_BASE  = 'http://localhost:3000/api/comments';
const PATIENT_ID = 'PT-20483';

let activeFilter = 'All';

// ══════════════════════════════════════════
// API CALLS
// ══════════════════════════════════════════

async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.errors?.join(', ') || 'Request failed');
    return data;
  } catch (err) {
    console.error('API error:', err);
    throw err;
  }
}

// GET all comments (with optional category filter)
async function fetchComments(category) {
  const params = new URLSearchParams({ limit: 100 });
  if (category && category !== 'All') params.append('category', category);
  const data = await apiFetch(`${API_BASE}/${PATIENT_ID}?${params}`);
  return data.comments || [];
}

// POST new comment
async function postComment(payload) {
  return await apiFetch(`${API_BASE}/${PATIENT_ID}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// DELETE one comment
async function deleteCommentById(id) {
  return await apiFetch(`${API_BASE}/${PATIENT_ID}/${id}`, { method: 'DELETE' });
}

// DELETE all comments for patient
async function deleteAllComments() {
  return await apiFetch(`${API_BASE}/${PATIENT_ID}`, { method: 'DELETE' });
}

// ══════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════

async function renderComments(filter) {
  filter = filter || activeFilter;
  const feed  = document.getElementById('commentsFeed');
  const empty = document.getElementById('noCommentsMsg');
  const badge = document.getElementById('commentCountBadge');
  if (!feed) return;

  // Show loading state
  feed.innerHTML = '<div style="color:rgba(255,255,255,.4);padding:20px;text-align:center;">Loading comments…</div>';

  try {
    const comments = await fetchComments(filter === 'All' ? null : filter);

    // Update badge with total (always fetch all for count)
    const allComments = await fetchComments(null);
    if (badge) {
      badge.textContent = allComments.length > 99 ? '99+' : allComments.length;
      badge.style.display = allComments.length > 0 ? 'inline-block' : 'none';
    }

    feed.innerHTML = '';

    if (comments.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    comments.forEach(comment => {
      const card = document.createElement('div');
      card.className = 'comment-card priority-' + comment.priority;
      card.dataset.id = comment.id;

      const timeStr = new Date(comment.created_at).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      card.innerHTML = `
        <div class="comment-header">
          <span class="priority-pip pip-${comment.priority}"></span>
          <span class="comment-author">🩺 ${escHtml(comment.author)}</span>
          <span class="comment-cat-badge cat-${comment.category}">${comment.category}</span>
          ${comment.priority !== 'Normal'
            ? `<span class="comment-cat-badge" style="background:${comment.priority === 'Critical' ? '#b71c1c' : '#e65100'};color:#fff;">${comment.priority}</span>`
            : ''}
          <span class="comment-time">🕐 ${timeStr}</span>
        </div>
        <div class="comment-body">${escHtml(comment.comment_text)}</div>
        <div class="comment-footer">
          <span class="comment-patient-tag">
            Patient: ${comment.patient_id} · ID #${comment.id} · Stored in MySQL
          </span>
          <button class="cbtn-delete" onclick="handleDelete(${comment.id})">🗑 Delete</button>
        </div>`;
      feed.appendChild(card);
    });

  } catch (err) {
    feed.innerHTML = `<div style="color:#ef9a9a;padding:20px;text-align:center;">
      ⚠️ Could not load comments. Make sure the server is running at <strong>${API_BASE}</strong>.<br>
      <small>${escHtml(err.message)}</small>
    </div>`;
  }
}

// ══════════════════════════════════════════
// EVENT HANDLERS
// ══════════════════════════════════════════

async function addComment() {
  const author       = document.getElementById('commentAuthor').value.trim();
  const category     = document.getElementById('commentCategory').value;
  const priority     = document.getElementById('commentPriority').value;
  const comment_text = document.getElementById('commentText').value.trim();

  if (!author)       { alert('Please enter the clinician name.');   document.getElementById('commentAuthor').focus(); return; }
  if (!comment_text) { alert('Please write a comment before saving.'); document.getElementById('commentText').focus(); return; }

  const btn = document.querySelector('#add-comment-card .cbtn-primary');
  btn.disabled = true;
  btn.textContent = '⏳ Saving…';

  try {
    await postComment({ author, category, priority, comment_text });
    clearCommentForm();
    await renderComments(activeFilter);

    btn.textContent = '✅ Saved to MySQL!';
    btn.style.background = '#81c784';
    setTimeout(() => {
      btn.textContent = '💾 Save to Clinician Dashboard';
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    alert('Failed to save comment: ' + err.message);
    btn.textContent = '💾 Save to Clinician Dashboard';
    btn.disabled = false;
  }
}

async function handleDelete(id) {
  if (!confirm('Delete this comment from the database?')) return;
  try {
    await deleteCommentById(id);
    await renderComments(activeFilter);
  } catch (err) {
    alert('Failed to delete: ' + err.message);
  }
}

async function clearAllComments() {
  if (!confirm('Delete ALL comments for this patient from the database? This cannot be undone.')) return;
  try {
    await deleteAllComments();
    await renderComments(activeFilter);
  } catch (err) {
    alert('Failed to clear comments: ' + err.message);
  }
}

function filterComments(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll('.cfilter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderComments(filter);
}

function clearCommentForm() {
  document.getElementById('commentAuthor').value   = '';
  document.getElementById('commentText').value     = '';
  document.getElementById('commentCategory').value = 'General';
  document.getElementById('commentPriority').value = 'Normal';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── Init: load badge count on page load ──
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const all = await fetchComments(null);
    const badge = document.getElementById('commentCountBadge');
    if (badge && all.length > 0) {
      badge.textContent = all.length;
      badge.style.display = 'inline-block';
    }
  } catch (_) { /* server may not be ready yet */ }
});
