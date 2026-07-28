import { gsap } from './vendor/gsap/index.js';
import { ScrollTrigger } from './vendor/gsap/ScrollTrigger.js';
import { Flip } from './vendor/gsap/Flip.js';

gsap.registerPlugin(ScrollTrigger, Flip);

const pages = new Map([...document.querySelectorAll('[data-page]')].map((page) => [page.dataset.page, page]));
const routeNames = { '#/': 'home', '#/index': 'index', '#/editorial': 'editorial', '#/archive': 'archive' };
const titles = { home: 'SPATIA', index: 'The Index | SPATIA', editorial: 'The Editorial | SPATIA', archive: 'The Archive | SPATIA' };
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = matchMedia('(max-width: 800px)');
const footerTemplate = document.querySelector('#footer-template');
let pageCleanup = [];
let activePage = 'home';
let archiveCase = null;
let renderVersion = 0;

document.querySelectorAll('[data-footer-slot]').forEach((slot) => slot.replaceWith(footerTemplate.content.cloneNode(true)));
document.body.classList.toggle('is-reduced', reduceQuery.matches);
history.scrollRestoration = 'manual';

const cleanPath = () => location.hash || '#/';
const routeForPath = () => routeNames[cleanPath()] || 'home';
const rememberScroll = (path = cleanPath()) => sessionStorage.setItem(`spatia-scroll:${path}`, String(scrollY));
const savedScroll = (path = cleanPath()) => Number(sessionStorage.getItem(`spatia-scroll:${path}`) || 0);

function addCleanup(value) {
  pageCleanup.push(value);
  return value;
}

function teardownPage() {
  pageCleanup.splice(0).reverse().forEach((cleanup) => {
    if (typeof cleanup === 'function') cleanup();
    else cleanup?.revert?.();
  });
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  gsap.killTweensOf('*');
}

function bindRoutes() {
  document.querySelectorAll('[data-route]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      rememberScroll();
      closeMenu();
      navigate(new URL(link.href).hash);
    });
  });
}

function navigate(path) {
  if (path === cleanPath()) {
    scrollTo(0, 0);
    return;
  }
  location.hash = path.slice(1);
}

