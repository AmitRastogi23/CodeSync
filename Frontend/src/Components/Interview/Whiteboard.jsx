import { useState, useEffect, useRef } from "react";
import { Excalidraw, CaptureUpdateAction } from "@excalidraw/excalidraw";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import "@excalidraw/excalidraw/index.css";
import "./Whiteboard.css";

const LOCAL_ORIGIN = "excalidraw-local";
const clone = (el) => JSON.parse(JSON.stringify(el));

const byIndex = (a, b) => {
  if (a.index && b.index)
    return a.index < b.index ? -1 : a.index > b.index ? 1 : 0;
  return 0;
};

// 👈 Stable color per user name
const PALETTE = [
  { background: "#C6F432", stroke: "#5c7a00" },
  { background: "#FFB3BA", stroke: "#c0392b" },
  { background: "#BAE1FF", stroke: "#1f6fb2" },
  { background: "#FFDFBA", stroke: "#c26a00" },
  { background: "#D5BAFF", stroke: "#6b3fb5" },
  { background: "#BAFFC9", stroke: "#1e8449" },
];
const colorForName = (name = "Anonymous") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

const Whiteboard = ({ roomId, userName }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const apiRef = useRef(null);
  const yMapRef = useRef(null);
  const awarenessRef = useRef(null);
  const lastPointerSend = useRef(0);
  const applyYjsToSceneRef = useRef(() => {});
  const updateCollaboratorsRef = useRef(() => {});

  // 1. Yjs setup
  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      import.meta.env.VITE_YJS_URL,
      roomId,
      ydoc,
    );
    const yMap = ydoc.getMap("excalidraw_elements");
    yMapRef.current = yMap;

    const awareness = provider.awareness;
    awarenessRef.current = awareness;

    awareness.setLocalStateField("user", {
      name: userName || "Anonymous",
      color: colorForName(userName),
    });

    // ---- element sync (unchanged) ----
    const applyYjsToScene = () => {
      const api = apiRef.current;
      if (!api) return;

      const localMap = new Map(
        api.getSceneElementsIncludingDeleted().map((el) => [el.id, el]),
      );
      const merged = new Map(localMap);
      let changed = false;

      yMap.forEach((remoteEl, id) => {
        const localEl = localMap.get(id);
        if (
          !localEl ||
          remoteEl.version > localEl.version ||
          (remoteEl.version === localEl.version &&
            remoteEl.versionNonce < localEl.versionNonce)
        ) {
          merged.set(id, clone(remoteEl));
          changed = true;
        }
      });

      if (!changed) return;

      api.updateScene({
        elements: Array.from(merged.values()).sort(byIndex),
        captureUpdate: CaptureUpdateAction.NEVER,
      });
    };
    applyYjsToSceneRef.current = applyYjsToScene;

    const observer = (_event, transaction) => {
      if (transaction.origin === LOCAL_ORIGIN) return;
      applyYjsToScene();
    };
    yMap.observe(observer);

    // ---- 👈 live cursors ----
    const updateCollaborators = () => {
      const api = apiRef.current;
      if (!api) return;

      const collaborators = new Map();
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === ydoc.clientID) return; // skip myself
        if (!state.user) return;

        collaborators.set(String(clientId), {
          pointer: state.pointer,
          button: state.button,
          username: state.user.name,
          color: state.user.color,
          selectedElementIds: {},
        });
      });

      api.updateScene({ collaborators });
    };
    updateCollaboratorsRef.current = updateCollaborators;
    awareness.on("change", updateCollaborators);

    return () => {
      awareness.off("change", updateCollaborators);
      yMap.unobserve(observer);
      provider.destroy();
      ydoc.destroy();
      yMapRef.current = null;
      awarenessRef.current = null;
      applyYjsToSceneRef.current = () => {};
      updateCollaboratorsRef.current = () => {};
    };
  }, [roomId, userName]);

  // 2. When Excalidraw API is ready, load existing content + existing cursors
  useEffect(() => {
    apiRef.current = excalidrawAPI;
    if (excalidrawAPI) {
      applyYjsToSceneRef.current();
      updateCollaboratorsRef.current(); // 👈
    }
  }, [excalidrawAPI]);

  // 3. Local -> Yjs (unchanged)
  const handleChange = (elements) => {
    const yMap = yMapRef.current;
    if (!yMap) return;

    const toWrite = [];
    for (const el of elements) {
      const old = yMap.get(el.id);
      if (!old || old.version < el.version) toWrite.push(el);
    }
    if (toWrite.length === 0) return;

    yMap.doc.transact(() => {
      toWrite.forEach((el) => yMap.set(el.id, clone(el)));
    }, LOCAL_ORIGIN);
  };

  // 4. 👈 My cursor -> awareness (throttled to ~30ms)
  const handlePointerUpdate = ({ pointer, button }) => {
    const awareness = awarenessRef.current;
    if (!awareness) return;

    const now = Date.now();
    if (button !== "down" && now - lastPointerSend.current < 30) return;
    lastPointerSend.current = now;

    awareness.setLocalStateField("pointer", pointer);
    awareness.setLocalStateField("button", button);
  };

  return (
    <div className="wb-container">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        theme="light"
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate} // 👈
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            saveAsImage: false,
          },
        }}
      />
    </div>
  );
};

export default Whiteboard;
