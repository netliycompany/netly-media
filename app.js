document.addEventListener('DOMContentLoaded', ()=>{
  // topbar elements
  const loginBtnTop = document.getElementById('loginBtnTop');
  const settingsBtnTop = document.getElementById('settingsBtnTop');
  const profilePill = document.getElementById('profilePill');
  const topAvatar = document.getElementById('topAvatar');
  const modal = document.getElementById('modal');

  function showModal(html){ if(!modal) return; modal.classList.remove('hidden'); modal.innerHTML = `<div class="card">${html}</div>`; }
  function closeModal(){ if(!modal) return; modal.classList.add('hidden'); modal.innerHTML=''; }

  // simple auth state
  function getUser(){ try{ return JSON.parse(localStorage.getItem('sm_user')); }catch(e){return null;} }
  function setUser(u){ localStorage.setItem('sm_user', JSON.stringify(u)); renderAuth(); }
  function clearUser(){ localStorage.removeItem('sm_user'); renderAuth(); }

  function renderAuth(){ const user = getUser(); if(user){ if(topAvatar) topAvatar.src = user.avatar||('https://i.pravatar.cc/150?img=12'); if(loginBtnTop) loginBtnTop.textContent = 'Logout'; }
    else{ if(topAvatar) topAvatar.src = 'https://i.pravatar.cc/150?img=1'; if(loginBtnTop) loginBtnTop.textContent = 'Login'; }
  }

  // login flow
  function openLogin(){ showModal(`<h3>Login</h3><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px"><input id="mi_name" placeholder="Name" /><input id="mi_avatar" placeholder="Avatar URL (optional)" /></div><div style="text-align:right;margin-top:12px"><button id="mi_login">Sign in</button> <button id="mi_close">Close</button></div>`);
    setTimeout(()=>{
      const btn = document.getElementById('mi_login');
      const close = document.getElementById('mi_close');
      btn.addEventListener('click', ()=>{
        const name = document.getElementById('mi_name').value.trim() || 'User';
        const avatar = document.getElementById('mi_avatar').value.trim() || `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`;
        setUser({name,avatar}); closeModal();
      });
      close.addEventListener('click', closeModal);
    },50);
  }

  // settings
  function openSettings(){
    const user = getUser() || {};
    showModal(`<h3>Settings</h3>
      <div style="margin-top:8px">
        <div style="margin-bottom:8px"><label>Name</label><input id="set_name" value="${user.name||''}" placeholder="Your name"/></div>
        <div style="margin-bottom:8px"><label>Avatar URL</label><input id="set_avatar" value="${user.avatar||''}" placeholder="https://..."/></div>
        <div style="margin-top:10px"><label>Notification count: <input id="set_notif" type="number" min="0" value="${localStorage.getItem('sm_notif')||3}"/></label></div>
      </div>
      <div style="text-align:right;margin-top:12px"><button id="set_save">Save</button> <button id="set_close">Close</button></div>`);
    setTimeout(()=>{
      document.getElementById('set_save').addEventListener('click', ()=>{
        const v = document.getElementById('set_notif').value; localStorage.setItem('sm_notif', v);
        const nameEl = document.getElementById('set_name');
        const avatarEl = document.getElementById('set_avatar');
        const user = getUser() || {};
        if(nameEl && nameEl.value.trim()) user.name = nameEl.value.trim();
        if(avatarEl && avatarEl.value.trim()) user.avatar = avatarEl.value.trim();
        if(user && user.id) setUser(user);
        closeModal(); location.reload();
      });
      document.getElementById('set_close').addEventListener('click', closeModal);
    },50);
  }

  // handlers
  // Open external nm.html for login, or logout if already signed in
  if(loginBtnTop){ loginBtnTop.addEventListener('click', ()=>{
    const user = getUser(); if(user){ clearUser(); } else { openExternalLogin(); }
  }); }

  // external iframe modal
  const externalModal = document.getElementById('externalModal');
  const externalFrame = document.getElementById('externalFrame');
  const externalClose = document.getElementById('externalClose');
  function openExternalLogin(){ if(!externalModal||!externalFrame) return; externalFrame.src='nm.html'; externalModal.classList.remove('hidden'); }
  function closeExternal(){ if(!externalModal||!externalFrame) return; externalFrame.src=''; externalModal.classList.add('hidden'); }
  if(externalClose) externalClose.addEventListener('click', closeExternal);

  // listen to messages from nm.html iframe to sync auth state
  window.addEventListener('message', e=>{
    try{
      const msg = e.data;
      if(!msg || msg.type!=='nm_auth') return;
      if(msg.event==='login' && msg.user){ setUser(msg.user); closeExternal(); }
      if(msg.event==='logout'){ clearUser(); closeExternal(); }
      if(msg.event==='profile_update' && msg.user){ setUser(msg.user); }
      if(msg.event==='new_post' && msg.post){
        // when nm.html signals a new post, re-render posts
        try{ renderPosts(); }catch(e){}
      }
      if(msg.event==='new_story' && msg.story){ try{ renderStories(); }catch(e){} }
    }catch(err){ }
  });
  if(settingsBtnTop) settingsBtnTop.addEventListener('click', openSettings);
  if(profilePill) profilePill.addEventListener('click', ()=>{
    const user = getUser(); if(user) alert(`Profile: ${user.name}`); else openLogin();
  });

  // notification demo handled earlier if present
  const notifBtn = document.getElementById('notifBtn');
  if(notifBtn) notifBtn.addEventListener('click', ()=>{ alert('Notifications (demo)'); });

  // close modal on backdrop click
  if(modal) modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
  // POSTS & STORIES
  const LS_POSTS = 'sm_posts';
  const LS_STORIES = 'sm_stories';
  const postBtn = document.getElementById('postBtn');
  const postText = document.getElementById('postText');
  const postImage = document.getElementById('postImage');
  const postPreview = document.getElementById('postPreview');
  const composerAvatar = document.getElementById('composerAvatar');
  const postsEl = document.getElementById('posts');
  const storiesEl = document.getElementById('stories');
  const storyImage = document.getElementById('storyImage');
  const storyBtn = document.getElementById('storyBtn');

  function load(key, def){ try{return JSON.parse(localStorage.getItem(key) || JSON.stringify(def));}catch(e){return def;} }
  function save(key, v){ localStorage.setItem(key, JSON.stringify(v)); }

  function getPosts(){ return load(LS_POSTS, []); }
  function savePosts(p){ save(LS_POSTS, p); }
  function getStories(){ return load(LS_STORIES, []); }
  function saveStories(s){ save(LS_STORIES, s); }

  function renderComposerAvatar(){ const u = getUser(); if(u && composerAvatar) composerAvatar.src = u.avatar || 'https://i.pravatar.cc/150?img=1'; }

  // preview selected post image
  if(postImage){ postImage.addEventListener('change', (e)=>{
    const f = e.target.files[0]; if(!f){ postPreview.innerHTML=''; return; }
    const r = new FileReader(); r.onload = ()=>{ postPreview.innerHTML = `<img src="${r.result}" alt="preview"/>`; postPreview.querySelector('img').style.maxWidth='140px'; };
    r.readAsDataURL(f);
  }); }

  // create post (with optional image DataURL)
  function createPost({text, image}){
    const u = getUser(); if(!u){ alert('Please login'); return; }
    const posts = getPosts(); const p = {id: 'p_'+Date.now(), userId: u.id||u.email, userName: u.name||u.id||'User', userAvatar: u.avatar||'', content: text||'', image: image||null, time: new Date().toISOString(), likes:[], comments:[]}; posts.unshift(p); savePosts(posts); renderPosts();
  }

  if(postBtn){ postBtn.addEventListener('click', ()=>{
    const text = postText.value.trim(); const f = postImage.files && postImage.files[0];
    if(f){ const r = new FileReader(); r.onload = ()=>{ createPost({text, image: r.result}); postText.value=''; postImage.value=''; postPreview.innerHTML=''; }; r.readAsDataURL(f); }
    else { createPost({text}); postText.value=''; }
  }); }

  // STORY: create story with image (required)
  function createStory({image}){
    const u = getUser(); if(!u){ alert('Please login'); return; }
    if(!image){ alert('Pick an image for story'); return; }
    const stories = getStories(); const s = {id:'s_'+Date.now(), userId:u.id||u.email,userName:u.name||u.id||'User',userAvatar:u.avatar||'',image, time:new Date().toISOString(), expires: Date.now() + 24*60*60*1000}; stories.unshift(s); saveStories(stories); renderStories();
  }

  if(storyBtn){ storyBtn.addEventListener('click', ()=>{
    const f = storyImage.files && storyImage.files[0]; if(!f){ alert('Choose an image for your story'); return; }
    const r = new FileReader(); r.onload = ()=>{ createStory({image: r.result}); storyImage.value=''; }; r.readAsDataURL(f);
  }); }

  // render posts
  function renderPosts(){ if(!postsEl) return; postsEl.innerHTML=''; const posts = getPosts(); posts.forEach(p=>{
    const div = document.createElement('div'); div.className='card post'; div.innerHTML = `<div class="meta"><img src="${p.userAvatar||'https://i.pravatar.cc/40?u='+p.userId}" style="width:36px;height:36px;border-radius:6px;object-fit:cover"/> <div style="margin-left:8px"><strong>${escapeHtml(p.userName)}</n></strong><div class="muted">${new Date(p.time).toLocaleString()}</div></div></div><div class="content">${escapeHtml(p.content||'')}</div>`;
    if(p.image){ const img = document.createElement('img'); img.src = p.image; img.style.maxWidth='100%'; img.style.marginTop='8px'; img.style.borderRadius='8px'; div.querySelector('.content').appendChild(img); }
    postsEl.appendChild(div);
  }); }

  // render stories (filter expired)
  function renderStories(){ if(!storiesEl) return; const now = Date.now(); let stories = getStories(); stories = stories.filter(s=> s.expires > now); saveStories(stories); storiesEl.innerHTML=''; // your story tile
    const u = getUser(); const your = document.createElement('div'); your.className='story'; your.innerHTML = `<div style="text-align:center"><img src="${u?u.avatar:'https://i.pravatar.cc/150?img=1'}" style="width:72px;height:72px;border-radius:12px;object-fit:cover;border:2px solid #e2e8f0"/><div class="who">Your story</div></div>`; your.addEventListener('click', ()=>{ if(!u){ openExternalLogin(); return;} if(stories.length==0) alert('No stories yet'); else openStoryViewer(stories[0]); }); storiesEl.appendChild(your);
    stories.forEach(s=>{ const d = document.createElement('div'); d.className='story'; d.innerHTML = `<img src="${s.image}"/><div class="who">${escapeHtml(s.userName)}</div>`; d.addEventListener('click', ()=> openStoryViewer(s)); storiesEl.appendChild(d); }); }

  function openStoryViewer(s){ const v = document.createElement('div'); v.className='story-viewer'; v.innerHTML = `<img src="${s.image}"/>`; v.addEventListener('click', ()=> v.remove()); document.body.appendChild(v); }

  function escapeHtml(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // initial render
  renderComposerAvatar(); renderStories(); renderPosts();

  // listen for profile updates to refresh avatar & user info
  window.addEventListener('message', e=>{ try{ const msg = e.data; if(!msg || msg.type!=='nm_auth') return; if(msg.event==='profile_update' && msg.user){ setUser(msg.user); renderComposerAvatar(); renderPosts(); } }catch(err){} });

  renderAuth();
});