function renderRoute({ restore, animate = false }) {
  teardownPage();
  const version = ++renderVersion;
  activePage = routeForPath();
  const swap = () => {
    pages.forEach((page, name) => { page.hidden = name !== activePage; });
    document.title = titles[activePage];
    document.querySelectorAll('[data-route]').forEach((link) => {
      const current = new URL(link.href).hash || '#/';
      if (current === cleanPath()) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const initialize = () => requestAnimationFrame(() => {
    if (version !== renderVersion) return;
    const targetY = restore ? savedScroll() : 0;
    scrollTo(0, targetY);
    if (activePage === 'home') initHome();
    if (activePage === 'index') initIndex();
    if (activePage === 'editorial') initEditorial();
    if (activePage === 'archive') initArchive();
    ScrollTrigger.refresh();
    requestAnimationFrame(() => scrollTo(0, targetY));
  });

  if (animate && document.startViewTransition && !reduceQuery.matches) {
    const transition = document.startViewTransition(swap);
    transition.updateCallbackDone.then(initialize, initialize);
  } else {
    swap();
    initialize();
  }
}

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('is-locked');
}
menuButton.addEventListener('click', () => {
  const open = !navigation.classList.contains('is-open');
  navigation.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('is-locked', open);
  if (open) navigation.querySelector('a')?.focus();
});

function initHome() {
  const root = pages.get('home');
  const ctx = gsap.context(() => {
    const header = document.querySelector('[data-header]');
    const headerItems = header.querySelectorAll(':scope > *');
    const folds = root.querySelectorAll('.hero-fold');
    const introMark = root.querySelector('.hero-intro-mark');
    const heroCopy = root.querySelectorAll('.hero-copy > *');
    const workbench = root.querySelector('.spatial-workbench');
    const workbenchTop = workbench.querySelector('.workbench-top');
    const workbenchParts = workbench.querySelectorAll('.canvas-media, .canvas-orbit');
    const workbenchThreads = workbench.querySelectorAll('.canvas-thread');
    const hero = root.querySelector('.home-hero');
    const heroPhoto = root.querySelector('.hero-photo');
    const letters = [...root.querySelectorAll('[data-hero-letter]')];
    const firstVisit = !sessionStorage.getItem('spatia-seen');
    if (reduceQuery.matches) {
      document.documentElement.classList.remove('has-js');
      gsap.set([header, headerItems, folds, introMark, heroCopy, workbench, workbenchTop, workbenchParts, workbenchThreads, '.hero-aperture'], { clearProps: 'all' });
    } else {
      const duration = firstVisit ? 1.45 : .78;
      gsap.set(header, { autoAlpha: 1 });
      gsap.set(headerItems, { yPercent: -125, opacity: 0 });
      gsap.set('.hero-aperture', { scale: firstVisit ? 1.08 : 1.035 });
      gsap.set(heroCopy, { yPercent: 115, opacity: 0 });
      gsap.set(workbench, { yPercent: 18, rotate: 5, scale: .94 });
      gsap.set(workbenchTop, { scaleX: .08, transformOrigin: 'left' });
      gsap.set(workbenchParts, { yPercent: 20, rotate: (index) => [-6, 3, 8, -4][index] || 0, scale: .94, opacity: 0 });
      gsap.set(workbenchThreads, { scaleX: 0 });
      const foldVars = mobileQuery.matches
        ? [{ yPercent: -96, rotateX: 78 }, { yPercent: 96, rotateX: -78 }]
        : [{ xPercent: -96, rotateY: -78 }, { xPercent: 96, rotateY: 78 }];
      gsap.timeline({
        onComplete: () => {
          document.documentElement.classList.remove('has-js');
          gsap.set([header, headerItems, folds, introMark, heroCopy, workbench, workbenchTop, workbenchParts, workbenchThreads, '.hero-aperture'], { clearProps: 'all' });
          sessionStorage.setItem('spatia-seen', '1');
        }
      })
        .fromTo(header, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: duration * .48, ease: 'power3.inOut' }, 0)
        .to(headerItems, { yPercent: 0, opacity: 1, duration: duration * .34, stagger: .055, ease: 'power3.out' }, duration * .28)
        .to(introMark, { opacity: 0, yPercent: -8, duration: duration * .3, ease: 'power2.in' }, firstVisit ? .28 : .08)
        .to(folds[0], { ...foldVars[0], duration, ease: 'power3.inOut' }, firstVisit ? .42 : .12)
        .to(folds[1], { ...foldVars[1], duration, ease: 'power3.inOut' }, '<')
        .to('.hero-aperture', { scale: 1, duration, ease: 'power2.out' }, '<')
        .to(workbench, { yPercent: 0, rotate: 2, scale: 1, duration: duration * .85, ease: 'power3.out' }, '<+=0.18')
        .to(workbenchTop, { scaleX: 1, duration: duration * .36, ease: 'power3.out' }, '<+=0.12')
        .to(workbenchParts, { yPercent: 0, rotate: 0, scale: 1, opacity: 1, duration: duration * .42, stagger: .055, ease: 'back.out(1.18)' }, '<+=0.06')
        .to(workbenchThreads, { scaleX: 1, duration: duration * .28, stagger: .06, ease: 'power2.out' }, '<+=0.08')
        .to(heroCopy, { yPercent: 0, opacity: 1, duration: duration * .55, stagger: .07, ease: 'power3.out' }, '<+=0.12');
    }
    if (!mobileQuery.matches && !reduceQuery.matches) {
      const pointerTargets = [
        { element: heroPhoto, x: 4, y: 3 },
        { element: workbench, x: 9, y: 6 }
      ].map(({ element, x, y }) => ({
        x: gsap.quickTo(element, 'x', { duration: .55, ease: 'power3.out' }),
        y: gsap.quickTo(element, 'y', { duration: .55, ease: 'power3.out' }),
        rangeX: x, rangeY: y
      }));
      const letterX = letters.map((letter) => gsap.quickTo(letter, 'x', { duration: .48, ease: 'power3.out' }));
      const onPointerMove = (event) => {
        const bounds = hero.getBoundingClientRect();
        const nx = (event.clientX - bounds.left) / bounds.width * 2 - 1;
        const ny = (event.clientY - bounds.top) / bounds.height * 2 - 1;
        pointerTargets.forEach((target) => { target.x(nx * target.rangeX); target.y(ny * target.rangeY); });
      };
      const onTitlePointerMove = (event) => {
        letters.forEach((letter, index) => {
          const box = letter.getBoundingClientRect();
          const distance = event.clientX - (box.left + box.width / 2);
          letterX[index](Math.abs(distance) < 70 ? Math.sign(-distance) * (1 - Math.abs(distance) / 70) * 10 : 0);
        });
      };
      const resetBackground = () => {
        pointerTargets.forEach((target) => { target.x(0); target.y(0); });
      };
      const resetLetters = () => letterX.forEach((setX) => setX(0));
      hero.addEventListener('pointermove', onPointerMove);
      hero.addEventListener('pointerleave', resetBackground);
      const heroTitle = root.querySelector('#home-title');
      heroTitle.addEventListener('pointermove', onTitlePointerMove);
      heroTitle.addEventListener('pointerleave', resetLetters);
      addCleanup(() => {
        hero.removeEventListener('pointermove', onPointerMove);
        hero.removeEventListener('pointerleave', resetBackground);
        heroTitle.removeEventListener('pointermove', onTitlePointerMove);
        heroTitle.removeEventListener('pointerleave', resetLetters);
      });

      ScrollTrigger.create({
        trigger: '[data-convergence]', start: 'top 88%', end: 'top 35%', scrub: true,
        animation: gsap.timeline().to(header, { yPercent: -105, ease: 'none' })
      });
      gsap.timeline({
        scrollTrigger: { trigger: '[data-convergence]', start: 'top 76%', toggleActions: 'play none none reverse' }
      })
        .from('.convergence .section-kicker', { clipPath: 'inset(0 0 100% 0)', yPercent: 55, duration: .55, ease: 'power3.out' })
        .from('.convergence h2', { clipPath: 'inset(0 0 100% 0)', yPercent: 28, duration: .85, ease: 'power3.out' }, .12)
        .from('.piece-copy span', { yPercent: 65, opacity: 0, duration: .55, ease: 'power3.out' }, .38);
      const pieces = root.querySelectorAll('.material-piece');
      const connections = root.querySelectorAll('.connection');
      gsap.set(connections, { scaleX: 0 });
      gsap.timeline({
        scrollTrigger: { trigger: '[data-convergence]', start: 'top top', end: 'bottom bottom', scrub: .35, invalidateOnRefresh: true }
      })
        .from(pieces[0], { x: () => -innerWidth * .45, y: () => innerHeight * .12, rotate: -18 }, 0)
        .from(pieces[1], { y: () => innerHeight * .7, rotate: 14 }, .08)
        .from(pieces[2], { x: () => innerWidth * .45, y: () => innerHeight * .18, rotate: 16 }, .16)
        .to(connections, { scaleX: 1, stagger: .08, ease: 'power2.out' }, .55);

      const journey = root.querySelector('[data-journey]');
      const cards = [...journey.querySelectorAll('.journey-card')];
      const inners = journey.querySelectorAll('.journey-card-inner');
      const center = journey.querySelector('[data-center-card]');
      const montage = journey.querySelector('[data-montage]');
      const thresholds = [0, .13, .27, .43, .68, .92];
      const names = ['formed', 'separated', 'settled', 'turning', 'revealed', 'expanded'];

      const updatePhase = (self) => {
        let phase = 0;
        thresholds.forEach((threshold, index) => { if (self.progress >= threshold) phase = index; });
        journey.dataset.phase = names[phase];
      };
      ScrollTrigger.create({
        trigger: journey,
        start: 'top top',
        end: 'bottom bottom',
        invalidateOnRefresh: true,
        onUpdate: updatePhase
      });

      gsap.set(cards, { transformPerspective: 1800 });
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: journey,
          start: 'top top',
          end: 'bottom bottom',
          scrub: .45,
          invalidateOnRefresh: true
        }
      })
        .set(cards, { opacity: 0 }, 0)
        .to(cards, { opacity: 1, duration: .025 }, .13)
        .to('[data-plane]', { opacity: 0, duration: .025 }, .13)
        .from('.card-front span', { yPercent: -100, opacity: 0, duration: .07, stagger: .012, ease: 'power2.out' }, .135)
        .from('.card-front h3', { clipPath: 'inset(0 0 100% 0)', yPercent: 35, duration: .1, stagger: .012, ease: 'power3.out' }, .145)
        .to(cards[0], { xPercent: -8, rotateZ: -1.8, duration: .13, ease: 'power2.inOut' }, .13)
        .to(cards[2], { xPercent: 8, rotateZ: 1.8, duration: .13, ease: 'power2.inOut' }, .13)
        .to(cards, { scale: .96, duration: .1, ease: 'power2.out' }, .27)
        .to({}, { duration: .07 }, .37)
        .to(inners, { rotateY: 180, duration: .2, stagger: .018, ease: 'power3.inOut' }, .44)
        .to({}, { duration: .13 }, .66)
        .to([cards[0], cards[2]], { x: (index) => index ? innerWidth * .8 : -innerWidth * .8, opacity: 0, duration: .13, ease: 'power3.in' }, .79)
        .to(center, {
          x: () => innerWidth / 2 - (center.getBoundingClientRect().left + center.offsetWidth / 2),
          y: () => innerHeight / 2 - (center.getBoundingClientRect().top + center.offsetHeight / 2),
          scaleX: () => innerWidth / center.offsetWidth,
          scaleY: () => innerHeight / center.offsetHeight,
          duration: .14,
          ease: 'power3.inOut'
        }, .79)
        .to('.journey-heading', { opacity: 0, duration: .08 }, .8)
        .to(montage, { opacity: 1, duration: .08 }, .87)
        .to(center, { opacity: 0, duration: .04 }, .93);

      gsap.timeline({
        scrollTrigger: { trigger: '[data-coda]', start: 'top top', end: 'bottom bottom', scrub: .45, invalidateOnRefresh: true }
      })
        .to('.coda-project', { scale: .62, yPercent: -10, filter: 'saturate(.65)', ease: 'none' }, 0)
        .to('.coda-surface', { yPercent: -100, ease: 'power2.inOut' }, .18)
        .to('.coda-word', { rotateX: 0, ease: 'power3.out' }, .53)
        .to('.coda-copy', { opacity: 1, y: 0, ease: 'power2.out' }, .7);

      const footer = root.querySelector('.site-footer');
      gsap.timeline({
        scrollTrigger: { trigger: footer, start: 'top bottom', end: 'top top', scrub: .45, invalidateOnRefresh: true }
      })
        .fromTo(footer, { yPercent: 12 }, { yPercent: 0, duration: 1, ease: 'none' }, 0)
        .from('.page-home .footer-columns', { y: 36, opacity: 0, duration: .42, ease: 'power3.out' }, .22)
        .from('.page-home .footer-wordmark', { clipPath: 'inset(100% 0 0 0)', yPercent: 24, duration: .55, ease: 'power3.out' }, .36)
        .from('.page-home .footer-bottom', { y: 12, opacity: 0, duration: .28, ease: 'power2.out' }, .68);
    } else {
      root.querySelector('[data-journey]').dataset.phase = 'expanded';
    }
  }, root);
  addCleanup(ctx);
}

