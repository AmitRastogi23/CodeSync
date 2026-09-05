import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

export const createCollaboration = (roomId, onLocalTyping) => {
  const doc = new Y.Doc();

  const provider = new WebsocketProvider("ws://localhost:1234", roomId, doc);

  const code = doc.getText("code");
  const output = doc.getText("output");
  const meta = doc.getMap("meta");

  provider.on("synced", () => {
    if (code.length === 0) {
      code.insert(0, "// start code here");
    }

    if (!meta.has("language")) {
      meta.set("language", "javascript");
    }
  });

  code.observe((event, transaction) => {
    if (transaction.origin instanceof MonacoBinding) {
      onLocalTyping?.();
    }
  });

  return {
    doc,
    provider,
    code,
    output,
    meta,
  };
};

export const bindMonaco = (editor, collaboration) => {
  const model = editor.getModel();

  return new MonacoBinding(
    collaboration.code,
    model,
    new Set([editor]),
    collaboration.provider.awareness,
  );
};

export const observeOutput = (doc, callback) => {
  const output = doc.getText("output");

  const observer = () => {
    callback(output.toString());
  };

  output.observe(observer);
  callback(output.toString());

  return () => {
    output.unobserve(observer);
  };
};

export const observeLanguage = (doc, callback) => {
  const meta = doc.getMap("meta");

  const updateLanguage = () => {
    callback(meta.get("language") || "javascript");
  };

  meta.observe(updateLanguage);
  updateLanguage();

  return () => {
    meta.unobserve(updateLanguage);
  };
};
