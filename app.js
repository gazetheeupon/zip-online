(function () {
  // Tabs
  const tabCreate = document.getElementById('tabCreate');
  const tabExtract = document.getElementById('tabExtract');
  const panelCreate = document.getElementById('panelCreate');
  const panelExtract = document.getElementById('panelExtract');
  tabCreate.addEventListener('click', () => {
    tabCreate.classList.add('active');
    tabExtract.classList.remove('active');
    panelCreate.classList.add('active');
    panelExtract.classList.remove('active');
  });
  tabExtract.addEventListener('click', () => {
    tabExtract.classList.add('active');
    tabCreate.classList.remove('active');
    panelExtract.classList.add('active');
    panelCreate.classList.remove('active');
  });

  // ---- Create ZIP ----
  const dropzoneCreate = document.getElementById('dropzoneCreate');
  const fileInputCreate = document.getElementById('fileInputCreate');
  const fileListEl = document.getElementById('fileList');
  const createBtn = document.getElementById('createBtn');
  const zipNameInput = document.getElementById('zipName');
  const status = document.getElementById('status');

  let createFiles = [];

  function renderFileList() {
    fileListEl.innerHTML = '';
    createFiles.forEach((f, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<span>' + f.name + ' (' + Math.max(1, Math.round(f.size / 1024)) + ' KB)</span>';
      const btn = document.createElement('button');
      btn.textContent = '✕';
      btn.title = 'Remove';
      btn.addEventListener('click', () => {
        createFiles.splice(i, 1);
        renderFileList();
      });
      li.appendChild(btn);
      fileListEl.appendChild(li);
    });
    createBtn.disabled = createFiles.length === 0;
  }

  function addCreateFiles(list) {
    createFiles = createFiles.concat(Array.from(list));
    renderFileList();
  }

  dropzoneCreate.addEventListener('click', () => fileInputCreate.click());
  fileInputCreate.addEventListener('change', (e) => addCreateFiles(e.target.files));
  ['dragenter', 'dragover'].forEach((ev) =>
    dropzoneCreate.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzoneCreate.classList.add('drag');
    })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    dropzoneCreate.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzoneCreate.classList.remove('drag');
    })
  );
  dropzoneCreate.addEventListener('drop', (e) => addCreateFiles(e.dataTransfer.files));

  createBtn.addEventListener('click', async () => {
    createBtn.disabled = true;
    status.textContent = 'Zipping...';
    try {
      const zip = new JSZip();
      for (const file of createFiles) {
        zip.file(file.name, file);
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const name = (zipNameInput.value || 'archive.zip').trim() || 'archive.zip';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name.endsWith('.zip') ? name : name + '.zip';
      a.click();
      status.textContent = 'Done. Zipped ' + createFiles.length + ' file(s).';
    } catch (err) {
      status.textContent = 'Error: ' + err.message;
      console.error(err);
    } finally {
      createBtn.disabled = createFiles.length === 0;
    }
  });

  // ---- Extract ZIP ----
  const dropzoneExtract = document.getElementById('dropzoneExtract');
  const fileInputExtract = document.getElementById('fileInputExtract');
  const statusExtract = document.getElementById('statusExtract');
  const extractList = document.getElementById('extractList');
  const downloadAllExtractBtn = document.getElementById('downloadAllExtractBtn');

  let extractResults = [];

  async function handleZipFile(file) {
    if (!file) return;
    extractList.innerHTML = '';
    extractResults = [];
    downloadAllExtractBtn.style.display = 'none';
    statusExtract.textContent = 'Reading ' + file.name + '...';
    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((e) => !e.dir);
      for (const entry of entries) {
        const blob = await entry.async('blob');
        const url = URL.createObjectURL(blob);
        extractResults.push({ name: entry.name, url });
        const li = document.createElement('li');
        li.innerHTML = '<span>' + entry.name + '</span><a class="dl" download="' + entry.name.split('/').pop() + '" href="' + url + '">Download</a>';
        extractList.appendChild(li);
      }
      statusExtract.textContent = 'Done. ' + entries.length + ' file(s) found.';
      downloadAllExtractBtn.style.display = entries.length > 1 ? 'inline-block' : 'none';
    } catch (err) {
      statusExtract.textContent = 'Error: ' + err.message + ' (is this a valid .zip file?)';
      console.error(err);
    }
  }

  dropzoneExtract.addEventListener('click', () => fileInputExtract.click());
  fileInputExtract.addEventListener('change', (e) => handleZipFile(e.target.files[0]));
  ['dragenter', 'dragover'].forEach((ev) =>
    dropzoneExtract.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzoneExtract.classList.add('drag');
    })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    dropzoneExtract.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzoneExtract.classList.remove('drag');
    })
  );
  dropzoneExtract.addEventListener('drop', (e) => handleZipFile(e.dataTransfer.files[0]));

  downloadAllExtractBtn.addEventListener('click', () => {
    extractResults.forEach((r, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = r.url;
        a.download = r.name.split('/').pop();
        a.click();
      }, i * 200);
    });
  });
})();