function initIndex() {
  const root = pages.get('index');
  const gallery = root.querySelector('[data-index-gallery]');
  const items = [...gallery.querySelectorAll('[data-capability]')];
  const stage = gallery.querySelector('[data-index-stage]');
  const count = gallery.querySelector('[data-index-count]');
  const note = gallery.querySelector('[data-index-note]');
  const mediaHome = new Map(items.map((item) => [item.querySelector('[data-capability-media]'), item]));
  let active = -1;

  function activate(index, animate = true) {
    if (index === active) return;
    const incoming = items[index].querySelector('[data-capability-media]');
    const outgoing = stage.firstElementChild;
    const state = animate ? Flip.getState([incoming, outgoing].filter(Boolean)) : null;
    if (outgoing) mediaHome.get(outgoing).append(outgoing);
    stage.append(incoming);
    items.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === index));
    count.textContent = String(index + 1).padStart(2, '0');
    note.textContent = items[index].dataset.note;
    active = index;
    if (state) Flip.from(state, { duration: .85, ease: 'power3.inOut', absolute: true, prune: true });
  }

  if (!mobileQuery.matches && !reduceQuery.matches) {
    activate(0, false);
    const observer = new IntersectionObserver((entries) => {
      const centered = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (centered) activate(items.indexOf(centered.target));
    }, { rootMargin: '-42% 0px -42% 0px', threshold: [0, .1, .5, 1] });
    items.forEach((item) => observer.observe(item));
    addCleanup(() => observer.disconnect());
    addCleanup(() => {
      const current = stage.firstElementChild;
      if (current) mediaHome.get(current).append(current);
    });
  }

  const controller = new AbortController();
  items.forEach((item, index) => item.querySelector('button').addEventListener('click', () => {
    if (mobileQuery.matches || reduceQuery.matches) item.scrollIntoView({ block: 'start' });
    else activate(index);
  }, { signal: controller.signal }));
  addCleanup(() => controller.abort());
}

