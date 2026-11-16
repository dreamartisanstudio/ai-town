import Game from './components/Game.tsx';

import { ToastContainer } from 'react-toastify';
import a16zImg from '../assets/a16z.png';
import convexImg from '../assets/convex.svg';
import starImg from '../assets/star.svg';
import helpImg from '../assets/help.svg';
// import { UserButton } from '@clerk/clerk-react';
// import { Authenticated, Unauthenticated } from 'convex/react';
// import LoginButton from './components/buttons/LoginButton.tsx';
import { useEffect, useState } from 'react';
import ReactModal from 'react-modal';
import MusicButton from './components/buttons/MusicButton.tsx';
import Button from './components/buttons/Button.tsx';
import InteractButton from './components/buttons/InteractButton.tsx';
import FreezeButton from './components/FreezeButton.tsx';
import { MAX_HUMAN_PLAYERS } from '../convex/constants.ts';
import PoweredByConvex from './components/PoweredByConvex.tsx';

export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // iOS/Android browser chrome and the on-screen keyboard change the usable
  // height without resizing the layout viewport; mirror the visual viewport
  // height so the map and chat panel stay fully visible.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return undefined;
    }
    const syncHeight = () => {
      document.documentElement.style.setProperty(
        '--app-height',
        `${Math.round(viewport.height)}px`,
      );
    };
    syncHeight();
    viewport.addEventListener('resize', syncHeight);
    return () => viewport.removeEventListener('resize', syncHeight);
  }, []);

  return (
    <main className="app-shell relative flex flex-col items-center justify-between font-body game-background">
      <PoweredByConvex />

      <ReactModal
        isOpen={helpModalOpen}
        onRequestClose={() => setHelpModalOpen(false)}
        style={modalStyles}
        contentLabel="帮助"
        ariaHideApp={false}
      >
        <div className="font-body">
          <h1 className="text-center text-4xl sm:text-6xl font-bold font-display game-title">
            帮助
          </h1>
          <p>
            欢迎来到 AI Town。AI Town 既支持匿名的<i>旁观者</i>，也支持登录后的
            <i>互动体验</i>。
          </p>
          <h2 className="text-2xl sm:text-4xl mt-4">旁观</h2>
          <p>按住鼠标拖动可以移动视角，滚动滚轮可以缩放。点击某个角色即可查看它的聊天记录。</p>
          <h2 className="text-2xl sm:text-4xl mt-4">互动</h2>
          <p>
            加入小镇后，你就可以直接和不同的 AI
            角色对话！点击“互动”按钮，你的角色会出现在地图的某个位置， 脚下会有一个高亮的圆圈。
          </p>
          <p className="text-2xl mt-2">操作说明：</p>
          <p className="mt-4">点击地面即可移动。</p>
          <p className="mt-4">
            想和某个角色对话时，先点击它，再点击“开始对话”，它会朝你走来。等它走到附近，对话就会开始，
            你们就可以互相交谈了。你可以随时关闭对话面板或走开来离开对话。它们也可能主动邀请你聊天——
            你会在消息面板里看到接受邀请的按钮。
          </p>
          <p className="mt-4">
            AI Town 同时最多支持 {MAX_HUMAN_PLAYERS} 位真人玩家。如果你连续五分钟没有操作，
            系统会自动将你移出小镇。
          </p>
        </div>
      </ReactModal>
      {/*<div className="p-3 absolute top-0 right-0 z-10 text-2xl">
        <Authenticated>
          <UserButton afterSignOutUrl="/ai-town" />
        </Authenticated>

        <Unauthenticated>
          <LoginButton />
        </Unauthenticated>
      </div> */}

      <div className="relative isolate flex h-full min-h-0 w-full flex-col justify-start overflow-hidden shadow-2xl lg:h-screen lg:p-8">
        <h1 className="app-title mx-auto text-3xl p-2 sm:text-8xl sm:p-3 lg:text-9xl font-bold font-display leading-none tracking-wide game-title w-full text-left sm:text-center sm:w-auto">
          AI Town
        </h1>

        <div className="app-tagline max-w-xs md:max-w-xl lg:max-w-none mx-auto my-4 text-center text-base sm:text-xl md:text-2xl text-white leading-tight shadow-solid">
          一个由 AI 角色生活、聊天和社交的虚拟小镇。
          {/* <Unauthenticated>
            <div className="my-1.5 sm:my-0" />
            Log in to join the town
            <br className="block sm:hidden" /> and the conversation!
          </Unauthenticated> */}
        </div>

        <Game />

        <footer className="app-footer justify-end bottom-0 left-0 w-full flex items-center mt-2 gap-2 p-2 sm:mt-4 sm:gap-3 sm:p-6 flex-wrap pointer-events-none">
          <div className="flex gap-2 sm:gap-4 flex-grow flex-wrap pointer-events-none">
            <FreezeButton />
            <MusicButton />
            <Button href="https://github.com/a16z-infra/ai-town" imgUrl={starImg}>
              收藏
            </Button>
            <InteractButton />
            <Button imgUrl={helpImg} onClick={() => setHelpModalOpen(true)}>
              帮助
            </Button>
          </div>
          <a href="https://a16z.com">
            <img className="w-8 h-8 pointer-events-auto" src={a16zImg} alt="a16z" />
          </a>
          <a href="https://convex.dev/c/ai-town">
            <img className="w-20 h-8 pointer-events-auto" src={convexImg} alt="Convex" />
          </a>
        </footer>
        <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
      </div>
    </main>
  );
}

const modalStyles: ReactModal.Styles = {
  overlay: {
    backgroundColor: 'rgb(0, 0, 0, 75%)',
    zIndex: 12,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '92vw',
    maxWidth: '40rem',
    maxHeight: '86dvh',
    overflowY: 'auto',

    border: '10px solid rgb(23, 20, 33)',
    borderRadius: '0',
    background: 'rgb(35, 38, 58)',
    color: 'white',
    fontFamily: '"Upheaval Pro", "sans-serif"',
  },
};
