// ── UI 交互逻辑 ──

document.addEventListener('DOMContentLoaded', () => {

  // ── Tag group interaction ──
  const tagGroups = document.querySelectorAll('.tag-group');

  tagGroups.forEach(group => {
    group.addEventListener('click', (e) => {
      const tag = e.target.closest('.tag');
      if (!tag) return;

      // Remove active from siblings
      group.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
      // Add active to clicked
      tag.classList.add('active');
    });
  });

  // ── Get current config ──
  function getConfig() {
    const getActive = (id) => {
      const active = document.querySelector('#' + id + ' .tag.active');
      return active ? active.dataset.val : '';
    };

    return {
      genre: getActive('tag-genre'),
      tone: getActive('tag-tone'),
      pov: getActive('tag-pov'),
      hero: getActive('tag-hero'),
      length: parseInt(getActive('tag-length')) || 2000,
      world: getActive('tag-world'),
      rating: getActive('tag-rating'),
      romance: getActive('tag-romance')
    };
  }

  // ── Generate button ──
  const btnGenerate = document.getElementById('btnGenerate');
  const output = document.getElementById('output');
  const toolbar = document.getElementById('toolbar');

  let lastStory = null;

  btnGenerate.addEventListener('click', () => {
    const config = getConfig();

    // Show loading
    output.innerHTML = `
      <div class="output-placeholder">
        <div class="placeholder-icon">⏳</div>
        <div>正在生成...</div>
        <div class="placeholder-hint">${config.genre} · ${config.tone} · ${config.hero} · ${config.world}</div>
      </div>
    `;

    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      try {
        lastStory = generateStory(config);
        renderStory(lastStory);
        toolbar.style.display = 'flex';
      } catch (err) {
        console.error(err);
        output.innerHTML = `
          <div class="output-placeholder">
            <div class="placeholder-icon">❌</div>
            <div>生成失败，请重试</div>
            <div class="placeholder-hint">${err.message}</div>
            <div style="font-size:11px;color:#666;margin-top:8px;max-width:100%;word-break:break-all">${err.stack || ''}</div>
          </div>
        `;
      }
    }, 100);
  });

  // ── Render story ──
  function renderStory(story) {
    output.innerHTML = `
      <div class="story-title">${story.title}</div>
      <div class="story-body">
        ${story.body}
      </div>
    `;
    output.scrollTop = 0;
  }

  // ── Random button ──
  const btnRandom = document.getElementById('btnRandom');
  btnRandom.addEventListener('click', () => {
    const groups = [
      'tag-genre', 'tag-tone', 'tag-pov', 'tag-hero',
      'tag-length', 'tag-world', 'tag-rating', 'tag-romance'
    ];

    groups.forEach(id => {
      const tags = document.querySelectorAll('#' + id + ' .tag');
      if (tags.length > 0) {
        tags.forEach(t => t.classList.remove('active'));
        const randomTag = tags[Math.floor(Math.random() * tags.length)];
        randomTag.classList.add('active');
      }
    });
  });

  // ── Copy button ──
  const btnCopy = document.getElementById('btnCopy');
  btnCopy.addEventListener('click', () => {
    if (!lastStory) return;

    const text = lastStory.body
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<p class="separator">/g, '')
      .replace(/<div class="story-footer">/g, '\n\n')
      .replace(/<\/div>/g, '')
      .replace(/—/g, '——')
      .replace(/·/g, '·');

    navigator.clipboard.writeText(lastStory.title + '\n\n' + text.trim()).then(() => {
      const orig = btnCopy.textContent;
      btnCopy.textContent = '✅ 已复制';
      setTimeout(() => { btnCopy.textContent = orig; }, 2000);
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = lastStory.title + '\n\n' + text.trim();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      const orig = btnCopy.textContent;
      btnCopy.textContent = '✅ 已复制';
      setTimeout(() => { btnCopy.textContent = orig; }, 2000);
    });
  });

  // ── Export TXT button ──
  const btnTxt = document.getElementById('btnTxt');
  btnTxt.addEventListener('click', () => {
    if (!lastStory) return;

    const text = lastStory.body
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<p class="separator">/g, '')
      .replace(/<div class="story-footer">/g, '\n\n')
      .replace(/<\/div>/g, '')
      .replace(/—/g, '——')
      .replace(/·/g, '·');

    const fullText = lastStory.title + '\n\n' + text.trim();
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = lastStory.title + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ── Retry button ──
  const btnRetry = document.getElementById('btnRetry');
  btnRetry.addEventListener('click', () => {
    btnGenerate.click();
  });

  // ── Keyboard shortcut ──
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'Enter') {
      e.preventDefault();
      btnGenerate.click();
    }
    if (e.ctrlKey && e.code === 'KeyR') {
      e.preventDefault();
      btnRandom.click();
    }
  });

});