function initEditorial() {
  const root = pages.get('editorial');
  if (mobileQuery.matches || reduceQuery.matches) return;
  const ctx = gsap.context(() => {
    const pieces = root.querySelectorAll('.editorial-piece');
    gsap.timeline({
      scrollTrigger: { trigger: '[data-editorial]', start: 'top top', end: 'bottom bottom', scrub: .55, invalidateOnRefresh: true }
    })
      .to(pieces[0], { x: () => innerWidth * .36, y: () => innerHeight * .16, rotate: 0, scale: .86, ease: 'none' }, 0)
      .to(pieces[1], { x: () => -innerWidth * .27, y: () => innerHeight * .18, rotate: 0, scale: 1.12, ease: 'none' }, .12)
      .to(pieces[2], { x: () => -innerWidth * .32, y: () => -innerHeight * .18, rotate: 0, scale: 1.05, ease: 'none' }, .3)
      .to(pieces[3], { x: () => innerWidth * .32, y: () => -innerHeight * .13, rotate: 0, ease: 'none' }, .45)
      .to(pieces[4], { rotate: 0, scaleX: .55, ease: 'none' }, .6);
  }, root);
  addCleanup(ctx);
}

function initArchive() {
  const root = pages.get('archive');
  const filters = [...root.querySelectorAll('[data-filter]')];
  const items = [...root.querySelectorAll('.archive-item')];
  const controller = new AbortController();

  filters.forEach((button) => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle('is-active', item === button));
    items.forEach((item) => { item.hidden = filter !== 'All' && item.dataset.category !== filter; });
    ScrollTrigger.refresh();
  }, { signal: controller.signal }));
  items.forEach((item) => item.querySelector('[data-project-open]').addEventListener('click', () => openProject(item), { signal: controller.signal }));
  addCleanup(() => controller.abort());
}

