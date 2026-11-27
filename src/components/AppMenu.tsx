import clsx from 'clsx';
import { ReactNode, useEffect, useState } from 'react';
import a16zImg from '../../assets/a16z.png';

/**
 * Responsive container for the app actions.
 *
 * Desktop keeps the original bottom bar. On phones the same DOM becomes a
 * slide-in drawer reached from a single floating button, so the map can own
 * the whole screen and the actions don't crowd it. Rendering one set of
 * children avoids mounting stateful buttons (music, freeze, interact) twice.
 */
export default function AppMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mobile-fab lg:hidden"
        aria-label={open ? '关闭菜单' : '打开菜单'}
        aria-expanded={open}
        aria-controls="app-menu-drawer"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <div
        className={clsx('mobile-backdrop lg:hidden', open && 'mobile-backdrop--open')}
        onClick={close}
        aria-hidden="true"
      />

      <footer
        id="app-menu-drawer"
        className={clsx(
          'app-footer mobile-drawer justify-end bottom-0 left-0 w-full flex items-center mt-2 gap-2 p-2 sm:mt-4 sm:gap-3 sm:p-6 flex-wrap pointer-events-none',
          open && 'mobile-drawer--open',
        )}
      >
        <div className="mobile-drawer-head lg:hidden">
          <span>菜单</span>
        </div>

        <div
          className="app-menu-items flex gap-2 sm:gap-4 flex-grow flex-wrap pointer-events-none"
          onClick={close}
        >
          {children}
        </div>

        <div className="mobile-drawer-brand lg:hidden">AI Town</div>

        <div className="app-menu-brands flex items-center gap-2">
          <a href="https://a16z.com">
            <img className="w-8 h-8 pointer-events-auto" src={a16zImg} alt="a16z" />
          </a>
        </div>
      </footer>
    </>
  );
}
