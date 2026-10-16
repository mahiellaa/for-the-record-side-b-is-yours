
(() => {
  'use strict';

  function initialize() {
    const D = window.ARCHIVE;
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => [...document.querySelectorAll(selector)];
    const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
    const url = (value) => /^https?:\/\//i.test(value || '') ? value : '#';

    if (!D) {
      console.error('FOR THE RECORD: content.js did not load. Check that window.ARCHIVE is defined.');
    }

    let currentView = 'foyer';
    let activeTrack = -1;

    function show(view) {
      const destination = $('#' + view);
      if (!destination || !destination.classList.contains('view')) return;
      currentView = view;
      $$('.view').forEach((element) => element.classList.toggle('active', element.id === view));
      $$('.nav').forEach((element) => element.classList.toggle('active', element.dataset.view === view));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (location.hash !== '#' + view) location.hash = view;
    }

    $$('[data-view]').forEach((element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        show(element.dataset.view);
      });
    });

    window.addEventListener('hashchange', () => {
      const view = location.hash.slice(1);
      if (view && view !== currentView) show(view);
    });
    const initialView = location.hash.slice(1);
    if (initialView && $('#' + initialView)?.classList.contains('view')) show(initialView);

    // Navigation and decorative objects work even if content.js has an error.
    const secret = $('#secret');
    $$('[data-secret]').forEach((element) => element.addEventListener('click', () => {
      if (!secret) return;
      const message = $('#secretText');
      if (message) message.textContent = element.dataset.secret;
      secret.classList.add('visible');
    }));
    $('#secretClose')?.addEventListener('click', () => secret?.classList.remove('visible'));
    $('#lights')?.addEventListener('click', () => {
      document.body.classList.toggle('dimmed');
      $('#lights').textContent = document.body.classList.contains('dimmed')
        ? '✷ turn the lights up' : '✷ dim the lights';
    });
    $('#ambience')?.addEventListener('click', () => {
      document.body.classList.toggle('dimmed');
      const label = $('#ambience span');
      if (label) label.textContent = document.body.classList.contains('dimmed') ? 'light room' : 'dim room';
    });
    $('#vinyl')?.addEventListener('click', (event) => {
      const record = event.currentTarget;
      record.classList.toggle('playing');
      record.setAttribute('aria-pressed', String(record.classList.contains('playing')));
    });

    // Always highlight SIDE B, not the final word of the title.
    const heroTitle = $('#heroTitle');
    if (heroTitle) heroTitle.innerHTML = 'for the record,<br><i>side b</i> is yours';

    if (!D) return;

    if ($('#brand')) $('#brand').textContent = 'babe, you look so cool';
    document.title = D.name || 'babe, you look so cool';
    if ($('#heroSubtitle')) $('#heroSubtitle').textContent = D.subtitle || '';
    if ($('#heroIntro')) $('#heroIntro').textContent = D.intro || '';

    const entryList = $('#entryList');
    const reader = $('#entryReader');
    if (entryList && reader) {
      (Array.isArray(D.entries) ? D.entries : []).forEach((entry, index) => {
        const button = document.createElement('button');
        button.className = 'entry-button';
        button.innerHTML = '<small>' + safe(entry.date) + '</small>' +
          '<strong>' + safe(entry.title) + '</strong>' +
          '<span>' + safe(entry.excerpt) + '</span>';
        button.addEventListener('click', () => {
          const paragraphs = Array.isArray(entry.body) ? entry.body : [entry.body || ''];
          reader.innerHTML = '<p class="micro">' + safe(entry.date) +
            ' / ENTRY ' + String(index + 1).padStart(2, '0') + '</p>' +
            '<h3>' + safe(entry.title) + '</h3>' +
            paragraphs.map((paragraph) => '<p>' + safe(paragraph) + '</p>').join('');
          $$('.entry-button').forEach((item) => item.classList.remove('active'));
          button.classList.add('active');
        });
        entryList.append(button);
      });
    }

    const tracks = Array.isArray(D.tracks) ? D.tracks : [];
    const trackList = $('#trackList');
    const trackMemory = $('#trackMemory');
    const search = $('#trackSearch');
    const sideFilter = $('#sideFilter');

    function openTrack(index) {
      const track = tracks[index];
      if (!track || !trackMemory) return;
      activeTrack = index;
      trackMemory.innerHTML = '<span class="micro">SIDE ' + safe(track.side) +
        ' / ANNOTATION ' + String(index + 1).padStart(2, '0') + '</span>' +
        '<h3>' + safe(track.title) + '</h3>' +
        '<p>' + safe(track.memory) + '</p>' +
        '<a href="' + safe(url(track.url)) + '" target="_blank" rel="noopener noreferrer">LISTEN ELSEWHERE ↗</a>';
      $$('.track').forEach((element) => element.classList.toggle('active', Number(element.dataset.index) === index));
    }

    function renderTracks() {
      if (!trackList) return;
      const query = (search?.value || '').toLowerCase();
      const side = sideFilter?.value || 'all';
      trackList.innerHTML = '';
      tracks.forEach((track, index) => {
        if (side !== 'all' && track.side !== side) return;
        if (![track.title, track.artist, track.memory].join(' ').toLowerCase().includes(query)) return;
        const button = document.createElement('button');
        button.className = 'track' + (index === activeTrack ? ' active' : '');
        button.dataset.index = index;
        button.innerHTML = '<span class="num">' + String(index + 1).padStart(2, '0') + '</span>' +
          '<span class="track-name">' + safe(track.title) + '<small>' + safe(track.artist) + '</small></span>' +
          '<span class="side">' + safe(track.side) + '</span>';
        button.addEventListener('click', () => openTrack(index));
        trackList.append(button);
      });
      if (!trackList.children.length) {
        trackList.innerHTML = '<p class="micro" style="padding:18px">NO MATCHING RECORDS</p>';
      }
    }

    search?.addEventListener('input', renderTracks);
    sideFilter?.addEventListener('change', renderTracks);
    renderTracks();

    $('#randomTrack')?.addEventListener('click', () => {
      if (!tracks.length) return;
      const index = Math.floor(Math.random() * tracks.length);
      if (search) search.value = '';
      if (sideFilter) sideFilter.value = 'all';
      renderTracks();
      openTrack(index);
    });

    $('#tarot')?.addEventListener('click', () => {
      if (!tracks.length) return;
      const index = Math.floor(Math.random() * tracks.length);
      const track = tracks[index];
      const tarot = $('#tarot');
      tarot.classList.remove('drawn');
      void tarot.offsetWidth;
      tarot.classList.add('drawn');
      if ($('#tarotResult')) $('#tarotResult').textContent =
        track.title + ' — ' + track.artist + '. ' + track.memory;
      openTrack(index);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