const caseView = document.querySelector('[data-case-view]');
const caseStage = caseView.querySelector('[data-case-stage]');
const caseTitle = caseView.querySelector('[data-case-title]');
const caseCategory = caseView.querySelector('[data-case-category]');
const caseClose = caseView.querySelector('[data-project-close]');

function openProject(item) {
  if (archiveCase) return;
  const cover = item.querySelector('.archive-cover');
  const state = Flip.getState(cover);
  const marker = document.createComment('project-origin');
  cover.before(marker);
  archiveCase = { item, cover, marker, scroll: scrollY };
  caseTitle.textContent = item.dataset.project;
  caseCategory.textContent = item.dataset.category;
  caseView.hidden = false;
  caseView.setAttribute('aria-hidden', 'false');
  caseStage.append(cover);
  document.body.classList.add('is-locked');
  caseView.scrollTop = 0;
  if (!reduceQuery.matches) Flip.from(state, { duration: .9, ease: 'power3.inOut', absolute: true });
  caseClose.focus();
  const caseUrl = new URL(location.href);
  caseUrl.searchParams.set('case', item.dataset.project);
  history.pushState({ case: item.dataset.project }, '', caseUrl);
}

function closeProject(fromHistory = false) {
  if (!archiveCase) return;
  const current = archiveCase;
  const state = Flip.getState(current.cover);
  current.marker.replaceWith(current.cover);
  const finish = () => {
    caseView.hidden = true;
    caseView.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    scrollTo(0, current.scroll);
    current.cover.focus();
    archiveCase = null;
  };
  if (reduceQuery.matches) finish();
  else Flip.from(state, { duration: .7, ease: 'power3.inOut', absolute: true, onComplete: finish });
  if (!fromHistory) history.back();
}

