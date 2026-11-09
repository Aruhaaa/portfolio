import type { Project } from './data';
import { esc, safeUrl } from './html';

/**
 * The film strip's markup, as one piece of HTML. The strip is driven by /assets/js/site.js, which builds the 3D
 * ribbon and changes this markup in place. Giving React the HTML as a block keeps React from trying to
 * "fix" those changes when the page loads.
 */
export function filmHtml(film: Project[], start: number): string {
  const frames = film
    .map((p, i) => {
      const pinned = p.is_hero;
      const live = safeUrl(p.link);
      const repo = safeUrl(p.repo_link);
      const stack = p.tech_stack ?? [];
      return `
        <li class="frame${pinned ? ' is-pinned' : ''}">
          <button type="button" class="frame-btn" aria-label="Show ${esc(p.title)}${pinned ? ' (pinned)' : ''}">
            <span class="frame-edge frame-edge-top" aria-hidden="true"><span class="frame-print">${esc(p.title)}</span></span>
            <span class="frame-pic">${
              p.image
                ? `<img src="${esc(p.image)}" alt="" loading="${i < 3 ? 'eager' : 'lazy'}" draggable="false">`
                : `<span class="frame-card">${esc(p.title)}</span>`
            }</span>
            <span class="frame-edge frame-edge-bottom" aria-hidden="true"><span class="frame-print">${esc(stack.join('  '))}</span></span>
          </button>
          <div class="frame-detail">
            <h3><span class="${pinned ? 'mark' : ''}">${esc(p.title)}</span>${pinned ? '<span class="visually-hidden"> (pinned)</span>' : ''}</h3>
            <p>${esc(p.description)}</p>
            ${stack.length ? `<ul class="stack stack-ink">${stack.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
            ${
              live || repo
                ? `<div class="frame-links">${
                    live ? `<a href="${esc(live)}" class="text-link" target="_blank" rel="noopener noreferrer">Open live site</a>` : ''
                  }${
                    repo ? `<a href="${esc(repo)}" class="text-link" target="_blank" rel="noopener noreferrer">View code on GitHub</a>` : ''
                  }</div>`
                : ''
            }
          </div>
        </li>`;
    })
    .join('');

  return `
    <div class="film-field" id="film-stage" role="group" aria-roledescription="carousel" aria-label="Selected projects. Focus a frame and use the arrow keys to move between them." data-start="${start}">
      <h2 class="visually-hidden">Selected projects</h2>
      <ul class="film-track">${frames}</ul>
    </div>
    <div class="film-panel">
      <div class="film-caption" id="film-caption" aria-live="polite" aria-atomic="true"></div>
      <div class="film-controls">
        <button type="button" class="film-step" id="film-prev" aria-label="Previous project">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M11.5 3 5.5 9l6 6"/></svg>
        </button>
        <button type="button" class="film-step" id="film-next" aria-label="Next project">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6.5 3 6 6-6 6"/></svg>
        </button>
        <p class="film-count" id="film-count" aria-hidden="true"></p>
        <a href="/projects" class="text-link film-all">All projects</a>
      </div>
    </div>`;
}