caseClose.addEventListener('click', () => closeProject());
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && archiveCase) closeProject();
  else if (event.key === 'Escape') closeMenu();
});

const filmDialog = document.querySelector('[data-film-dialog]');
const filmOpen = document.querySelector('[data-film-open]');
const filmClose = document.querySelector('[data-film-close]');
const filmReplay = document.querySelector('[data-film-replay]');
let filmTimeline;
function playFilm() {
  filmTimeline?.kill();
  const frames = filmDialog.querySelectorAll('figure');
  const title = filmDialog.querySelector('.film-title');
  gsap.set([...frames, title], { opacity: 0 });
  if (reduceQuery.matches) {
    gsap.set(title, { opacity: 1 });
    return;
  }
  filmTimeline = gsap.timeline()
    .to(frames[0], { opacity: 1, duration: .6 })
    .to(frames[0], { scale: 1.05, duration: 2.2, ease: 'none' }, '<')
    .to(frames[0], { opacity: 0, duration: .35 })
    .to(frames[1], { opacity: 1, duration: .45 }, '<')
    .to(frames[1], { scale: 1.05, duration: 2.2, ease: 'none' }, '<')
    .to(frames[1], { opacity: 0, duration: .35 })
    .to(frames[2], { opacity: 1, duration: .45 }, '<')
    .to(frames[2], { scale: 1.05, duration: 2.2, ease: 'none' }, '<')
    .to(frames[2], { opacity: 0, duration: .4 })
    .to(title, { opacity: 1, duration: .6 }, '<');
}
filmOpen.addEventListener('click', () => { filmDialog.showModal(); playFilm(); filmClose.focus(); });
filmClose.addEventListener('click', () => { filmTimeline?.kill(); filmDialog.close(); filmOpen.focus(); });
filmReplay.addEventListener('click', playFilm);
filmDialog.addEventListener('cancel', () => filmTimeline?.kill());

addEventListener('popstate', () => {
  if (archiveCase) closeProject(true);
  else renderRoute({ restore: true });
});
addEventListener('hashchange', () => renderRoute({ restore: false }));
addEventListener('pagehide', () => { rememberScroll(); teardownPage(); filmTimeline?.kill(); });
addEventListener('pageshow', (event) => { if (event.persisted) renderRoute({ restore: true }); });

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
});
reduceQuery.addEventListener('change', () => {
  document.body.classList.toggle('is-reduced', reduceQuery.matches);
  renderRoute({ restore: true });
});
mobileQuery.addEventListener('change', () => renderRoute({ restore: true }));

bindRoutes();
document.fonts.ready.then(() => renderRoute({ restore: true }));
