var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});
var _validatedData, _matchResult, _HonoRequest_instances, getDecodedParam_fn, getAllDecodedParams_fn, getParamValue_fn, _cachedBody, _a2, _rawRequest, _req, _var, _status, _executionCtx, _res, _layout, _renderer2, _notFoundHandler, _preparedHeaders, _matchResult2, _path, _Context_instances, newResponse_fn, _b, _path2, __Hono_instances, clone_fn, _notFoundHandler2, addRoute_fn, handleError_fn, dispatch_fn, _c, _index, _varIndex, _children, _d, _context, _root, _e, _middleware, _routes, _RegExpRouter_instances, buildMatcher_fn, _f, _routers, _routes2, _g, _methods, _children2, _patterns, _order, _params, __Node_instances, getHandlerSets_fn, _h, _node, _i, _defaultAppOptions, _j;
import { createServer } from "http";
import { existsSync, statSync, createReadStream } from "fs";
import { join } from "path";
import { versions } from "process";
import { Readable } from "stream";
import { WebSocketServer } from "ws";
import { execa } from "execa";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
var getMimeType = (filename, mimes = baseMimes) => {
  const regexp = /\.([a-zA-Z0-9]+?)$/;
  const match2 = filename.match(regexp);
  if (!match2) {
    return;
  }
  let mimeType = mimes[match2[1]];
  if (mimeType && mimeType.startsWith("text")) {
    mimeType += "; charset=utf-8";
  }
  return mimeType;
};
var _baseMimes = {
  aac: "audio/aac",
  avi: "video/x-msvideo",
  avif: "image/avif",
  av1: "video/av1",
  bin: "application/octet-stream",
  bmp: "image/bmp",
  css: "text/css",
  csv: "text/csv",
  eot: "application/vnd.ms-fontobject",
  epub: "application/epub+zip",
  gif: "image/gif",
  gz: "application/gzip",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  ics: "text/calendar",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript",
  json: "application/json",
  jsonld: "application/ld+json",
  map: "application/json",
  mid: "audio/x-midi",
  midi: "audio/x-midi",
  mjs: "text/javascript",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpeg: "video/mpeg",
  oga: "audio/ogg",
  ogv: "video/ogg",
  ogx: "application/ogg",
  opus: "audio/opus",
  otf: "font/otf",
  pdf: "application/pdf",
  png: "image/png",
  rtf: "application/rtf",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  ts: "video/mp2t",
  ttf: "font/ttf",
  txt: "text/plain",
  wasm: "application/wasm",
  webm: "video/webm",
  weba: "audio/webm",
  webmanifest: "application/manifest+json",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  xhtml: "application/xhtml+xml",
  xml: "application/xml",
  zip: "application/zip",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  gltf: "model/gltf+json",
  glb: "model/gltf-binary"
};
var baseMimes = _baseMimes;
var COMPRESSIBLE_CONTENT_TYPE_REGEX = /^\s*(?:text\/[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i;
var ENCODINGS = {
  br: ".br",
  zstd: ".zst",
  gzip: ".gz"
};
var ENCODINGS_ORDERED_KEYS = Object.keys(ENCODINGS);
var pr54206Applied = () => {
  const [major, minor] = versions.node.split(".").map((component) => parseInt(component));
  return major >= 23 || major === 22 && minor >= 7 || major === 20 && minor >= 18;
};
var useReadableToWeb = pr54206Applied();
var createStreamBody = (stream) => {
  if (useReadableToWeb) {
    return Readable.toWeb(stream);
  }
  const body = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      stream.on("error", (err) => {
        controller.error(err);
      });
      stream.on("end", () => {
        controller.close();
      });
    },
    cancel() {
      stream.destroy();
    }
  });
  return body;
};
var getStats = (path2) => {
  let stats;
  try {
    stats = statSync(path2);
  } catch {
  }
  return stats;
};
var serveStatic = (options = { root: "" }) => {
  const root = options.root || "";
  const optionPath = options.path;
  if (root !== "" && !existsSync(root)) {
    console.error(`serveStatic: root path '${root}' is not found, are you sure it's correct?`);
  }
  return async (c, next) => {
    var _a3, _b2, _c2, _d2;
    if (c.finalized) {
      return next();
    }
    let filename;
    if (optionPath) {
      filename = optionPath;
    } else {
      try {
        filename = decodeURIComponent(c.req.path);
        if (/(?:^|[\/\\])\.\.(?:$|[\/\\])/.test(filename)) {
          throw new Error();
        }
      } catch {
        await ((_a3 = options.onNotFound) == null ? void 0 : _a3.call(options, c.req.path, c));
        return next();
      }
    }
    let path2 = join(
      root,
      !optionPath && options.rewriteRequestPath ? options.rewriteRequestPath(filename, c) : filename
    );
    let stats = getStats(path2);
    if (stats && stats.isDirectory()) {
      const indexFile = options.index ?? "index.html";
      path2 = join(path2, indexFile);
      stats = getStats(path2);
    }
    if (!stats) {
      await ((_b2 = options.onNotFound) == null ? void 0 : _b2.call(options, path2, c));
      return next();
    }
    const mimeType = getMimeType(path2);
    c.header("Content-Type", mimeType || "application/octet-stream");
    if (options.precompressed && (!mimeType || COMPRESSIBLE_CONTENT_TYPE_REGEX.test(mimeType))) {
      const acceptEncodingSet = new Set(
        (_c2 = c.req.header("Accept-Encoding")) == null ? void 0 : _c2.split(",").map((encoding) => encoding.trim())
      );
      for (const encoding of ENCODINGS_ORDERED_KEYS) {
        if (!acceptEncodingSet.has(encoding)) {
          continue;
        }
        const precompressedStats = getStats(path2 + ENCODINGS[encoding]);
        if (precompressedStats) {
          c.header("Content-Encoding", encoding);
          c.header("Vary", "Accept-Encoding", { append: true });
          stats = precompressedStats;
          path2 = path2 + ENCODINGS[encoding];
          break;
        }
      }
    }
    let result;
    const size = stats.size;
    const range = c.req.header("range") || "";
    if (c.req.method == "HEAD" || c.req.method == "OPTIONS") {
      c.header("Content-Length", size.toString());
      c.status(200);
      result = c.body(null);
    } else if (!range) {
      c.header("Content-Length", size.toString());
      result = c.body(createStreamBody(createReadStream(path2)), 200);
    } else {
      c.header("Accept-Ranges", "bytes");
      c.header("Date", stats.birthtime.toUTCString());
      const parts = range.replace(/bytes=/, "").split("-", 2);
      const start = parseInt(parts[0], 10) || 0;
      let end = parseInt(parts[1], 10) || size - 1;
      if (size < end - start + 1) {
        end = size - 1;
      }
      const chunksize = end - start + 1;
      const stream = createReadStream(path2, { start, end });
      c.header("Content-Length", chunksize.toString());
      c.header("Content-Range", `bytes ${start}-${end}/${stats.size}`);
      result = c.body(createStreamBody(stream), 206);
    }
    await ((_d2 = options.onFound) == null ? void 0 : _d2.call(options, path2, c));
    return result;
  };
};
function setupWebSocket(server2) {
  const wss = new WebSocketServer({ noServer: true });
  server2.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
    if (pathname === "/ws/oauth-login") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
        handleOAuthLogin(ws);
      });
    } else {
      socket.destroy();
    }
  });
  return wss;
}
function handleOAuthLogin(ws) {
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { provider, type } = data;
      if (!type && provider) {
        if (!provider) {
          ws.send(JSON.stringify({ type: "error", message: "请指定模型提供商" }));
          return;
        }
        try {
          const pty = await import("node-pty");
          let command;
          let ptyProvider;
          if (provider === "gpt") {
            command = "openclaw onboard --flow quickstart --auth-choice openai-codex --skip-channels --skip-skills --skip-health --skip-daemon --no-install-daemon --skip-ui";
            ptyProvider = "gpt";
          } else if (provider === "qwen") {
            command = "openclaw models auth login --provider qwen-portal --set-default";
            ptyProvider = "qwen";
          } else {
            ws.send(JSON.stringify({ type: "error", message: "不支持的提供商" }));
            return;
          }
          const shPath = process.env.SHELL || "/bin/sh";
          const home = process.env.HOME || process.cwd();
          const env = {
            ...process.env,
            PATH: process.env.PATH || `${home}/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`,
            TERM: process.env.TERM || "xterm-256color"
          };
          let shell;
          try {
            const ptyFile = shPath;
            const ptyArgs = ["-lc", command];
            shell = pty.spawn(ptyFile, ptyArgs, {
              name: "xterm-color",
              cols: 80,
              rows: 30,
              cwd: home,
              env
            });
            shell.onData((data2) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: "output", data: data2 }));
              }
            });
            shell.onExit(({ exitCode }) => {
              if (ws.readyState === ws.OPEN) {
                if (exitCode === 0) {
                  ws.send(JSON.stringify({ type: "success", message: "登录成功！" }));
                } else {
                  ws.send(
                    JSON.stringify({
                      type: "error",
                      message: `命令执行失败 (退出码: ${exitCode})`
                    })
                  );
                }
                setTimeout(() => ws.close(), 1e3);
              }
            });
          } catch (err) {
            const { spawn } = await import("child_process");
            const home2 = process.env.HOME || process.cwd();
            const shPath2 = process.env.SHELL || "/bin/sh";
            const env2 = {
              ...process.env,
              PATH: process.env.PATH || `${home2}/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`,
              TERM: process.env.TERM || "xterm-256color"
            };
            const fallbackFile = shPath2;
            const fallbackArgs = ["-lc", command];
            const scriptPath = "/usr/bin/script";
            const child = spawn(scriptPath, ["-q", "/dev/null", fallbackFile, ...fallbackArgs], {
              cwd: home2,
              env: env2
            });
            child.stdout.on("data", (data2) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: "output", data: data2.toString() }));
              }
            });
            child.stderr.on("data", (data2) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: "output", data: data2.toString() }));
              }
            });
            child.on("close", (code) => {
              if (ws.readyState === ws.OPEN) {
                if (code === 0) {
                  ws.send(JSON.stringify({ type: "success", message: "登录成功！" }));
                } else {
                  const msg = (err == null ? void 0 : err.message) ? `，pty 启动失败: ${err.message}` : "";
                  ws.send(
                    JSON.stringify({
                      type: "error",
                      message: `命令执行失败 (退出码: ${code})${msg}`
                    })
                  );
                }
                setTimeout(() => ws.close(), 1e3);
              }
            });
          }
          ws.on("message", (msg) => {
            try {
              const inputData = JSON.parse(msg.toString());
              if (inputData.type === "input" && shell) {
                shell.write(inputData.data);
              }
            } catch {
            }
          });
        } catch (error) {
          ws.send(JSON.stringify({ type: "error", message: "启动终端失败: " + error.message }));
          ws.close();
        }
      }
    } catch (error) {
      console.error("WebSocket 消息处理错误:", error);
    }
  });
  ws.on("close", () => {
    console.log("WebSocket 连接已关闭");
  });
  ws.on("error", (error) => {
    console.error("WebSocket 错误:", error);
  });
}
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index2 = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index2) {
        throw new Error("next() called multiple times");
      }
      index2 = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if ((contentType == null ? void 0 : contentType.startsWith("multipart/form-data")) || (contentType == null ? void 0 : contentType.startsWith("application/x-www-form-urlencoded"))) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form2 = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form2[key] = value;
    } else {
      handleParsingAllValues(form2, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form2).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form2, key, value);
        delete form2[key];
      }
    });
  }
  return form2;
}
var handleParsingAllValues = (form2, key, value) => {
  if (form2[key] !== void 0) {
    if (Array.isArray(form2[key])) {
      form2[key].push(value);
    } else {
      form2[key] = [form2[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form2[key] = value;
    } else {
      form2[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form2, key, value) => {
  let nestedForm = form2;
  const keys = key.split(".");
  keys.forEach((key2, index2) => {
    if (index2 === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var splitPath = (path2) => {
  const paths = path2.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path: path2 } = extractGroupsFromPath(routePath);
  const paths = splitPath(path2);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path2) => {
  const groups = [];
  path2 = path2.replace(/\{[^}]+\}/g, (match2, index2) => {
    const mark = `@${index2}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path: path2 };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path2 = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path2.includes("%25") ? path2.replace(/%25/g, "%2525") : path2);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base2, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${(base2 == null ? void 0 : base2[0]) === "/" ? "" : "/"}${base2}${sub === "/" ? "" : `${(base2 == null ? void 0 : base2.at(-1)) === "/" ? "" : "/"}${(sub == null ? void 0 : sub[0]) === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path2) => {
  if (path2.charCodeAt(path2.length - 1) !== 63 || !path2.includes(":")) {
    return null;
  }
  const segments = path2.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ?? (encoded = /[%+]/.test(url));
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      results[name].push(value);
    } else {
      results[name] ?? (results[name] = value);
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = (_a2 = class {
  constructor(request, path2 = "/", matchResult = [[]]) {
    __privateAdd(this, _HonoRequest_instances);
    /**
     * `.raw` can get the raw Request object.
     *
     * @see {@link https://hono.dev/docs/api/request#raw}
     *
     * @example
     * ```ts
     * // For Cloudflare Workers
     * app.post('/', async (c) => {
     *   const metadata = c.req.raw.cf?.hostMetadata?
     *   ...
     * })
     * ```
     */
    __publicField(this, "raw");
    __privateAdd(this, _validatedData);
    // Short name of validatedData
    __privateAdd(this, _matchResult);
    __publicField(this, "routeIndex", 0);
    /**
     * `.path` can get the pathname of the request.
     *
     * @see {@link https://hono.dev/docs/api/request#path}
     *
     * @example
     * ```ts
     * app.get('/about/me', (c) => {
     *   const pathname = c.req.path // `/about/me`
     * })
     * ```
     */
    __publicField(this, "path");
    __publicField(this, "bodyCache", {});
    __privateAdd(this, _cachedBody, (key) => {
      const { bodyCache, raw: raw2 } = this;
      const cachedBody = bodyCache[key];
      if (cachedBody) {
        return cachedBody;
      }
      const anyCachedKey = Object.keys(bodyCache)[0];
      if (anyCachedKey) {
        return bodyCache[anyCachedKey].then((body) => {
          if (anyCachedKey === "json") {
            body = JSON.stringify(body);
          }
          return new Response(body)[key]();
        });
      }
      return bodyCache[key] = raw2[key]();
    });
    this.raw = request;
    this.path = path2;
    __privateSet(this, _matchResult, matchResult);
    __privateSet(this, _validatedData, {});
  }
  param(key) {
    return key ? __privateMethod(this, _HonoRequest_instances, getDecodedParam_fn).call(this, key) : __privateMethod(this, _HonoRequest_instances, getAllDecodedParams_fn).call(this);
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    var _a3;
    return (_a3 = this.bodyCache).parsedBody ?? (_a3.parsedBody = await parseBody(this, options));
  }
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return __privateGet(this, _cachedBody).call(this, "text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return __privateGet(this, _cachedBody).call(this, "text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return __privateGet(this, _cachedBody).call(this, "arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return __privateGet(this, _cachedBody).call(this, "blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return __privateGet(this, _cachedBody).call(this, "formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    __privateGet(this, _validatedData)[target] = data;
  }
  valid(target) {
    return __privateGet(this, _validatedData)[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return __privateGet(this, _matchResult);
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return __privateGet(this, _matchResult)[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return __privateGet(this, _matchResult)[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, _validatedData = new WeakMap(), _matchResult = new WeakMap(), _HonoRequest_instances = new WeakSet(), getDecodedParam_fn = function(key) {
  const paramKey = __privateGet(this, _matchResult)[0][this.routeIndex][1][key];
  const param = __privateMethod(this, _HonoRequest_instances, getParamValue_fn).call(this, paramKey);
  return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
}, getAllDecodedParams_fn = function() {
  const decoded = {};
  const keys = Object.keys(__privateGet(this, _matchResult)[0][this.routeIndex][1]);
  for (const key of keys) {
    const value = __privateMethod(this, _HonoRequest_instances, getParamValue_fn).call(this, __privateGet(this, _matchResult)[0][this.routeIndex][1][key]);
    if (value !== void 0) {
      decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
    }
  }
  return decoded;
}, getParamValue_fn = function(paramKey) {
  return __privateGet(this, _matchResult)[1] ? __privateGet(this, _matchResult)[1][paramKey] : paramKey;
}, _cachedBody = new WeakMap(), _a2);
var HtmlEscapedCallbackPhase = {
  Stringify: 1
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var escapeRe = /[&<>'"]/;
var stringBufferToString = async (buffer, callbacks) => {
  let str = "";
  callbacks || (callbacks = []);
  const resolvedBuffer = await Promise.all(buffer);
  for (let i = resolvedBuffer.length - 1; ; i--) {
    str += resolvedBuffer[i];
    i--;
    if (i < 0) {
      break;
    }
    let r = resolvedBuffer[i];
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    const isEscaped = r.isEscaped;
    r = await (typeof r === "object" ? r.toString() : r);
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    if (r.isEscaped ?? isEscaped) {
      str += r;
    } else {
      const buf = [str];
      escapeToBuffer(r, buf);
      str = buf[0];
    }
  }
  return raw(str, callbacks);
};
var escapeToBuffer = (str, buffer) => {
  const match2 = str.search(escapeRe);
  if (match2 === -1) {
    buffer[0] += str;
    return;
  }
  let escape;
  let index2;
  let lastIndex = 0;
  for (index2 = match2; index2 < str.length; index2++) {
    switch (str.charCodeAt(index2)) {
      case 34:
        escape = "&quot;";
        break;
      case 39:
        escape = "&#39;";
        break;
      case 38:
        escape = "&amp;";
        break;
      case 60:
        escape = "&lt;";
        break;
      case 62:
        escape = "&gt;";
        break;
      default:
        continue;
    }
    buffer[0] += str.substring(lastIndex, index2) + escape;
    lastIndex = index2 + 1;
  }
  buffer[0] += str.substring(lastIndex, index2);
};
var resolveCallbackSync = (str) => {
  const callbacks = str.callbacks;
  if (!(callbacks == null ? void 0 : callbacks.length)) {
    return str;
  }
  const buffer = [str];
  const context = {};
  callbacks.forEach((c) => c({ phase: HtmlEscapedCallbackPhase.Stringify, buffer, context }));
  return buffer[0];
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!(callbacks == null ? void 0 : callbacks.length)) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  {
    return resStr;
  }
};
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var Context = (_b = class {
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    __privateAdd(this, _Context_instances);
    __privateAdd(this, _rawRequest);
    __privateAdd(this, _req);
    /**
     * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
     *
     * @see {@link https://hono.dev/docs/api/context#env}
     *
     * @example
     * ```ts
     * // Environment object for Cloudflare Workers
     * app.get('*', async c => {
     *   const counter = c.env.COUNTER
     * })
     * ```
     */
    __publicField(this, "env", {});
    __privateAdd(this, _var);
    __publicField(this, "finalized", false);
    /**
     * `.error` can get the error object from the middleware if the Handler throws an error.
     *
     * @see {@link https://hono.dev/docs/api/context#error}
     *
     * @example
     * ```ts
     * app.use('*', async (c, next) => {
     *   await next()
     *   if (c.error) {
     *     // do something...
     *   }
     * })
     * ```
     */
    __publicField(this, "error");
    __privateAdd(this, _status);
    __privateAdd(this, _executionCtx);
    __privateAdd(this, _res);
    __privateAdd(this, _layout);
    __privateAdd(this, _renderer2);
    __privateAdd(this, _notFoundHandler);
    __privateAdd(this, _preparedHeaders);
    __privateAdd(this, _matchResult2);
    __privateAdd(this, _path);
    /**
     * `.render()` can create a response within a layout.
     *
     * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
     *
     * @example
     * ```ts
     * app.get('/', (c) => {
     *   return c.render('Hello!')
     * })
     * ```
     */
    __publicField(this, "render", (...args) => {
      __privateGet(this, _renderer2) ?? __privateSet(this, _renderer2, (content) => this.html(content));
      return __privateGet(this, _renderer2).call(this, ...args);
    });
    /**
     * Sets the layout for the response.
     *
     * @param layout - The layout to set.
     * @returns The layout function.
     */
    __publicField(this, "setLayout", (layout) => __privateSet(this, _layout, layout));
    /**
     * Gets the current layout for the response.
     *
     * @returns The current layout function.
     */
    __publicField(this, "getLayout", () => __privateGet(this, _layout));
    /**
     * `.setRenderer()` can set the layout in the custom middleware.
     *
     * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
     *
     * @example
     * ```tsx
     * app.use('*', async (c, next) => {
     *   c.setRenderer((content) => {
     *     return c.html(
     *       <html>
     *         <body>
     *           <p>{content}</p>
     *         </body>
     *       </html>
     *     )
     *   })
     *   await next()
     * })
     * ```
     */
    __publicField(this, "setRenderer", (renderer) => {
      __privateSet(this, _renderer2, renderer);
    });
    /**
     * `.header()` can set headers.
     *
     * @see {@link https://hono.dev/docs/api/context#header}
     *
     * @example
     * ```ts
     * app.get('/welcome', (c) => {
     *   // Set headers
     *   c.header('X-Message', 'Hello!')
     *   c.header('Content-Type', 'text/plain')
     *
     *   return c.body('Thank you for coming')
     * })
     * ```
     */
    __publicField(this, "header", (name, value, options) => {
      if (this.finalized) {
        __privateSet(this, _res, new Response(__privateGet(this, _res).body, __privateGet(this, _res)));
      }
      const headers = __privateGet(this, _res) ? __privateGet(this, _res).headers : __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, new Headers());
      if (value === void 0) {
        headers.delete(name);
      } else if (options == null ? void 0 : options.append) {
        headers.append(name, value);
      } else {
        headers.set(name, value);
      }
    });
    __publicField(this, "status", (status) => {
      __privateSet(this, _status, status);
    });
    /**
     * `.set()` can set the value specified by the key.
     *
     * @see {@link https://hono.dev/docs/api/context#set-get}
     *
     * @example
     * ```ts
     * app.use('*', async (c, next) => {
     *   c.set('message', 'Hono is hot!!')
     *   await next()
     * })
     * ```
     */
    __publicField(this, "set", (key, value) => {
      __privateGet(this, _var) ?? __privateSet(this, _var, /* @__PURE__ */ new Map());
      __privateGet(this, _var).set(key, value);
    });
    /**
     * `.get()` can use the value specified by the key.
     *
     * @see {@link https://hono.dev/docs/api/context#set-get}
     *
     * @example
     * ```ts
     * app.get('/', (c) => {
     *   const message = c.get('message')
     *   return c.text(`The message is "${message}"`)
     * })
     * ```
     */
    __publicField(this, "get", (key) => {
      return __privateGet(this, _var) ? __privateGet(this, _var).get(key) : void 0;
    });
    __publicField(this, "newResponse", (...args) => __privateMethod(this, _Context_instances, newResponse_fn).call(this, ...args));
    /**
     * `.body()` can return the HTTP response.
     * You can set headers with `.header()` and set HTTP status code with `.status`.
     * This can also be set in `.text()`, `.json()` and so on.
     *
     * @see {@link https://hono.dev/docs/api/context#body}
     *
     * @example
     * ```ts
     * app.get('/welcome', (c) => {
     *   // Set headers
     *   c.header('X-Message', 'Hello!')
     *   c.header('Content-Type', 'text/plain')
     *   // Set HTTP status code
     *   c.status(201)
     *
     *   // Return the response body
     *   return c.body('Thank you for coming')
     * })
     * ```
     */
    __publicField(this, "body", (data, arg, headers) => __privateMethod(this, _Context_instances, newResponse_fn).call(this, data, arg, headers));
    /**
     * `.text()` can render text as `Content-Type:text/plain`.
     *
     * @see {@link https://hono.dev/docs/api/context#text}
     *
     * @example
     * ```ts
     * app.get('/say', (c) => {
     *   return c.text('Hello!')
     * })
     * ```
     */
    __publicField(this, "text", (text, arg, headers) => {
      return !__privateGet(this, _preparedHeaders) && !__privateGet(this, _status) && !arg && !headers && !this.finalized ? new Response(text) : __privateMethod(this, _Context_instances, newResponse_fn).call(this, text, arg, setDefaultContentType(TEXT_PLAIN, headers));
    });
    /**
     * `.json()` can render JSON as `Content-Type:application/json`.
     *
     * @see {@link https://hono.dev/docs/api/context#json}
     *
     * @example
     * ```ts
     * app.get('/api', (c) => {
     *   return c.json({ message: 'Hello!' })
     * })
     * ```
     */
    __publicField(this, "json", (object, arg, headers) => {
      return __privateMethod(this, _Context_instances, newResponse_fn).call(this, JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
    });
    __publicField(this, "html", (html2, arg, headers) => {
      const res = (html22) => __privateMethod(this, _Context_instances, newResponse_fn).call(this, html22, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
      return typeof html2 === "object" ? resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html2);
    });
    /**
     * `.redirect()` can Redirect, default status code is 302.
     *
     * @see {@link https://hono.dev/docs/api/context#redirect}
     *
     * @example
     * ```ts
     * app.get('/redirect', (c) => {
     *   return c.redirect('/')
     * })
     * app.get('/redirect-permanently', (c) => {
     *   return c.redirect('/', 301)
     * })
     * ```
     */
    __publicField(this, "redirect", (location, status) => {
      const locationString = String(location);
      this.header(
        "Location",
        // Multibyes should be encoded
        // eslint-disable-next-line no-control-regex
        !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
      );
      return this.newResponse(null, status ?? 302);
    });
    /**
     * `.notFound()` can return the Not Found Response.
     *
     * @see {@link https://hono.dev/docs/api/context#notfound}
     *
     * @example
     * ```ts
     * app.get('/notfound', (c) => {
     *   return c.notFound()
     * })
     * ```
     */
    __publicField(this, "notFound", () => {
      __privateGet(this, _notFoundHandler) ?? __privateSet(this, _notFoundHandler, () => new Response());
      return __privateGet(this, _notFoundHandler).call(this, this);
    });
    __privateSet(this, _rawRequest, req);
    if (options) {
      __privateSet(this, _executionCtx, options.executionCtx);
      this.env = options.env;
      __privateSet(this, _notFoundHandler, options.notFoundHandler);
      __privateSet(this, _path, options.path);
      __privateSet(this, _matchResult2, options.matchResult);
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    __privateGet(this, _req) ?? __privateSet(this, _req, new HonoRequest(__privateGet(this, _rawRequest), __privateGet(this, _path), __privateGet(this, _matchResult2)));
    return __privateGet(this, _req);
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (__privateGet(this, _executionCtx) && "respondWith" in __privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (__privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return __privateGet(this, _res) || __privateSet(this, _res, new Response(null, {
      headers: __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, new Headers())
    }));
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res2) {
    if (__privateGet(this, _res) && _res2) {
      _res2 = new Response(_res2.body, _res2);
      for (const [k, v] of __privateGet(this, _res).headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = __privateGet(this, _res).headers.getSetCookie();
          _res2.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res2.headers.append("set-cookie", cookie);
          }
        } else {
          _res2.headers.set(k, v);
        }
      }
    }
    __privateSet(this, _res, _res2);
    this.finalized = true;
  }
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!__privateGet(this, _var)) {
      return {};
    }
    return Object.fromEntries(__privateGet(this, _var));
  }
}, _rawRequest = new WeakMap(), _req = new WeakMap(), _var = new WeakMap(), _status = new WeakMap(), _executionCtx = new WeakMap(), _res = new WeakMap(), _layout = new WeakMap(), _renderer2 = new WeakMap(), _notFoundHandler = new WeakMap(), _preparedHeaders = new WeakMap(), _matchResult2 = new WeakMap(), _path = new WeakMap(), _Context_instances = new WeakSet(), newResponse_fn = function(data, arg, headers) {
  const responseHeaders = __privateGet(this, _res) ? new Headers(__privateGet(this, _res).headers) : __privateGet(this, _preparedHeaders) ?? new Headers();
  if (typeof arg === "object" && "headers" in arg) {
    const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
    for (const [key, value] of argHeaders) {
      if (key.toLowerCase() === "set-cookie") {
        responseHeaders.append(key, value);
      } else {
        responseHeaders.set(key, value);
      }
    }
  }
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === "string") {
        responseHeaders.set(k, v);
      } else {
        responseHeaders.delete(k);
        for (const v2 of v) {
          responseHeaders.append(k, v2);
        }
      }
    }
  }
  const status = typeof arg === "number" ? arg : (arg == null ? void 0 : arg.status) ?? __privateGet(this, _status);
  return new Response(data, { status, headers: responseHeaders });
}, _b);
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS$1 = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono$1 = (_c = class {
  constructor(options = {}) {
    __privateAdd(this, __Hono_instances);
    __publicField(this, "get");
    __publicField(this, "post");
    __publicField(this, "put");
    __publicField(this, "delete");
    __publicField(this, "options");
    __publicField(this, "patch");
    __publicField(this, "all");
    __publicField(this, "on");
    __publicField(this, "use");
    /*
      This class is like an abstract class and does not have a router.
      To use it, inherit the class and implement router in the constructor.
    */
    __publicField(this, "router");
    __publicField(this, "getPath");
    // Cannot use `#` because it requires visibility at JavaScript runtime.
    __publicField(this, "_basePath", "/");
    __privateAdd(this, _path2, "/");
    __publicField(this, "routes", []);
    __privateAdd(this, _notFoundHandler2, notFoundHandler);
    // Cannot use `#` because it requires visibility at JavaScript runtime.
    __publicField(this, "errorHandler", errorHandler);
    /**
     * `.onError()` handles an error and returns a customized Response.
     *
     * @see {@link https://hono.dev/docs/api/hono#error-handling}
     *
     * @param {ErrorHandler} handler - request Handler for error
     * @returns {Hono} changed Hono instance
     *
     * @example
     * ```ts
     * app.onError((err, c) => {
     *   console.error(`${err}`)
     *   return c.text('Custom Error Message', 500)
     * })
     * ```
     */
    __publicField(this, "onError", (handler) => {
      this.errorHandler = handler;
      return this;
    });
    /**
     * `.notFound()` allows you to customize a Not Found Response.
     *
     * @see {@link https://hono.dev/docs/api/hono#not-found}
     *
     * @param {NotFoundHandler} handler - request handler for not-found
     * @returns {Hono} changed Hono instance
     *
     * @example
     * ```ts
     * app.notFound((c) => {
     *   return c.text('Custom 404 Message', 404)
     * })
     * ```
     */
    __publicField(this, "notFound", (handler) => {
      __privateSet(this, _notFoundHandler2, handler);
      return this;
    });
    /**
     * `.fetch()` will be entry point of your app.
     *
     * @see {@link https://hono.dev/docs/api/hono#fetch}
     *
     * @param {Request} request - request Object of request
     * @param {Env} Env - env Object
     * @param {ExecutionContext} - context of execution
     * @returns {Response | Promise<Response>} response of request
     *
     */
    __publicField(this, "fetch", (request, ...rest) => {
      return __privateMethod(this, __Hono_instances, dispatch_fn).call(this, request, rest[1], rest[0], request.method);
    });
    /**
     * `.request()` is a useful method for testing.
     * You can pass a URL or pathname to send a GET request.
     * app will return a Response object.
     * ```ts
     * test('GET /hello is ok', async () => {
     *   const res = await app.request('/hello')
     *   expect(res.status).toBe(200)
     * })
     * ```
     * @see https://hono.dev/docs/api/hono#request
     */
    __publicField(this, "request", (input2, requestInit, Env, executionCtx) => {
      if (input2 instanceof Request) {
        return this.fetch(requestInit ? new Request(input2, requestInit) : input2, Env, executionCtx);
      }
      input2 = input2.toString();
      return this.fetch(
        new Request(
          /^https?:\/\//.test(input2) ? input2 : `http://localhost${mergePath("/", input2)}`,
          requestInit
        ),
        Env,
        executionCtx
      );
    });
    /**
     * `.fire()` automatically adds a global fetch event listener.
     * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
     * @deprecated
     * Use `fire` from `hono/service-worker` instead.
     * ```ts
     * import { Hono } from 'hono'
     * import { fire } from 'hono/service-worker'
     *
     * const app = new Hono()
     * // ...
     * fire(app)
     * ```
     * @see https://hono.dev/docs/api/hono#fire
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
     * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
     */
    __publicField(this, "fire", () => {
      addEventListener("fetch", (event) => {
        event.respondWith(__privateMethod(this, __Hono_instances, dispatch_fn).call(this, event.request, event, void 0, event.request.method));
      });
    });
    const allMethods = [...METHODS$1, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          __privateSet(this, _path2, args1);
        } else {
          __privateMethod(this, __Hono_instances, addRoute_fn).call(this, method, __privateGet(this, _path2), args1);
        }
        args.forEach((handler) => {
          __privateMethod(this, __Hono_instances, addRoute_fn).call(this, method, __privateGet(this, _path2), handler);
        });
        return this;
      };
    });
    this.on = (method, path2, ...handlers) => {
      for (const p of [path2].flat()) {
        __privateSet(this, _path2, p);
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            __privateMethod(this, __Hono_instances, addRoute_fn).call(this, m.toUpperCase(), __privateGet(this, _path2), handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        __privateSet(this, _path2, arg1);
      } else {
        __privateSet(this, _path2, "*");
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        __privateMethod(this, __Hono_instances, addRoute_fn).call(this, METHOD_NAME_ALL, __privateGet(this, _path2), handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path2, app2) {
    const subApp = this.basePath(path2);
    app2.routes.map((r) => {
      var _a3;
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      __privateMethod(_a3 = subApp, __Hono_instances, addRoute_fn).call(_a3, r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path2) {
    const subApp = __privateMethod(this, __Hono_instances, clone_fn).call(this);
    subApp._basePath = mergePath(this._basePath, path2);
    return subApp;
  }
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path2, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest || (replaceRequest = (() => {
      const mergedPath = mergePath(this._basePath, path2);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })());
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    __privateMethod(this, __Hono_instances, addRoute_fn).call(this, METHOD_NAME_ALL, mergePath(path2, "*"), handler);
    return this;
  }
}, _path2 = new WeakMap(), __Hono_instances = new WeakSet(), clone_fn = function() {
  const clone = new _c({
    router: this.router,
    getPath: this.getPath
  });
  clone.errorHandler = this.errorHandler;
  __privateSet(clone, _notFoundHandler2, __privateGet(this, _notFoundHandler2));
  clone.routes = this.routes;
  return clone;
}, _notFoundHandler2 = new WeakMap(), addRoute_fn = function(method, path2, handler) {
  method = method.toUpperCase();
  path2 = mergePath(this._basePath, path2);
  const r = { basePath: this._basePath, path: path2, method, handler };
  this.router.add(method, path2, [handler, r]);
  this.routes.push(r);
}, handleError_fn = function(err, c) {
  if (err instanceof Error) {
    return this.errorHandler(err, c);
  }
  throw err;
}, dispatch_fn = function(request, executionCtx, env, method) {
  if (method === "HEAD") {
    return (async () => new Response(null, await __privateMethod(this, __Hono_instances, dispatch_fn).call(this, request, executionCtx, env, "GET")))();
  }
  const path2 = this.getPath(request, { env });
  const matchResult = this.router.match(method, path2);
  const c = new Context(request, {
    path: path2,
    matchResult,
    env,
    executionCtx,
    notFoundHandler: __privateGet(this, _notFoundHandler2)
  });
  if (matchResult[0].length === 1) {
    let res;
    try {
      res = matchResult[0][0][0][0](c, async () => {
        c.res = await __privateGet(this, _notFoundHandler2).call(this, c);
      });
    } catch (err) {
      return __privateMethod(this, __Hono_instances, handleError_fn).call(this, err, c);
    }
    return res instanceof Promise ? res.then(
      (resolved) => resolved || (c.finalized ? c.res : __privateGet(this, _notFoundHandler2).call(this, c))
    ).catch((err) => __privateMethod(this, __Hono_instances, handleError_fn).call(this, err, c)) : res ?? __privateGet(this, _notFoundHandler2).call(this, c);
  }
  const composed = compose(matchResult[0], this.errorHandler, __privateGet(this, _notFoundHandler2));
  return (async () => {
    try {
      const context = await composed(c);
      if (!context.finalized) {
        throw new Error(
          "Context is not finalized. Did you forget to return a Response object or `await next()`?"
        );
      }
      return context.res;
    } catch (err) {
      return __privateMethod(this, __Hono_instances, handleError_fn).call(this, err, c);
    }
  })();
}, _c);
var emptyParam = [];
function match(method, path2) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path22) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path22];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path22.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index2 = match3.indexOf("", 1);
    return [matcher[1][index2], match3];
  });
  this.match = match2;
  return match2(method, path2);
}
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node$1 = (_d = class {
  constructor() {
    __privateAdd(this, _index);
    __privateAdd(this, _varIndex);
    __privateAdd(this, _children, /* @__PURE__ */ Object.create(null));
  }
  insert(tokens, index2, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (__privateGet(this, _index) !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      __privateSet(this, _index, index2);
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = __privateGet(this, _children)[regexpStr];
      if (!node) {
        if (Object.keys(__privateGet(this, _children)).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = __privateGet(this, _children)[regexpStr] = new _d();
        if (name !== "") {
          __privateSet(node, _varIndex, context.varIndex++);
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, __privateGet(node, _varIndex)]);
      }
    } else {
      node = __privateGet(this, _children)[token];
      if (!node) {
        if (Object.keys(__privateGet(this, _children)).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = __privateGet(this, _children)[token] = new _d();
      }
    }
    node.insert(restTokens, index2, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(__privateGet(this, _children)).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = __privateGet(this, _children)[k];
      return (typeof __privateGet(c, _varIndex) === "number" ? `(${k})@${__privateGet(c, _varIndex)}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof __privateGet(this, _index) === "number") {
      strList.unshift(`#${__privateGet(this, _index)}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, _index = new WeakMap(), _varIndex = new WeakMap(), _children = new WeakMap(), _d);
var Trie = (_e = class {
  constructor() {
    __privateAdd(this, _context, { varIndex: 0 });
    __privateAdd(this, _root, new Node$1());
  }
  insert(path2, index2, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path2 = path2.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path2.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    __privateGet(this, _root).insert(tokens, index2, paramAssoc, __privateGet(this, _context), pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = __privateGet(this, _root).buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, _context = new WeakMap(), _root = new WeakMap(), _e);
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path2) {
  return wildcardRegExpCache[path2] ?? (wildcardRegExpCache[path2] = new RegExp(
    path2 === "*" ? "" : `^${path2.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  ));
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  var _a3;
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path2, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path2] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path2, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path2) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = (_a3 = handlerData[i][j]) == null ? void 0 : _a3[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path2) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path2)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = (_f = class {
  constructor() {
    __privateAdd(this, _RegExpRouter_instances);
    __publicField(this, "name", "RegExpRouter");
    __privateAdd(this, _middleware);
    __privateAdd(this, _routes);
    __publicField(this, "match", match);
    __privateSet(this, _middleware, { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) });
    __privateSet(this, _routes, { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) });
  }
  add(method, path2, handler) {
    var _a3;
    const middleware = __privateGet(this, _middleware);
    const routes = __privateGet(this, _routes);
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path2 === "/*") {
      path2 = "*";
    }
    const paramCount = (path2.match(/\/:/g) || []).length;
    if (/\*$/.test(path2)) {
      const re = buildWildcardRegExp(path2);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          var _a4;
          (_a4 = middleware[m])[path2] || (_a4[path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []);
        });
      } else {
        (_a3 = middleware[method])[path2] || (_a3[path2] = findMiddleware(middleware[method], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []);
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path2) || [path2];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path22 = paths[i];
      Object.keys(routes).forEach((m) => {
        var _a4;
        if (method === METHOD_NAME_ALL || method === m) {
          (_a4 = routes[m])[path22] || (_a4[path22] = [
            ...findMiddleware(middleware[m], path22) || findMiddleware(middleware[METHOD_NAME_ALL], path22) || []
          ]);
          routes[m][path22].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(__privateGet(this, _routes)).concat(Object.keys(__privateGet(this, _middleware))).forEach((method) => {
      matchers[method] || (matchers[method] = __privateMethod(this, _RegExpRouter_instances, buildMatcher_fn).call(this, method));
    });
    __privateSet(this, _middleware, __privateSet(this, _routes, void 0));
    clearWildcardRegExpCache();
    return matchers;
  }
}, _middleware = new WeakMap(), _routes = new WeakMap(), _RegExpRouter_instances = new WeakSet(), buildMatcher_fn = function(method) {
  const routes = [];
  let hasOwnRoute = method === METHOD_NAME_ALL;
  [__privateGet(this, _middleware), __privateGet(this, _routes)].forEach((r) => {
    const ownRoute = r[method] ? Object.keys(r[method]).map((path2) => [path2, r[method][path2]]) : [];
    if (ownRoute.length !== 0) {
      hasOwnRoute || (hasOwnRoute = true);
      routes.push(...ownRoute);
    } else if (method !== METHOD_NAME_ALL) {
      routes.push(
        ...Object.keys(r[METHOD_NAME_ALL]).map((path2) => [path2, r[METHOD_NAME_ALL][path2]])
      );
    }
  });
  if (!hasOwnRoute) {
    return null;
  } else {
    return buildMatcherFromPreprocessedRoutes(routes);
  }
}, _f);
var SmartRouter = (_g = class {
  constructor(init) {
    __publicField(this, "name", "SmartRouter");
    __privateAdd(this, _routers, []);
    __privateAdd(this, _routes2, []);
    __privateSet(this, _routers, init.routers);
  }
  add(method, path2, handler) {
    if (!__privateGet(this, _routes2)) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    __privateGet(this, _routes2).push([method, path2, handler]);
  }
  match(method, path2) {
    if (!__privateGet(this, _routes2)) {
      throw new Error("Fatal error");
    }
    const routers = __privateGet(this, _routers);
    const routes = __privateGet(this, _routes2);
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path2);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      __privateSet(this, _routers, [router]);
      __privateSet(this, _routes2, void 0);
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (__privateGet(this, _routes2) || __privateGet(this, _routers).length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return __privateGet(this, _routers)[0];
  }
}, _routers = new WeakMap(), _routes2 = new WeakMap(), _g);
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node = (_h = class {
  constructor(method, handler, children) {
    __privateAdd(this, __Node_instances);
    __privateAdd(this, _methods);
    __privateAdd(this, _children2);
    __privateAdd(this, _patterns);
    __privateAdd(this, _order, 0);
    __privateAdd(this, _params, emptyParams);
    __privateSet(this, _children2, children || /* @__PURE__ */ Object.create(null));
    __privateSet(this, _methods, []);
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      __privateSet(this, _methods, [m]);
    }
    __privateSet(this, _patterns, []);
  }
  insert(method, path2, handler) {
    __privateSet(this, _order, ++__privateWrapper(this, _order)._);
    let curNode = this;
    const parts = splitRoutingPath(path2);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in __privateGet(curNode, _children2)) {
        curNode = __privateGet(curNode, _children2)[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      __privateGet(curNode, _children2)[key] = new _h();
      if (pattern) {
        __privateGet(curNode, _patterns).push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = __privateGet(curNode, _children2)[key];
    }
    __privateGet(curNode, _methods).push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: __privateGet(this, _order)
      }
    });
    return curNode;
  }
  search(method, path2) {
    var _a3;
    const handlerSets = [];
    __privateSet(this, _params, emptyParams);
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path2);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = __privateGet(node, _children2)[part];
        if (nextNode) {
          __privateSet(nextNode, _params, __privateGet(node, _params));
          if (isLast) {
            if (__privateGet(nextNode, _children2)["*"]) {
              handlerSets.push(
                ...__privateMethod(this, __Node_instances, getHandlerSets_fn).call(this, __privateGet(nextNode, _children2)["*"], method, __privateGet(node, _params))
              );
            }
            handlerSets.push(...__privateMethod(this, __Node_instances, getHandlerSets_fn).call(this, nextNode, method, __privateGet(node, _params)));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = __privateGet(node, _patterns).length; k < len3; k++) {
          const pattern = __privateGet(node, _patterns)[k];
          const params = __privateGet(node, _params) === emptyParams ? {} : { ...__privateGet(node, _params) };
          if (pattern === "*") {
            const astNode = __privateGet(node, _children2)["*"];
            if (astNode) {
              handlerSets.push(...__privateMethod(this, __Node_instances, getHandlerSets_fn).call(this, astNode, method, __privateGet(node, _params)));
              __privateSet(astNode, _params, params);
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = __privateGet(node, _children2)[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...__privateMethod(this, __Node_instances, getHandlerSets_fn).call(this, child, method, __privateGet(node, _params), params));
              if (Object.keys(__privateGet(child, _children2)).length) {
                __privateSet(child, _params, params);
                const componentCount = ((_a3 = m[0].match(/\//)) == null ? void 0 : _a3.length) ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] || (curNodesQueue[componentCount] = []);
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...__privateMethod(this, __Node_instances, getHandlerSets_fn).call(this, child, method, params, __privateGet(node, _params)));
              if (__privateGet(child, _children2)["*"]) {
                handlerSets.push(
                  ...__privateMethod(this, __Node_instances, getHandlerSets_fn).call(this, __privateGet(child, _children2)["*"], method, params, __privateGet(node, _params))
                );
              }
            } else {
              __privateSet(child, _params, params);
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, _methods = new WeakMap(), _children2 = new WeakMap(), _patterns = new WeakMap(), _order = new WeakMap(), _params = new WeakMap(), __Node_instances = new WeakSet(), getHandlerSets_fn = function(node, method, nodeParams, params) {
  const handlerSets = [];
  for (let i = 0, len = __privateGet(node, _methods).length; i < len; i++) {
    const m = __privateGet(node, _methods)[i];
    const handlerSet = m[method] || m[METHOD_NAME_ALL];
    const processedSet = {};
    if (handlerSet !== void 0) {
      handlerSet.params = /* @__PURE__ */ Object.create(null);
      handlerSets.push(handlerSet);
      if (nodeParams !== emptyParams || params && params !== emptyParams) {
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          const processed = processedSet[handlerSet.score];
          handlerSet.params[key] = (params == null ? void 0 : params[key]) && !processed ? params[key] : nodeParams[key] ?? (params == null ? void 0 : params[key]);
          processedSet[handlerSet.score] = true;
        }
      }
    }
  }
  return handlerSets;
}, _h);
var TrieRouter = (_i = class {
  constructor() {
    __publicField(this, "name", "TrieRouter");
    __privateAdd(this, _node);
    __privateSet(this, _node, new Node());
  }
  add(method, path2, handler) {
    const results = checkOptionalParameter(path2);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        __privateGet(this, _node).insert(method, results[i], handler);
      }
      return;
    }
    __privateGet(this, _node).insert(method, path2, handler);
  }
  match(method, path2) {
    return __privateGet(this, _node).search(method, path2);
  }
}, _node = new WeakMap(), _i);
var Hono = class extends Hono$1 {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};
var html = (strings, ...values) => {
  const buffer = [""];
  for (let i = 0, len = strings.length - 1; i < len; i++) {
    buffer[0] += strings[i];
    const children = Array.isArray(values[i]) ? values[i].flat(Infinity) : [values[i]];
    for (let i2 = 0, len2 = children.length; i2 < len2; i2++) {
      const child = children[i2];
      if (typeof child === "string") {
        escapeToBuffer(child, buffer);
      } else if (typeof child === "number") {
        buffer[0] += child;
      } else if (typeof child === "boolean" || child === null || child === void 0) {
        continue;
      } else if (typeof child === "object" && child.isEscaped) {
        if (child.callbacks) {
          buffer.unshift("", child);
        } else {
          const tmp = child.toString();
          if (tmp instanceof Promise) {
            buffer.unshift("", tmp);
          } else {
            buffer[0] += tmp;
          }
        }
      } else if (child instanceof Promise) {
        buffer.unshift("", child);
      } else {
        escapeToBuffer(child.toString(), buffer);
      }
    }
  }
  buffer[0] += strings.at(-1);
  return buffer.length === 1 ? "callbacks" in buffer ? raw(resolveCallbackSync(raw(buffer[0], buffer.callbacks))) : raw(buffer[0]) : stringBufferToString(buffer, buffer.callbacks);
};
var DOM_RENDERER = /* @__PURE__ */ Symbol("RENDERER");
var DOM_ERROR_HANDLER = /* @__PURE__ */ Symbol("ERROR_HANDLER");
var DOM_STASH = /* @__PURE__ */ Symbol("STASH");
var DOM_INTERNAL_TAG = /* @__PURE__ */ Symbol("INTERNAL");
var DOM_MEMO = /* @__PURE__ */ Symbol("MEMO");
var PERMALINK = /* @__PURE__ */ Symbol("PERMALINK");
var setInternalTagFlag = (fn) => {
  fn[DOM_INTERNAL_TAG] = true;
  return fn;
};
var createContextProviderFunction = (values) => ({ value, children }) => {
  if (!children) {
    return void 0;
  }
  const props = {
    children: [
      {
        tag: setInternalTagFlag(() => {
          values.push(value);
        }),
        props: {}
      }
    ]
  };
  if (Array.isArray(children)) {
    props.children.push(...children.flat());
  } else {
    props.children.push(children);
  }
  props.children.push({
    tag: setInternalTagFlag(() => {
      values.pop();
    }),
    props: {}
  });
  const res = { tag: "", props, type: "" };
  res[DOM_ERROR_HANDLER] = (err) => {
    values.pop();
    throw err;
  };
  return res;
};
var createContext$1 = (defaultValue) => {
  const values = [defaultValue];
  const context = createContextProviderFunction(values);
  context.values = values;
  context.Provider = context;
  globalContexts.push(context);
  return context;
};
var globalContexts = [];
var createContext = (defaultValue) => {
  const values = [defaultValue];
  const context = ((props) => {
    values.push(props.value);
    let string;
    try {
      string = props.children ? (Array.isArray(props.children) ? new JSXFragmentNode("", {}, props.children) : props.children).toString() : "";
    } finally {
      values.pop();
    }
    if (string instanceof Promise) {
      return string.then((resString) => raw(resString, resString.callbacks));
    } else {
      return raw(string);
    }
  });
  context.values = values;
  context.Provider = context;
  context[DOM_RENDERER] = createContextProviderFunction(values);
  globalContexts.push(context);
  return context;
};
var useContext = (context) => {
  return context.values.at(-1);
};
var deDupeKeyMap = {
  title: [],
  script: ["src"],
  style: ["data-href"],
  link: ["href"],
  meta: ["name", "httpEquiv", "charset", "itemProp"]
};
var domRenderers = {};
var dataPrecedenceAttr = "data-precedence";
var toArray = (children) => Array.isArray(children) ? children : [children];
var metaTagMap = /* @__PURE__ */ new WeakMap();
var insertIntoHead = (tagName, tag, props, precedence) => ({ buffer, context }) => {
  if (!buffer) {
    return;
  }
  const map = metaTagMap.get(context) || {};
  metaTagMap.set(context, map);
  const tags = map[tagName] || (map[tagName] = []);
  let duped = false;
  const deDupeKeys = deDupeKeyMap[tagName];
  if (deDupeKeys.length > 0) {
    LOOP: for (const [, tagProps] of tags) {
      for (const key of deDupeKeys) {
        if (((tagProps == null ? void 0 : tagProps[key]) ?? null) === (props == null ? void 0 : props[key])) {
          duped = true;
          break LOOP;
        }
      }
    }
  }
  if (duped) {
    buffer[0] = buffer[0].replaceAll(tag, "");
  } else if (deDupeKeys.length > 0) {
    tags.push([tag, props, precedence]);
  } else {
    tags.unshift([tag, props, precedence]);
  }
  if (buffer[0].indexOf("</head>") !== -1) {
    let insertTags;
    if (precedence === void 0) {
      insertTags = tags.map(([tag2]) => tag2);
    } else {
      const precedences = [];
      insertTags = tags.map(([tag2, , precedence2]) => {
        let order = precedences.indexOf(precedence2);
        if (order === -1) {
          precedences.push(precedence2);
          order = precedences.length - 1;
        }
        return [tag2, order];
      }).sort((a, b) => a[1] - b[1]).map(([tag2]) => tag2);
    }
    insertTags.forEach((tag2) => {
      buffer[0] = buffer[0].replaceAll(tag2, "");
    });
    buffer[0] = buffer[0].replace(/(?=<\/head>)/, insertTags.join(""));
  }
};
var returnWithoutSpecialBehavior = (tag, children, props) => raw(new JSXNode(tag, props, toArray(children ?? [])).toString());
var documentMetadataTag$1 = (tag, children, props, sort) => {
  if ("itemProp" in props) {
    return returnWithoutSpecialBehavior(tag, children, props);
  }
  let { precedence, blocking, ...restProps } = props;
  precedence = sort ? precedence ?? "" : void 0;
  if (sort) {
    restProps[dataPrecedenceAttr] = precedence;
  }
  const string = new JSXNode(tag, restProps, toArray(children || [])).toString();
  if (string instanceof Promise) {
    return string.then(
      (resString) => raw(string, [
        ...resString.callbacks || [],
        insertIntoHead(tag, resString, restProps, precedence)
      ])
    );
  } else {
    return raw(string, [insertIntoHead(tag, string, restProps, precedence)]);
  }
};
var title$1 = ({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext$1();
  if (nameSpaceContext2) {
    const context = useContext(nameSpaceContext2);
    if (context === "svg" || context === "head") {
      return new JSXNode(
        "title",
        props,
        toArray(children ?? [])
      );
    }
  }
  return documentMetadataTag$1("title", children, props, false);
};
var script$1 = ({
  children,
  ...props
}) => {
  const nameSpaceContext2 = getNameSpaceContext$1();
  if (["src", "async"].some((k) => !props[k]) || nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("script", children, props);
  }
  return documentMetadataTag$1("script", children, props, false);
};
var style$1 = ({
  children,
  ...props
}) => {
  if (!["href", "precedence"].every((k) => k in props)) {
    return returnWithoutSpecialBehavior("style", children, props);
  }
  props["data-href"] = props.href;
  delete props.href;
  return documentMetadataTag$1("style", children, props, true);
};
var link$1 = ({ children, ...props }) => {
  if (["onLoad", "onError"].some((k) => k in props) || props.rel === "stylesheet" && (!("precedence" in props) || "disabled" in props)) {
    return returnWithoutSpecialBehavior("link", children, props);
  }
  return documentMetadataTag$1("link", children, props, "precedence" in props);
};
var meta$1 = ({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext$1();
  if (nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("meta", children, props);
  }
  return documentMetadataTag$1("meta", children, props, false);
};
var newJSXNode = (tag, { children, ...props }) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new JSXNode(tag, props, toArray(children ?? []))
);
var form$1 = (props) => {
  if (typeof props.action === "function") {
    props.action = PERMALINK in props.action ? props.action[PERMALINK] : void 0;
  }
  return newJSXNode("form", props);
};
var formActionableElement$1 = (tag, props) => {
  if (typeof props.formAction === "function") {
    props.formAction = PERMALINK in props.formAction ? props.formAction[PERMALINK] : void 0;
  }
  return newJSXNode(tag, props);
};
var input$1 = (props) => formActionableElement$1("input", props);
var button$1 = (props) => formActionableElement$1("button", props);
const intrinsicElementTags = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  button: button$1,
  form: form$1,
  input: input$1,
  link: link$1,
  meta: meta$1,
  script: script$1,
  style: style$1,
  title: title$1
}, Symbol.toStringTag, { value: "Module" }));
var normalizeElementKeyMap = /* @__PURE__ */ new Map([
  ["className", "class"],
  ["htmlFor", "for"],
  ["crossOrigin", "crossorigin"],
  ["httpEquiv", "http-equiv"],
  ["itemProp", "itemprop"],
  ["fetchPriority", "fetchpriority"],
  ["noModule", "nomodule"],
  ["formAction", "formaction"]
]);
var normalizeIntrinsicElementKey = (key) => normalizeElementKeyMap.get(key) || key;
var styleObjectForEach = (style2, fn) => {
  for (const [k, v] of Object.entries(style2)) {
    const key = k[0] === "-" || !/[A-Z]/.test(k) ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    fn(
      key,
      v == null ? null : typeof v === "number" ? !key.match(
        /^(?:a|border-im|column(?:-c|s)|flex(?:$|-[^b])|grid-(?:ar|[^a])|font-w|li|or|sca|st|ta|wido|z)|ty$/
      ) ? `${v}px` : `${v}` : v
    );
  }
};
var nameSpaceContext$1 = void 0;
var getNameSpaceContext$1 = () => nameSpaceContext$1;
var toSVGAttributeName = (key) => /[A-Z]/.test(key) && // Presentation attributes are findable in style object. "clip-path", "font-size", "stroke-width", etc.
// Or other un-deprecated kebab-case attributes. "overline-position", "paint-order", "strikethrough-position", etc.
key.match(
  /^(?:al|basel|clip(?:Path|Rule)$|co|do|fill|fl|fo|gl|let|lig|i|marker[EMS]|o|pai|pointe|sh|st[or]|text[^L]|tr|u|ve|w)/
) ? key.replace(/([A-Z])/g, "-$1").toLowerCase() : key;
var emptyTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
var booleanAttributes = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "download",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
];
var childrenToStringToBuffer = (children, buffer) => {
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (typeof child === "string") {
      escapeToBuffer(child, buffer);
    } else if (typeof child === "boolean" || child === null || child === void 0) {
      continue;
    } else if (child instanceof JSXNode) {
      child.toStringToBuffer(buffer);
    } else if (typeof child === "number" || child.isEscaped) {
      buffer[0] += child;
    } else if (child instanceof Promise) {
      buffer.unshift("", child);
    } else {
      childrenToStringToBuffer(child, buffer);
    }
  }
};
var JSXNode = class {
  constructor(tag, props, children) {
    __publicField(this, "tag");
    __publicField(this, "props");
    __publicField(this, "key");
    __publicField(this, "children");
    __publicField(this, "isEscaped", true);
    __publicField(this, "localContexts");
    this.tag = tag;
    this.props = props;
    this.children = children;
  }
  get type() {
    return this.tag;
  }
  // Added for compatibility with libraries that rely on React's internal structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get ref() {
    return this.props.ref || null;
  }
  toString() {
    var _a3, _b2;
    const buffer = [""];
    (_a3 = this.localContexts) == null ? void 0 : _a3.forEach(([context, value]) => {
      context.values.push(value);
    });
    try {
      this.toStringToBuffer(buffer);
    } finally {
      (_b2 = this.localContexts) == null ? void 0 : _b2.forEach(([context]) => {
        context.values.pop();
      });
    }
    return buffer.length === 1 ? "callbacks" in buffer ? resolveCallbackSync(raw(buffer[0], buffer.callbacks)).toString() : buffer[0] : stringBufferToString(buffer, buffer.callbacks);
  }
  toStringToBuffer(buffer) {
    const tag = this.tag;
    const props = this.props;
    let { children } = this;
    buffer[0] += `<${tag}`;
    const normalizeKey = nameSpaceContext$1 && useContext(nameSpaceContext$1) === "svg" ? (key) => toSVGAttributeName(normalizeIntrinsicElementKey(key)) : (key) => normalizeIntrinsicElementKey(key);
    for (let [key, v] of Object.entries(props)) {
      key = normalizeKey(key);
      if (key === "children") ;
      else if (key === "style" && typeof v === "object") {
        let styleStr = "";
        styleObjectForEach(v, (property, value) => {
          if (value != null) {
            styleStr += `${styleStr ? ";" : ""}${property}:${value}`;
          }
        });
        buffer[0] += ' style="';
        escapeToBuffer(styleStr, buffer);
        buffer[0] += '"';
      } else if (typeof v === "string") {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v, buffer);
        buffer[0] += '"';
      } else if (v === null || v === void 0) ;
      else if (typeof v === "number" || v.isEscaped) {
        buffer[0] += ` ${key}="${v}"`;
      } else if (typeof v === "boolean" && booleanAttributes.includes(key)) {
        if (v) {
          buffer[0] += ` ${key}=""`;
        }
      } else if (key === "dangerouslySetInnerHTML") {
        if (children.length > 0) {
          throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
        }
        children = [raw(v.__html)];
      } else if (v instanceof Promise) {
        buffer[0] += ` ${key}="`;
        buffer.unshift('"', v);
      } else if (typeof v === "function") {
        if (!key.startsWith("on") && key !== "ref") {
          throw new Error(`Invalid prop '${key}' of type 'function' supplied to '${tag}'.`);
        }
      } else {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v.toString(), buffer);
        buffer[0] += '"';
      }
    }
    if (emptyTags.includes(tag) && children.length === 0) {
      buffer[0] += "/>";
      return;
    }
    buffer[0] += ">";
    childrenToStringToBuffer(children, buffer);
    buffer[0] += `</${tag}>`;
  }
};
var JSXFunctionNode = class extends JSXNode {
  toStringToBuffer(buffer) {
    const { children } = this;
    const props = { ...this.props };
    if (children.length) {
      props.children = children.length === 1 ? children[0] : children;
    }
    const res = this.tag.call(null, props);
    if (typeof res === "boolean" || res == null) {
      return;
    } else if (res instanceof Promise) {
      if (globalContexts.length === 0) {
        buffer.unshift("", res);
      } else {
        const currentContexts = globalContexts.map((c) => [c, c.values.at(-1)]);
        buffer.unshift(
          "",
          res.then((childRes) => {
            if (childRes instanceof JSXNode) {
              childRes.localContexts = currentContexts;
            }
            return childRes;
          })
        );
      }
    } else if (res instanceof JSXNode) {
      res.toStringToBuffer(buffer);
    } else if (typeof res === "number" || res.isEscaped) {
      buffer[0] += res;
      if (res.callbacks) {
        buffer.callbacks || (buffer.callbacks = []);
        buffer.callbacks.push(...res.callbacks);
      }
    } else {
      escapeToBuffer(res, buffer);
    }
  }
};
var JSXFragmentNode = class extends JSXNode {
  toStringToBuffer(buffer) {
    childrenToStringToBuffer(this.children, buffer);
  }
};
var jsx = (tag, props, ...children) => {
  props ?? (props = {});
  if (children.length) {
    props.children = children.length === 1 ? children[0] : children;
  }
  const key = props.key;
  delete props["key"];
  const node = jsxFn(tag, props, children);
  node.key = key;
  return node;
};
var initDomRenderer = false;
var jsxFn = (tag, props, children) => {
  if (!initDomRenderer) {
    for (const k in domRenderers) {
      intrinsicElementTags[k][DOM_RENDERER] = domRenderers[k];
    }
    initDomRenderer = true;
  }
  if (typeof tag === "function") {
    return new JSXFunctionNode(tag, props, children);
  } else if (intrinsicElementTags[tag]) {
    return new JSXFunctionNode(
      intrinsicElementTags[tag],
      props,
      children
    );
  } else if (tag === "svg" || tag === "head") {
    nameSpaceContext$1 || (nameSpaceContext$1 = createContext(""));
    return new JSXNode(tag, props, [
      new JSXFunctionNode(
        nameSpaceContext$1,
        {
          value: tag
        },
        children
      )
    ]);
  } else {
    return new JSXNode(tag, props, children);
  }
};
var Fragment = ({
  children
}) => {
  return new JSXFragmentNode(
    "",
    {
      children
    },
    Array.isArray(children) ? children : children ? [children] : []
  );
};
function jsxDEV(tag, props, key) {
  let node;
  if (!props || !("children" in props)) {
    node = jsxFn(tag, props, []);
  } else {
    const children = props.children;
    node = Array.isArray(children) ? jsxFn(tag, props, children) : jsxFn(tag, props, [children]);
  }
  node.key = key;
  return node;
}
var HONO_PORTAL_ELEMENT = "_hp";
var eventAliasMap = {
  Change: "Input",
  DoubleClick: "DblClick"
};
var nameSpaceMap = {
  svg: "2000/svg",
  math: "1998/Math/MathML"
};
var buildDataStack = [];
var refCleanupMap = /* @__PURE__ */ new WeakMap();
var nameSpaceContext = void 0;
var getNameSpaceContext = () => nameSpaceContext;
var isNodeString = (node) => "t" in node;
var eventCache = {
  // pre-define events that are used very frequently
  onClick: ["click", false]
};
var getEventSpec = (key) => {
  if (!key.startsWith("on")) {
    return void 0;
  }
  if (eventCache[key]) {
    return eventCache[key];
  }
  const match2 = key.match(/^on([A-Z][a-zA-Z]+?(?:PointerCapture)?)(Capture)?$/);
  if (match2) {
    const [, eventName, capture] = match2;
    return eventCache[key] = [(eventAliasMap[eventName] || eventName).toLowerCase(), !!capture];
  }
  return void 0;
};
var toAttributeName = (element, key) => nameSpaceContext && element instanceof SVGElement && /[A-Z]/.test(key) && (key in element.style || // Presentation attributes are findable in style object. "clip-path", "font-size", "stroke-width", etc.
key.match(/^(?:o|pai|str|u|ve)/)) ? key.replace(/([A-Z])/g, "-$1").toLowerCase() : key;
var applyProps = (container, attributes, oldAttributes) => {
  var _a3;
  attributes || (attributes = {});
  for (let key in attributes) {
    const value = attributes[key];
    if (key !== "children" && (!oldAttributes || oldAttributes[key] !== value)) {
      key = normalizeIntrinsicElementKey(key);
      const eventSpec = getEventSpec(key);
      if (eventSpec) {
        if ((oldAttributes == null ? void 0 : oldAttributes[key]) !== value) {
          if (oldAttributes) {
            container.removeEventListener(eventSpec[0], oldAttributes[key], eventSpec[1]);
          }
          if (value != null) {
            if (typeof value !== "function") {
              throw new Error(`Event handler for "${key}" is not a function`);
            }
            container.addEventListener(eventSpec[0], value, eventSpec[1]);
          }
        }
      } else if (key === "dangerouslySetInnerHTML" && value) {
        container.innerHTML = value.__html;
      } else if (key === "ref") {
        let cleanup;
        if (typeof value === "function") {
          cleanup = value(container) || (() => value(null));
        } else if (value && "current" in value) {
          value.current = container;
          cleanup = () => value.current = null;
        }
        refCleanupMap.set(container, cleanup);
      } else if (key === "style") {
        const style2 = container.style;
        if (typeof value === "string") {
          style2.cssText = value;
        } else {
          style2.cssText = "";
          if (value != null) {
            styleObjectForEach(value, style2.setProperty.bind(style2));
          }
        }
      } else {
        if (key === "value") {
          const nodeName = container.nodeName;
          if (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "SELECT") {
            container.value = value === null || value === void 0 || value === false ? null : value;
            if (nodeName === "TEXTAREA") {
              container.textContent = value;
              continue;
            } else if (nodeName === "SELECT") {
              if (container.selectedIndex === -1) {
                container.selectedIndex = 0;
              }
              continue;
            }
          }
        } else if (key === "checked" && container.nodeName === "INPUT" || key === "selected" && container.nodeName === "OPTION") {
          container[key] = value;
        }
        const k = toAttributeName(container, key);
        if (value === null || value === void 0 || value === false) {
          container.removeAttribute(k);
        } else if (value === true) {
          container.setAttribute(k, "");
        } else if (typeof value === "string" || typeof value === "number") {
          container.setAttribute(k, value);
        } else {
          container.setAttribute(k, value.toString());
        }
      }
    }
  }
  if (oldAttributes) {
    for (let key in oldAttributes) {
      const value = oldAttributes[key];
      if (key !== "children" && !(key in attributes)) {
        key = normalizeIntrinsicElementKey(key);
        const eventSpec = getEventSpec(key);
        if (eventSpec) {
          container.removeEventListener(eventSpec[0], value, eventSpec[1]);
        } else if (key === "ref") {
          (_a3 = refCleanupMap.get(container)) == null ? void 0 : _a3();
        } else {
          container.removeAttribute(toAttributeName(container, key));
        }
      }
    }
  }
};
var invokeTag = (context, node) => {
  node[DOM_STASH][0] = 0;
  buildDataStack.push([context, node]);
  const func = node.tag[DOM_RENDERER] || node.tag;
  const props = func.defaultProps ? {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...func.defaultProps,
    ...node.props
  } : node.props;
  try {
    return [func.call(null, props)];
  } finally {
    buildDataStack.pop();
  }
};
var getNextChildren = (node, container, nextChildren, childrenToRemove, callbacks) => {
  var _a3, _b2;
  if ((_a3 = node.vR) == null ? void 0 : _a3.length) {
    childrenToRemove.push(...node.vR);
    delete node.vR;
  }
  if (typeof node.tag === "function") {
    (_b2 = node[DOM_STASH][1][STASH_EFFECT]) == null ? void 0 : _b2.forEach((data) => callbacks.push(data));
  }
  node.vC.forEach((child) => {
    var _a4;
    if (isNodeString(child)) {
      nextChildren.push(child);
    } else {
      if (typeof child.tag === "function" || child.tag === "") {
        child.c = container;
        const currentNextChildrenIndex = nextChildren.length;
        getNextChildren(child, container, nextChildren, childrenToRemove, callbacks);
        if (child.s) {
          for (let i = currentNextChildrenIndex; i < nextChildren.length; i++) {
            nextChildren[i].s = true;
          }
          child.s = false;
        }
      } else {
        nextChildren.push(child);
        if ((_a4 = child.vR) == null ? void 0 : _a4.length) {
          childrenToRemove.push(...child.vR);
          delete child.vR;
        }
      }
    }
  });
};
var findInsertBefore = (node) => {
  for (; ; node = node.tag === HONO_PORTAL_ELEMENT || !node.vC || !node.pP ? node.nN : node.vC[0]) {
    if (!node) {
      return null;
    }
    if (node.tag !== HONO_PORTAL_ELEMENT && node.e) {
      return node.e;
    }
  }
};
var removeNode = (node) => {
  var _a3, _b2, _c2, _d2, _e2, _f2;
  if (!isNodeString(node)) {
    (_b2 = (_a3 = node[DOM_STASH]) == null ? void 0 : _a3[1][STASH_EFFECT]) == null ? void 0 : _b2.forEach((data) => {
      var _a4;
      return (_a4 = data[2]) == null ? void 0 : _a4.call(data);
    });
    (_c2 = refCleanupMap.get(node.e)) == null ? void 0 : _c2();
    if (node.p === 2) {
      (_d2 = node.vC) == null ? void 0 : _d2.forEach((n) => n.p = 2);
    }
    (_e2 = node.vC) == null ? void 0 : _e2.forEach(removeNode);
  }
  if (!node.p) {
    (_f2 = node.e) == null ? void 0 : _f2.remove();
    delete node.e;
  }
  if (typeof node.tag === "function") {
    updateMap.delete(node);
    fallbackUpdateFnArrayMap.delete(node);
    delete node[DOM_STASH][3];
    node.a = true;
  }
};
var apply = (node, container, isNew) => {
  node.c = container;
  applyNodeObject(node, container, isNew);
};
var findChildNodeIndex = (childNodes, child) => {
  if (!child) {
    return;
  }
  for (let i = 0, len = childNodes.length; i < len; i++) {
    if (childNodes[i] === child) {
      return i;
    }
  }
  return;
};
var cancelBuild = /* @__PURE__ */ Symbol();
var applyNodeObject = (node, container, isNew) => {
  var _a3;
  const next = [];
  const remove = [];
  const callbacks = [];
  getNextChildren(node, container, next, remove, callbacks);
  remove.forEach(removeNode);
  const childNodes = isNew ? void 0 : container.childNodes;
  let offset;
  let insertBeforeNode = null;
  if (isNew) {
    offset = -1;
  } else if (!childNodes.length) {
    offset = 0;
  } else {
    const offsetByNextNode = findChildNodeIndex(childNodes, findInsertBefore(node.nN));
    if (offsetByNextNode !== void 0) {
      insertBeforeNode = childNodes[offsetByNextNode];
      offset = offsetByNextNode;
    } else {
      offset = findChildNodeIndex(childNodes, (_a3 = next.find((n) => n.tag !== HONO_PORTAL_ELEMENT && n.e)) == null ? void 0 : _a3.e) ?? -1;
    }
    if (offset === -1) {
      isNew = true;
    }
  }
  for (let i = 0, len = next.length; i < len; i++, offset++) {
    const child = next[i];
    let el;
    if (child.s && child.e) {
      el = child.e;
      child.s = false;
    } else {
      const isNewLocal = isNew || !child.e;
      if (isNodeString(child)) {
        if (child.e && child.d) {
          child.e.textContent = child.t;
        }
        child.d = false;
        el = child.e || (child.e = document.createTextNode(child.t));
      } else {
        el = child.e || (child.e = child.n ? document.createElementNS(child.n, child.tag) : document.createElement(child.tag));
        applyProps(el, child.props, child.pP);
        applyNodeObject(child, el, isNewLocal);
      }
    }
    if (child.tag === HONO_PORTAL_ELEMENT) {
      offset--;
    } else if (isNew) {
      if (!el.parentNode) {
        container.appendChild(el);
      }
    } else if (childNodes[offset] !== el && childNodes[offset - 1] !== el) {
      if (childNodes[offset + 1] === el) {
        container.appendChild(childNodes[offset]);
      } else {
        container.insertBefore(el, insertBeforeNode || childNodes[offset] || null);
      }
    }
  }
  if (node.pP) {
    delete node.pP;
  }
  if (callbacks.length) {
    const useLayoutEffectCbs = [];
    const useEffectCbs = [];
    callbacks.forEach(([, useLayoutEffectCb, , useEffectCb, useInsertionEffectCb]) => {
      if (useLayoutEffectCb) {
        useLayoutEffectCbs.push(useLayoutEffectCb);
      }
      if (useEffectCb) {
        useEffectCbs.push(useEffectCb);
      }
      useInsertionEffectCb == null ? void 0 : useInsertionEffectCb();
    });
    useLayoutEffectCbs.forEach((cb) => cb());
    if (useEffectCbs.length) {
      requestAnimationFrame(() => {
        useEffectCbs.forEach((cb) => cb());
      });
    }
  }
};
var isSameContext = (oldContexts, newContexts) => !!(oldContexts && oldContexts.length === newContexts.length && oldContexts.every((ctx, i) => ctx[1] === newContexts[i][1]));
var fallbackUpdateFnArrayMap = /* @__PURE__ */ new WeakMap();
var build = (context, node, children) => {
  var _a3, _b2, _c2, _d2, _e2, _f2;
  const buildWithPreviousChildren = !children && node.pC;
  if (children) {
    node.pC || (node.pC = node.vC);
  }
  let foundErrorHandler;
  try {
    children || (children = typeof node.tag == "function" ? invokeTag(context, node) : toArray(node.props.children));
    if (((_a3 = children[0]) == null ? void 0 : _a3.tag) === "" && children[0][DOM_ERROR_HANDLER]) {
      foundErrorHandler = children[0][DOM_ERROR_HANDLER];
      context[5].push([context, foundErrorHandler, node]);
    }
    const oldVChildren = buildWithPreviousChildren ? [...node.pC] : node.vC ? [...node.vC] : void 0;
    const vChildren = [];
    let prevNode;
    for (let i = 0; i < children.length; i++) {
      if (Array.isArray(children[i])) {
        children.splice(i, 1, ...children[i].flat());
      }
      let child = buildNode(children[i]);
      if (child) {
        if (typeof child.tag === "function" && // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !child.tag[DOM_INTERNAL_TAG]) {
          if (globalContexts.length > 0) {
            child[DOM_STASH][2] = globalContexts.map((c) => [c, c.values.at(-1)]);
          }
          if ((_b2 = context[5]) == null ? void 0 : _b2.length) {
            child[DOM_STASH][3] = context[5].at(-1);
          }
        }
        let oldChild;
        if (oldVChildren && oldVChildren.length) {
          const i2 = oldVChildren.findIndex(
            isNodeString(child) ? (c) => isNodeString(c) : child.key !== void 0 ? (c) => c.key === child.key && c.tag === child.tag : (c) => c.tag === child.tag
          );
          if (i2 !== -1) {
            oldChild = oldVChildren[i2];
            oldVChildren.splice(i2, 1);
          }
        }
        if (oldChild) {
          if (isNodeString(child)) {
            if (oldChild.t !== child.t) {
              ;
              oldChild.t = child.t;
              oldChild.d = true;
            }
            child = oldChild;
          } else {
            const pP = oldChild.pP = oldChild.props;
            oldChild.props = child.props;
            oldChild.f || (oldChild.f = child.f || node.f);
            if (typeof child.tag === "function") {
              const oldContexts = oldChild[DOM_STASH][2];
              oldChild[DOM_STASH][2] = child[DOM_STASH][2] || [];
              oldChild[DOM_STASH][3] = child[DOM_STASH][3];
              if (!oldChild.f && ((oldChild.o || oldChild) === child.o || // The code generated by the react compiler is memoized under this condition.
              ((_d2 = (_c2 = oldChild.tag)[DOM_MEMO]) == null ? void 0 : _d2.call(_c2, pP, oldChild.props))) && // The `memo` function is memoized under this condition.
              isSameContext(oldContexts, oldChild[DOM_STASH][2])) {
                oldChild.s = true;
              }
            }
            child = oldChild;
          }
        } else if (!isNodeString(child) && nameSpaceContext) {
          const ns = useContext(nameSpaceContext);
          if (ns) {
            child.n = ns;
          }
        }
        if (!isNodeString(child) && !child.s) {
          build(context, child);
          delete child.f;
        }
        vChildren.push(child);
        if (prevNode && !prevNode.s && !child.s) {
          for (let p = prevNode; p && !isNodeString(p); p = (_e2 = p.vC) == null ? void 0 : _e2.at(-1)) {
            p.nN = child;
          }
        }
        prevNode = child;
      }
    }
    node.vR = buildWithPreviousChildren ? [...node.vC, ...oldVChildren || []] : oldVChildren || [];
    node.vC = vChildren;
    if (buildWithPreviousChildren) {
      delete node.pC;
    }
  } catch (e) {
    node.f = true;
    if (e === cancelBuild) {
      if (foundErrorHandler) {
        return;
      } else {
        throw e;
      }
    }
    const [errorHandlerContext, errorHandler2, errorHandlerNode] = ((_f2 = node[DOM_STASH]) == null ? void 0 : _f2[3]) || [];
    if (errorHandler2) {
      const fallbackUpdateFn = () => update([0, false, context[2]], errorHandlerNode);
      const fallbackUpdateFnArray = fallbackUpdateFnArrayMap.get(errorHandlerNode) || [];
      fallbackUpdateFnArray.push(fallbackUpdateFn);
      fallbackUpdateFnArrayMap.set(errorHandlerNode, fallbackUpdateFnArray);
      const fallback = errorHandler2(e, () => {
        const fnArray = fallbackUpdateFnArrayMap.get(errorHandlerNode);
        if (fnArray) {
          const i = fnArray.indexOf(fallbackUpdateFn);
          if (i !== -1) {
            fnArray.splice(i, 1);
            return fallbackUpdateFn();
          }
        }
      });
      if (fallback) {
        if (context[0] === 1) {
          context[1] = true;
        } else {
          build(context, errorHandlerNode, [fallback]);
          if ((errorHandler2.length === 1 || context !== errorHandlerContext) && errorHandlerNode.c) {
            apply(errorHandlerNode, errorHandlerNode.c, false);
            return;
          }
        }
        throw cancelBuild;
      }
    }
    throw e;
  } finally {
    if (foundErrorHandler) {
      context[5].pop();
    }
  }
};
var buildNode = (node) => {
  if (node === void 0 || node === null || typeof node === "boolean") {
    return void 0;
  } else if (typeof node === "string" || typeof node === "number") {
    return { t: node.toString(), d: true };
  } else {
    if ("vR" in node) {
      node = {
        tag: node.tag,
        props: node.props,
        key: node.key,
        f: node.f,
        type: node.tag,
        ref: node.props.ref,
        o: node.o || node
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      };
    }
    if (typeof node.tag === "function") {
      node[DOM_STASH] = [0, []];
    } else {
      const ns = nameSpaceMap[node.tag];
      if (ns) {
        nameSpaceContext || (nameSpaceContext = createContext$1(""));
        node.props.children = [
          {
            tag: nameSpaceContext,
            props: {
              value: node.n = `http://www.w3.org/${ns}`,
              children: node.props.children
            }
          }
        ];
      }
    }
    return node;
  }
};
var updateSync = (context, node) => {
  var _a3, _b2;
  (_a3 = node[DOM_STASH][2]) == null ? void 0 : _a3.forEach(([c, v]) => {
    c.values.push(v);
  });
  try {
    build(context, node, void 0);
  } catch {
    return;
  }
  if (node.a) {
    delete node.a;
    return;
  }
  (_b2 = node[DOM_STASH][2]) == null ? void 0 : _b2.forEach(([c]) => {
    c.values.pop();
  });
  if (context[0] !== 1 || !context[1]) {
    apply(node, node.c, false);
  }
};
var updateMap = /* @__PURE__ */ new WeakMap();
var currentUpdateSets = [];
var update = async (context, node) => {
  context[5] || (context[5] = []);
  const existing = updateMap.get(node);
  if (existing) {
    existing[0](void 0);
  }
  let resolve;
  const promise = new Promise((r) => resolve = r);
  updateMap.set(node, [
    resolve,
    () => {
      if (context[2]) {
        context[2](context, node, (context2) => {
          updateSync(context2, node);
        }).then(() => resolve(node));
      } else {
        updateSync(context, node);
        resolve(node);
      }
    }
  ]);
  if (currentUpdateSets.length) {
    currentUpdateSets.at(-1).add(node);
  } else {
    await Promise.resolve();
    const latest = updateMap.get(node);
    if (latest) {
      updateMap.delete(node);
      latest[1]();
    }
  }
  return promise;
};
var createPortal = (children, container, key) => ({
  tag: HONO_PORTAL_ELEMENT,
  props: {
    children
  },
  key,
  e: container,
  p: 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
});
var STASH_SATE = 0;
var STASH_EFFECT = 1;
var STASH_CALLBACK = 2;
var STASH_MEMO = 3;
var resolvedPromiseValueMap = /* @__PURE__ */ new WeakMap();
var isDepsChanged = (prevDeps, deps) => !prevDeps || !deps || prevDeps.length !== deps.length || deps.some((dep, i) => dep !== prevDeps[i]);
var updateHook = void 0;
var pendingStack = [];
var useState = (initialState) => {
  var _a3;
  const resolveInitialState = () => typeof initialState === "function" ? initialState() : initialState;
  const buildData = buildDataStack.at(-1);
  if (!buildData) {
    return [resolveInitialState(), () => {
    }];
  }
  const [, node] = buildData;
  const stateArray = (_a3 = node[DOM_STASH][1])[STASH_SATE] || (_a3[STASH_SATE] = []);
  const hookIndex = node[DOM_STASH][0]++;
  return stateArray[hookIndex] || (stateArray[hookIndex] = [
    resolveInitialState(),
    (newState) => {
      const localUpdateHook = updateHook;
      const stateData = stateArray[hookIndex];
      if (typeof newState === "function") {
        newState = newState(stateData[0]);
      }
      if (!Object.is(newState, stateData[0])) {
        stateData[0] = newState;
        if (pendingStack.length) {
          const [pendingType, pendingPromise] = pendingStack.at(-1);
          Promise.all([
            pendingType === 3 ? node : update([pendingType, false, localUpdateHook], node),
            pendingPromise
          ]).then(([node2]) => {
            if (!node2 || !(pendingType === 2 || pendingType === 3)) {
              return;
            }
            const lastVC = node2.vC;
            const addUpdateTask = () => {
              setTimeout(() => {
                if (lastVC !== node2.vC) {
                  return;
                }
                update([pendingType === 3 ? 1 : 0, false, localUpdateHook], node2);
              });
            };
            requestAnimationFrame(addUpdateTask);
          });
        } else {
          update([0, false, localUpdateHook], node);
        }
      }
    }
  ]);
};
var useCallback = (callback, deps) => {
  var _a3;
  const buildData = buildDataStack.at(-1);
  if (!buildData) {
    return callback;
  }
  const [, node] = buildData;
  const callbackArray = (_a3 = node[DOM_STASH][1])[STASH_CALLBACK] || (_a3[STASH_CALLBACK] = []);
  const hookIndex = node[DOM_STASH][0]++;
  const prevDeps = callbackArray[hookIndex];
  if (isDepsChanged(prevDeps == null ? void 0 : prevDeps[1], deps)) {
    callbackArray[hookIndex] = [callback, deps];
  } else {
    callback = callbackArray[hookIndex][0];
  }
  return callback;
};
var use = (promise) => {
  const cachedRes = resolvedPromiseValueMap.get(promise);
  if (cachedRes) {
    if (cachedRes.length === 2) {
      throw cachedRes[1];
    }
    return cachedRes[0];
  }
  promise.then(
    (res) => resolvedPromiseValueMap.set(promise, [res]),
    (e) => resolvedPromiseValueMap.set(promise, [void 0, e])
  );
  throw promise;
};
var useMemo = (factory2, deps) => {
  var _a3;
  const buildData = buildDataStack.at(-1);
  if (!buildData) {
    return factory2();
  }
  const [, node] = buildData;
  const memoArray = (_a3 = node[DOM_STASH][1])[STASH_MEMO] || (_a3[STASH_MEMO] = []);
  const hookIndex = node[DOM_STASH][0]++;
  const prevDeps = memoArray[hookIndex];
  if (isDepsChanged(prevDeps == null ? void 0 : prevDeps[1], deps)) {
    memoArray[hookIndex] = [factory2(), deps];
  }
  return memoArray[hookIndex][0];
};
var FormContext = createContext$1({
  pending: false,
  data: null,
  method: null,
  action: null
});
var actions = /* @__PURE__ */ new Set();
var registerAction = (action) => {
  actions.add(action);
  action.finally(() => actions.delete(action));
};
var composeRef = (ref, cb) => {
  return useMemo(
    () => (e) => {
      let refCleanup;
      if (ref) {
        if (typeof ref === "function") {
          refCleanup = ref(e) || (() => {
            ref(null);
          });
        } else if (ref && "current" in ref) {
          ref.current = e;
          refCleanup = () => {
            ref.current = null;
          };
        }
      }
      const cbCleanup = cb(e);
      return () => {
        cbCleanup == null ? void 0 : cbCleanup();
        refCleanup == null ? void 0 : refCleanup();
      };
    },
    [ref]
  );
};
var blockingPromiseMap = /* @__PURE__ */ Object.create(null);
var createdElements = /* @__PURE__ */ Object.create(null);
var documentMetadataTag = (tag, props, preserveNodeType, supportSort, supportBlocking) => {
  if (props == null ? void 0 : props.itemProp) {
    return {
      tag,
      props,
      type: tag,
      ref: props.ref
    };
  }
  const head = document.head;
  let { onLoad, onError, precedence, blocking, ...restProps } = props;
  let element = null;
  let created = false;
  const deDupeKeys = deDupeKeyMap[tag];
  let existingElements = void 0;
  if (deDupeKeys.length > 0) {
    const tags = head.querySelectorAll(tag);
    LOOP: for (const e of tags) {
      for (const key of deDupeKeyMap[tag]) {
        if (e.getAttribute(key) === props[key]) {
          element = e;
          break LOOP;
        }
      }
    }
    if (!element) {
      const cacheKey = deDupeKeys.reduce(
        (acc, key) => props[key] === void 0 ? acc : `${acc}-${key}-${props[key]}`,
        tag
      );
      created = !createdElements[cacheKey];
      element = createdElements[cacheKey] || (createdElements[cacheKey] = (() => {
        const e = document.createElement(tag);
        for (const key of deDupeKeys) {
          if (props[key] !== void 0) {
            e.setAttribute(key, props[key]);
          }
          if (props.rel) {
            e.setAttribute("rel", props.rel);
          }
        }
        return e;
      })());
    }
  } else {
    existingElements = head.querySelectorAll(tag);
  }
  precedence = supportSort ? precedence ?? "" : void 0;
  if (supportSort) {
    restProps[dataPrecedenceAttr] = precedence;
  }
  const insert = useCallback(
    (e) => {
      if (deDupeKeys.length > 0) {
        let found = false;
        for (const existingElement of head.querySelectorAll(tag)) {
          if (found && existingElement.getAttribute(dataPrecedenceAttr) !== precedence) {
            head.insertBefore(e, existingElement);
            return;
          }
          if (existingElement.getAttribute(dataPrecedenceAttr) === precedence) {
            found = true;
          }
        }
        head.appendChild(e);
      } else if (existingElements) {
        let found = false;
        for (const existingElement of existingElements) {
          if (existingElement === e) {
            found = true;
            break;
          }
        }
        if (!found) {
          head.insertBefore(
            e,
            head.contains(existingElements[0]) ? existingElements[0] : head.querySelector(tag)
          );
        }
        existingElements = void 0;
      }
    },
    [precedence]
  );
  const ref = composeRef(props.ref, (e) => {
    var _a3;
    const key = deDupeKeys[0];
    if (preserveNodeType === 2) {
      e.innerHTML = "";
    }
    if (created || existingElements) {
      insert(e);
    }
    if (!onError && !onLoad) {
      return;
    }
    let promise = blockingPromiseMap[_a3 = e.getAttribute(key)] || (blockingPromiseMap[_a3] = new Promise(
      (resolve, reject) => {
        e.addEventListener("load", resolve);
        e.addEventListener("error", reject);
      }
    ));
    if (onLoad) {
      promise = promise.then(onLoad);
    }
    if (onError) {
      promise = promise.catch(onError);
    }
    promise.catch(() => {
    });
  });
  if (supportBlocking && blocking === "render") {
    const key = deDupeKeyMap[tag][0];
    if (props[key]) {
      const value = props[key];
      const promise = blockingPromiseMap[value] || (blockingPromiseMap[value] = new Promise((resolve, reject) => {
        insert(element);
        element.addEventListener("load", resolve);
        element.addEventListener("error", reject);
      }));
      use(promise);
    }
  }
  const jsxNode = {
    tag,
    type: tag,
    props: {
      ...restProps,
      ref
    },
    ref
  };
  jsxNode.p = preserveNodeType;
  if (element) {
    jsxNode.e = element;
  }
  return createPortal(
    jsxNode,
    head
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  );
};
var title = (props) => {
  const nameSpaceContext2 = getNameSpaceContext();
  const ns = nameSpaceContext2 && useContext(nameSpaceContext2);
  if (ns == null ? void 0 : ns.endsWith("svg")) {
    return {
      tag: "title",
      props,
      type: "title",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref: props.ref
    };
  }
  return documentMetadataTag("title", props, void 0, false, false);
};
var script = (props) => {
  if (!props || ["src", "async"].some((k) => !props[k])) {
    return {
      tag: "script",
      props,
      type: "script",
      ref: props.ref
    };
  }
  return documentMetadataTag("script", props, 1, false, true);
};
var style = (props) => {
  if (!props || !["href", "precedence"].every((k) => k in props)) {
    return {
      tag: "style",
      props,
      type: "style",
      ref: props.ref
    };
  }
  props["data-href"] = props.href;
  delete props.href;
  return documentMetadataTag("style", props, 2, true, true);
};
var link = (props) => {
  if (!props || ["onLoad", "onError"].some((k) => k in props) || props.rel === "stylesheet" && (!("precedence" in props) || "disabled" in props)) {
    return {
      tag: "link",
      props,
      type: "link",
      ref: props.ref
    };
  }
  return documentMetadataTag("link", props, 1, "precedence" in props, true);
};
var meta = (props) => {
  return documentMetadataTag("meta", props, void 0, false, false);
};
var customEventFormAction = /* @__PURE__ */ Symbol();
var form = (props) => {
  const { action, ...restProps } = props;
  if (typeof action !== "function") {
    restProps.action = action;
  }
  const [state, setState] = useState([null, false]);
  const onSubmit = useCallback(
    async (ev) => {
      const currentAction = ev.isTrusted ? action : ev.detail[customEventFormAction];
      if (typeof currentAction !== "function") {
        return;
      }
      ev.preventDefault();
      const formData = new FormData(ev.target);
      setState([formData, true]);
      const actionRes = currentAction(formData);
      if (actionRes instanceof Promise) {
        registerAction(actionRes);
        await actionRes;
      }
      setState([null, true]);
    },
    []
  );
  const ref = composeRef(props.ref, (el) => {
    el.addEventListener("submit", onSubmit);
    return () => {
      el.removeEventListener("submit", onSubmit);
    };
  });
  const [data, isDirty] = state;
  state[1] = false;
  return {
    tag: FormContext,
    props: {
      value: {
        pending: data !== null,
        data,
        method: data ? "post" : null,
        action: data ? action : null
      },
      children: {
        tag: "form",
        props: {
          ...restProps,
          ref
        },
        type: "form",
        ref
      }
    },
    f: isDirty
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  };
};
var formActionableElement = (tag, {
  formAction,
  ...props
}) => {
  if (typeof formAction === "function") {
    const onClick = useCallback((ev) => {
      ev.preventDefault();
      ev.currentTarget.form.dispatchEvent(
        new CustomEvent("submit", { detail: { [customEventFormAction]: formAction } })
      );
    }, []);
    props.ref = composeRef(props.ref, (el) => {
      el.addEventListener("click", onClick);
      return () => {
        el.removeEventListener("click", onClick);
      };
    });
  }
  return {
    tag,
    props,
    type: tag,
    ref: props.ref
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  };
};
var input = (props) => formActionableElement("input", props);
var button = (props) => formActionableElement("button", props);
Object.assign(domRenderers, {
  title,
  script,
  style,
  link,
  meta,
  form,
  input,
  button
});
createContext(null);
new TextEncoder();
var RequestContext = createContext(null);
var createRenderer = (c, Layout, component, options) => (children, props) => {
  const docType = "<!DOCTYPE html>";
  const currentLayout = component ? jsx(
    (props2) => component(props2, c),
    {
      Layout,
      ...props
    },
    children
  ) : children;
  const body = html`${raw(docType)}${jsx(
    RequestContext.Provider,
    { value: c },
    currentLayout
  )}`;
  {
    return c.html(body);
  }
};
var jsxRenderer = (component, options) => function jsxRenderer2(c, next) {
  const Layout = c.getLayout() ?? Fragment;
  if (component) {
    c.setLayout((props) => {
      return component({ ...props, Layout }, c);
    });
  }
  c.setRenderer(createRenderer(c, Layout, component));
  return next();
};
const _renderer = jsxRenderer(({ children, title: title2 }) => {
  return /* @__PURE__ */ jsxDEV("html", { lang: "zh-CN", children: [
    /* @__PURE__ */ jsxDEV("head", { children: [
      /* @__PURE__ */ jsxDEV("meta", { charSet: "UTF-8" }),
      /* @__PURE__ */ jsxDEV("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
      /* @__PURE__ */ jsxDEV("title", { children: title2 || "OpenClaw Helper" }),
      /* @__PURE__ */ jsxDEV("link", { rel: "stylesheet", href: "/tailwind.css" }),
      /* @__PURE__ */ jsxDEV("style", { dangerouslySetInnerHTML: { __html: "[x-cloak]{display:none!important}.hx-loading{display:none!important}.htmx-request.hx-loading,.htmx-request .hx-loading{display:inline-flex!important}.htmx-request>.hx-ready{display:none!important}" } }),
      /* @__PURE__ */ jsxDEV("script", { src: "https://unpkg.com/htmx.org@2.0.4" }),
      /* @__PURE__ */ jsxDEV("script", { defer: true, src: "https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js" })
    ] }),
    /* @__PURE__ */ jsxDEV("body", { class: "min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900 text-slate-100 font-sans", children })
  ] });
});
const __vite_glob_2_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _renderer
}, Symbol.toStringTag, { value: "Module" }));
var Factory = (_j = class {
  constructor(init) {
    __publicField(this, "initApp");
    __privateAdd(this, _defaultAppOptions);
    __publicField(this, "createApp", (options) => {
      const app2 = new Hono(
        options && __privateGet(this, _defaultAppOptions) ? { ...__privateGet(this, _defaultAppOptions), ...options } : options ?? __privateGet(this, _defaultAppOptions)
      );
      if (this.initApp) {
        this.initApp(app2);
      }
      return app2;
    });
    __publicField(this, "createMiddleware", (middleware) => middleware);
    __publicField(this, "createHandlers", (...handlers) => {
      return handlers.filter((handler) => handler !== void 0);
    });
    this.initApp = init == null ? void 0 : init.initApp;
    __privateSet(this, _defaultAppOptions, init == null ? void 0 : init.defaultAppOptions);
  }
}, _defaultAppOptions = new WeakMap(), _j);
var createFactory = (init) => new Factory(init);
var createMiddleware = (middleware) => middleware;
const factory = createFactory();
const createRoute = factory.createHandlers;
const modelAdderAlpine = `
document.addEventListener('alpine:init', () => {
  Alpine.data('modelAdder', () => ({
    provider: '',
    minimaxToken: '',
    customBaseUrl: '',
    customApiKey: '',
    customModelId: '',
    customInputTypes: ['text'],
    customSetDefault: false,
    loading: false,
    alert: null,
    _alertTimer: null,
    oauth: { show: false, title: '', output: '', showOpen: false, showDone: false, openUrl: '', ws: null },

    get canSubmit() {
      if (this.provider === 'minimax') return !!this.minimaxToken;
      if (this.provider === 'custom') return !!this.customBaseUrl.trim() && !!this.customApiKey.trim() && !!this.customModelId.trim();
      return !!this.provider;
    },

    showAlert(type, message) {
      if (this._alertTimer) clearTimeout(this._alertTimer);
      this.alert = { type, message };
      this._alertTimer = setTimeout(() => { this.alert = null; }, 5000);
      // 同时触发全局提示
      window.dispatchEvent(new CustomEvent('show-alert', { detail: { type, message } }));
    },

    closeOAuth() {
      this.oauth.show = false;
      if (this.oauth.ws) { this.oauth.ws.close(); this.oauth.ws = null; }
    },

    onModelSuccess() {
      this.showAlert('success', '模型配置成功！');
      this.provider = '';
      this.minimaxToken = '';
      this.customBaseUrl = '';
      this.customApiKey = '';
      this.customModelId = '';
      this.customInputTypes = ['text'];
      this.customSetDefault = false;
      // 刷新模型列表
      htmx.ajax('GET', '/api/partials/models', { target: '#model-list', swap: 'innerHTML' });
    },

    async submitModel() {
      if (!this.canSubmit) return;
      this.loading = true;
      try {
        const payload = { provider: this.provider, token: this.minimaxToken || undefined };
        if (this.provider === 'custom') {
          payload.custom = {
            baseUrl: this.customBaseUrl.trim(),
            apiKey: this.customApiKey.trim(),
            modelId: this.customModelId.trim(),
            inputTypes: this.customInputTypes.length > 0 ? this.customInputTypes : ['text'],
            setDefault: this.customSetDefault
          };
        }
        const res = await fetch('/api/config/model', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        this.loading = false;
        if (result.success && result.data.requiresOAuth) {
          if (result.data.oauthMode === 'auto') this.startGptOAuth();
          else if (result.data.oauthMode === 'device') this.startQwenDevice();
          else if (result.data.manualOAuth) this.showManualOAuth(result.data.command);
          else this.startWsOAuth(this.provider);
        } else if (result.success) {
          this.onModelSuccess();
        } else {
          this.showAlert('error', result.error || '配置失败');
        }
      } catch (err) {
        this.loading = false;
        this.showAlert('error', '网络错误: ' + err.message);
      }
    },

    async startGptOAuth() {
      this.oauth = { show: true, title: 'GPT OAuth 登录', output: '正在启动 ChatGPT OAuth 授权...', showOpen: true, showDone: false, openUrl: '', ws: null };
      try {
        const res = await fetch('/api/config/gpt-oauth/start', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const result = await res.json();
        if (!result.success) { this.oauth.output = '<div class="text-red-400">✗ ' + (result.error || '启动失败') + '</div>'; return; }
        const { sessionId, authUrl } = result.data;
        this.oauth.openUrl = authUrl;
        this.oauth.output = '<div style="color:#fbbf24;font-weight:bold;margin-bottom:12px">⏳ 等待授权中...</div>\\n请在浏览器中打开以下链接完成授权：\\n\\n' + authUrl + '\\n\\n<div style="color:#10b981;font-weight:bold;margin-top:12px">✓ 授权完成后将自动刷新模型列表</div>';
        window.open(authUrl, '_blank');
        this.pollOAuth('/api/config/gpt-oauth/poll', sessionId, 2000);
      } catch (err) { this.oauth.output = '<div class="text-red-400">✗ 网络错误: ' + err.message + '</div>'; }
    },

    async startQwenDevice() {
      this.oauth = { show: true, title: '千问 OAuth 登录', output: '正在请求授权链接...', showOpen: true, showDone: false, openUrl: '', ws: null };
      try {
        const res = await fetch('/api/config/qwen-oauth/start', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const result = await res.json();
        if (!result.success) { this.oauth.output = '<div class="text-red-400">✗ ' + (result.error || '启动失败') + '</div>'; return; }
        const { sessionId, verificationUrl, userCode, interval } = result.data;
        this.oauth.openUrl = verificationUrl;
        this.oauth.output = '<div style="color:#fbbf24;font-weight:bold;margin-bottom:12px">⏳ 等待授权中...</div>\\n\\n请在浏览器打开以下链接完成授权：\\n\\n' + verificationUrl + '\\n\\n<div style="color:#8b5cf6;font-weight:bold;margin:12px 0">验证码：' + userCode + '</div>\\n\\n<div style="color:#10b981;font-weight:bold;margin-top:12px">✓ 授权完成后将自动刷新模型列表</div>';
        window.open(verificationUrl, '_blank');
        this.pollOAuth('/api/config/qwen-oauth/poll', sessionId, Math.max(2000, (interval || 2) * 1000));
      } catch (err) { this.oauth.output = '<div class="text-red-400">✗ 网络错误: ' + err.message + '</div>'; }
    },

    async pollOAuth(url, sessionId, ms) {
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
        const r = await res.json();
        if (r.success && r.data?.status === 'pending') { setTimeout(() => this.pollOAuth(url, sessionId, ms), ms); return; }
        if (r.success && r.data?.status === 'success') {
          this.oauth.output += '\\n<div class="text-emerald-400">✓ 登录成功</div>';
          setTimeout(() => { this.closeOAuth(); this.onModelSuccess(); }, 1000);
          return;
        }
        this.oauth.output += '\\n<div class="text-red-400">✗ ' + (r.error || '登录失败') + '</div>';
      } catch { this.oauth.output += '\\n<div class="text-red-400">✗ 轮询失败</div>'; }
    },

    showManualOAuth(command) {
      this.oauth = { show: true, title: 'OAuth 登录', output: '当前环境无法创建交互式终端。\\n请在你的本地终端执行以下命令完成登录：\\n\\n' + (command || '') + '\\n\\n完成后点击"已完成登录"。', showOpen: false, showDone: true, openUrl: '', ws: null };
    },
    manualOAuthDone() {
      this.closeOAuth();
      this.onModelSuccess();
    },

    startWsOAuth(provider) {
      const label = provider === 'gpt' ? 'GPT' : '千问';
      this.oauth = { show: true, title: label + ' OAuth 登录', output: '正在启动 ' + label + ' OAuth 登录...\\n\\n', showOpen: false, showDone: false, openUrl: '', ws: null };
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(protocol + '//' + window.location.host + '/ws/oauth-login');
      this.oauth.ws = ws;
      ws.onopen = () => ws.send(JSON.stringify({ provider }));
      ws.onmessage = (e) => {
        const d = JSON.parse(e.data);
        if (d.type === 'output') this.oauth.output += d.data;
        else if (d.type === 'success') {
          this.oauth.output += '\\n<div class="text-emerald-400">✓ ' + d.message + '</div>';
          setTimeout(() => { this.closeOAuth(); this.onModelSuccess(); }, 2000);
        } else if (d.type === 'error') {
          this.oauth.output += '\\n<div class="text-red-400">✗ ' + d.message + '</div>';
          setTimeout(() => { this.closeOAuth(); this.showAlert('error', '登录失败: ' + d.message); }, 2000);
        }
      };
      ws.onerror = () => {
        this.oauth.output += '\\n<div class="text-red-400">✗ 连接错误</div>';
        setTimeout(() => { this.closeOAuth(); this.showAlert('error', 'WebSocket 连接失败'); }, 2000);
      };
    }
  }))
})
`;
const whatsappLinkerAlpine = `
document.addEventListener('alpine:init', () => {
  Alpine.data('whatsappLinker', () => ({
    // 状态: idle | loading | qr | success | error
    state: 'idle',
    loadingStep: '',
    qrDataUrl: '',
    errorMsg: '',
    pollCount: 0,
    maxPolls: 60,
    _pollTimer: null,

    destroy() {
      if (this._pollTimer) {
        clearTimeout(this._pollTimer);
        this._pollTimer = null;
      }
    },

    async startLinking() {
      this.state = 'loading';
      this.loadingStep = '正在注销旧会话并生成新的二维码...';
      this.errorMsg = '';
      this.qrDataUrl = '';
      this.pollCount = 0;

      try {
        this.loadingStep = '① 注销旧 WhatsApp 会话...';
        const res = await fetch('/api/config/whatsapp/link/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        this.loadingStep = '② 生成二维码中...';
        const result = await res.json();

        if (!result.success) {
          this.state = 'error';
          this.errorMsg = result.error || 'WhatsApp 链接启动失败';
          return;
        }

        if (!result.data.qrDataUrl) {
          this.state = 'error';
          this.errorMsg = '未能获取二维码，请确认 Gateway 已启动且 WhatsApp 插件已安装';
          return;
        }

        this.qrDataUrl = result.data.qrDataUrl;
        this.state = 'qr';
        // 开始轮询扫码状态
        this.pollLinkStatus();
      } catch (err) {
        this.state = 'error';
        this.errorMsg = '网络错误: ' + (err.message || '请检查网络连接');
      }
    },

    async pollLinkStatus() {
      if (this.state !== 'qr') return;
      if (this.pollCount >= this.maxPolls) {
        this.state = 'error';
        this.errorMsg = '等待超时，请重新生成二维码';
        return;
      }

      this.pollCount++;
      try {
        const res = await fetch('/api/config/whatsapp/link/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await res.json();

        if (result.success && result.data.connected) {
          this.state = 'success';
          // 触发全局提示
          window.dispatchEvent(new CustomEvent('show-alert', {
            detail: { type: 'success', message: 'WhatsApp 连接成功！' }
          }));
          // 刷新渠道列表
          if (typeof htmx !== 'undefined') {
            htmx.ajax('GET', '/api/partials/channels', { target: '#channel-list', swap: 'innerHTML' });
            htmx.ajax('GET', '/api/partials/channels/available', { target: '#available-channels', swap: 'innerHTML' });
          }
          return;
        }

        // 继续轮询
        this._pollTimer = setTimeout(() => this.pollLinkStatus(), 3000);
      } catch {
        // 网络错误时继续尝试
        this._pollTimer = setTimeout(() => this.pollLinkStatus(), 5000);
      }
    },

    reset() {
      if (this._pollTimer) {
        clearTimeout(this._pollTimer);
        this._pollTimer = null;
      }
      this.state = 'idle';
      this.qrDataUrl = '';
      this.errorMsg = '';
      this.pollCount = 0;
    },

    close() {
      this.reset();
      const area = document.getElementById('channel-form-area');
      if (area) area.innerHTML = '';
    }
  }))
})
`;
function stripAnsi(str) {
  return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");
}
function extractPlainValue(stdout) {
  const clean = stripAnsi(stdout);
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length ? lines[lines.length - 1] : "";
}
function extractJson(stdout) {
  const clean = stripAnsi(stdout);
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
}
async function getOpenClawStatus() {
  const status = {
    defaultModel: null,
    telegramConfigured: false,
    gatewayRunning: false,
    gatewayToken: null
  };
  try {
    const { stdout } = await execa("openclaw", ["config", "get", "agents.defaults.model.primary"]);
    status.defaultModel = extractPlainValue(stdout);
  } catch {
    status.defaultModel = null;
  }
  try {
    const { stdout } = await execa("openclaw", ["config", "get", "channels.telegram.botToken"]);
    status.telegramConfigured = !!extractPlainValue(stdout);
  } catch {
    status.telegramConfigured = false;
  }
  try {
    const { stdout } = await execa("openclaw", ["config", "get", "gateway.auth.token"]);
    status.gatewayToken = extractPlainValue(stdout) || null;
  } catch {
    status.gatewayToken = null;
  }
  try {
    await execa("pgrep", ["-f", "openclaw.*gateway"]);
    status.gatewayRunning = true;
  } catch {
    status.gatewayRunning = false;
  }
  return status;
}
var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw2) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(cooked.slice()) }));
var _a$1;
const config = createRoute(async (c) => {
  const status = await getOpenClawStatus();
  let openClawUrl = "http://127.0.0.1:18789";
  if (status.gatewayToken) {
    openClawUrl += `?token=${encodeURIComponent(status.gatewayToken)}`;
  }
  return c.render(
    html(_a$1 || (_a$1 = __template$1([`
    <div x-data="{ tab: 'models', alert: null, _t: null }"
         @show-alert.window="alert = $event.detail; clearTimeout(_t); _t = setTimeout(() => alert = null, 5000)">

      <div class="h-screen w-full px-6 py-10 overflow-y-auto">
        <div class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">

          <!-- 侧边栏 -->
          <aside class="rounded-2xl bg-slate-900/80 p-6 text-slate-200 shadow-xl">
            <div class="text-sm font-semibold text-white">OpenClaw 控制台</div>
            <div class="mt-1 text-xs text-slate-400">更多配置指引</div>
            <div class="mt-6 flex flex-col gap-2">
              <button @click="tab='models'" :class="tab==='models' ? 'bg-slate-800 text-white' : 'text-slate-300'" class="rounded-lg px-3 py-2 text-left text-sm">模型</button>
              <button @click="tab='channels'" :class="tab==='channels' ? 'bg-slate-800 text-white' : 'text-slate-300'" class="rounded-lg px-3 py-2 text-left text-sm">渠道</button>
              <button @click="tab='skills'" :class="tab==='skills' ? 'bg-slate-800 text-white' : 'text-slate-300'" class="rounded-lg px-3 py-2 text-left text-sm">技能</button>
              <button @click="tab='remote'" :class="tab==='remote' ? 'bg-slate-800 text-white' : 'text-slate-300'" class="rounded-lg px-3 py-2 text-left text-sm">远程支持</button>
            </div>
          </aside>

          <!-- 主内容 -->
          <main class="rounded-2xl bg-white p-8 text-slate-700 shadow-2xl">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 class="text-2xl font-semibold text-slate-800">配置中心</h1>
                <p class="mt-1 text-sm text-slate-500">集中管理模型、渠道、技能与远程支持</p>
              </div>
              `, `
            </div>

            <!-- 全局提示 -->
            <div x-show="alert && alert.type === 'error'" x-cloak x-text="alert?.message" class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"></div>
            <div x-show="alert && alert.type === 'success'" x-cloak x-text="alert?.message" class="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"></div>

            <!-- ═══ 模型管理 ═══ -->
            <div x-show="tab==='models'">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">已配置模型</h4>
                <p class="mt-2 text-sm text-slate-500">下方显示当前 OpenClaw 配置的模型及其支持的输入类型，点击可快速切换默认模型。</p>
                <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                     id="model-list"
                     hx-get="/api/partials/models"
                     hx-trigger="load"
                     hx-swap="innerHTML">
                  <p class="text-sm text-slate-400">加载中...</p>
                </div>
              </div>

              <!-- 新增模型 -->
              <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6" x-data="modelAdder">

                <!-- OAuth 弹窗 -->
                <div x-show="oauth.show" x-cloak class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70">
                  <div class="w-full max-w-2xl rounded-2xl bg-slate-900 text-slate-100 shadow-2xl">
                    <div class="flex items-center justify-between border-b border-slate-700 px-5 py-3">
                      <div class="text-sm" x-text="oauth.title"></div>
                      <button class="text-xl text-slate-400 hover:text-white" @click="closeOAuth()">×</button>
                    </div>
                    <div class="max-h-[520px] overflow-y-auto px-5 py-4 font-mono text-sm">
                      <div class="whitespace-pre-wrap" x-html="oauth.output"></div>
                      <div class="mt-4 flex justify-end gap-2">
                        <button x-show="oauth.showOpen" @click="window.open(oauth.openUrl,'_blank')" class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">打开授权页面</button>
                        <button x-show="oauth.showDone" @click="manualOAuthDone()" class="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-400">已完成登录</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Loading -->
                <div x-show="loading" x-cloak class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40">
                  <div class="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
                    <div class="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></div>
                    <p class="text-sm text-slate-600">正在配置中，请稍候...</p>
                  </div>
                </div>

                <h4 class="text-lg font-semibold text-slate-800">新增模型</h4>
                <p class="mt-2 text-sm text-slate-500">选择提供商，通过 OAuth 登录或填写 API Key 添加模型。</p>

                <div class="mt-4">
                  <label class="mb-2 block text-sm font-medium text-slate-600">选择模型提供商</label>
                  <select x-model="provider" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none">
                    <option value="">-- 请选择 --</option>
                    <option value="minimax">MiniMax (需要 API Key)</option>
                    <option value="gpt">GPT (通过 ChatGPT OAuth 登录)</option>
                    <option value="qwen">千问 (通过 OAuth 登录)</option>
                    <option value="custom">第三方模型 (OpenAI 兼容 API)</option>
                  </select>
                </div>

                <div x-show="provider === 'minimax'" x-cloak class="mt-4">
                  <label class="mb-2 block text-sm font-medium text-slate-600">MiniMax API Key</label>
                  <input type="text" x-model="minimaxToken" placeholder="请输入 MiniMax API Key" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                </div>

                <!-- 第三方模型表单 -->
                <div x-show="provider === 'custom'" x-cloak class="mt-4 space-y-4">
                  <div class="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                    <p class="text-sm text-blue-700">支持任何兼容 OpenAI Chat Completions API 的第三方服务，例如 Gemini、Moonshot、DeepSeek 等。</p>
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-slate-600">API Base URL <span class="text-red-400">*</span></label>
                    <input type="text" x-model="customBaseUrl" placeholder="例如：https://gptproto.com/v1" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-slate-600">API Key <span class="text-red-400">*</span></label>
                    <input type="password" x-model="customApiKey" placeholder="请输入 API Key" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-slate-600">模型 ID <span class="text-red-400">*</span></label>
                    <input type="text" x-model="customModelId" placeholder="例如：gemini-3-pro-preview、deepseek-chat" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-slate-600">支持的输入类型</label>
                    <div class="flex flex-wrap gap-4 mt-2">
                      <label class="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" value="text" x-model="customInputTypes" class="rounded" /> 文本</label>
                      <label class="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" value="image" x-model="customInputTypes" class="rounded" /> 图片</label>
                      <label class="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" value="audio" x-model="customInputTypes" class="rounded" /> 音频</label>
                    </div>
                  </div>
                  <div>
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" x-model="customSetDefault" class="rounded" />
                      设为默认模型
                    </label>
                  </div>
                </div>

                <div class="mt-6 flex justify-end">
                  <button @click="submitModel()" :disabled="!canSubmit" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400">添加模型</button>
                </div>
              </div>
            </div>

            <!-- ═══ 渠道管理 ═══ -->
            <div x-show="tab==='channels'" x-cloak>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">已配置渠道</h4>
                <p class="mt-2 text-sm text-slate-500">管理已配置的消息渠道，支持编辑和启用/关闭。</p>
                <div class="mt-4 grid gap-3 md:grid-cols-2"
                     id="channel-list"
                     hx-get="/api/partials/channels"
                     hx-trigger="intersect once"
                     hx-swap="innerHTML">
                  <p class="text-sm text-slate-400">加载中...</p>
                </div>
              </div>
              <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h4 class="text-lg font-semibold text-slate-800">新增渠道</h4>
                <p class="mt-2 text-sm text-slate-500">选择要添加的渠道类型，点击对应按钮开始配置。</p>
                <div id="available-channels"
                     hx-get="/api/partials/channels/available"
                     hx-trigger="intersect once"
                     hx-swap="innerHTML">
                  <p class="mt-4 text-sm text-slate-400">加载中...</p>
                </div>
              </div>
              <div id="channel-form-area" class="mt-6"></div>
            </div>

            <!-- ═══ 技能管理 ═══ -->
            <div x-show="tab==='skills'" x-cloak>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">预装技能说明</h4>
                <p class="mt-2 text-sm text-slate-500">install.sh 默认安装以下技能，便于快速使用常见能力。</p>
                <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>blogwatcher</strong><div class="mt-2 text-xs text-slate-500">监控博客更新并推送摘要</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>nano-pdf</strong><div class="mt-2 text-xs text-slate-500">快速读取与处理 PDF 内容</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>obsidian</strong><div class="mt-2 text-xs text-slate-500">Obsidian 笔记协作工具</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>gifgrep</strong><div class="mt-2 text-xs text-slate-500">快速检索 GIF 与短视频帧</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>model-usage</strong><div class="mt-2 text-xs text-slate-500">统计模型调用与用量</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>video-frames</strong><div class="mt-2 text-xs text-slate-500">提取视频关键帧</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>peekaboo</strong><div class="mt-2 text-xs text-slate-500">快速预览内容与格式检查</div></div>
                </div>
              </div>
            </div>

            <!-- ═══ 远程支持 ═══ -->
            <div x-show="tab==='remote'" x-cloak>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">开启共享登录</h4>
                <p class="mt-2 text-sm text-slate-500">打开设置 → 通用 → 共享 → 打开"共享登录"。</p>
                <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <img src="/assets/remote-login-1.png" alt="共享登录步骤 1" class="w-full rounded-2xl border border-slate-200" />
                  <img src="/assets/remote-login-2.png" alt="共享登录步骤 2" class="w-full rounded-2xl border border-slate-200" />
                </div>
              </div>
              <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h4 class="text-lg font-semibold text-slate-800">远程支持配置</h4>
                <div hx-get="/api/partials/remote-support/form"
                     hx-trigger="intersect once"
                     hx-swap="innerHTML">
                  <p class="mt-4 text-sm text-slate-400">加载中...</p>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
    <script>`, "<\/script>\n    <script>", "<\/script>\n    "])), status.defaultModel && status.telegramConfigured ? html`
                <a class="rounded-lg bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 flex items-center gap-2" href="${openClawUrl}" target="_blank">
                  <span>打开 OpenClaw 页面</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" />
                    <path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd" />
                  </svg>
                </a>
              ` : html`
                <a class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" href="/">返回配置助手</a>
              `, raw(modelAdderAlpine), raw(whatsappLinkerAlpine)),
    { title: "OpenClaw 配置指引" }
  );
});
const __vite_glob_4_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: config
}, Symbol.toStringTag, { value: "Module" }));
function TelegramGuide(props) {
  return /* @__PURE__ */ jsxDEV("div", { class: "rounded-2xl border border-slate-200 bg-slate-50 p-6", children: [
    /* @__PURE__ */ jsxDEV("h3", { class: "text-lg font-semibold text-slate-700", children: "配置指南" }),
    /* @__PURE__ */ jsxDEV("div", { class: "mt-4 space-y-6 text-sm text-slate-600", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("h4", { class: "font-semibold text-slate-700", children: "1. 找到 BotFather" }),
        /* @__PURE__ */ jsxDEV("p", { class: "mt-2", children: [
          "在 Telegram 中搜索 ",
          /* @__PURE__ */ jsxDEV("strong", { children: "@BotFather" }),
          ",确认其名称旁边有蓝色认证标记。"
        ] }),
        /* @__PURE__ */ jsxDEV("img", { src: "/assets/image-1.png", alt: "搜索 BotFather", class: "mt-3 w-full max-w-lg rounded-xl" }),
        /* @__PURE__ */ jsxDEV("p", { class: "mt-3", children: [
          "点击 ",
          /* @__PURE__ */ jsxDEV("strong", { children: "Start" }),
          "(或输入 ",
          /* @__PURE__ */ jsxDEV("code", { class: "rounded bg-slate-200 px-2 py-1 text-xs", children: "/start" }),
          ")。"
        ] }),
        /* @__PURE__ */ jsxDEV("img", { src: "/assets/image-2.png", alt: "启动 BotFather", class: "mt-3 w-full max-w-lg rounded-xl" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("h4", { class: "font-semibold text-slate-700", children: "2. 创建新机器人" }),
        /* @__PURE__ */ jsxDEV("p", { class: "mt-2", children: [
          "在对话框中输入指令: ",
          /* @__PURE__ */ jsxDEV("code", { class: "rounded bg-slate-200 px-2 py-1 text-xs", children: "/newbot" })
        ] }),
        /* @__PURE__ */ jsxDEV("img", { src: "/assets/image-3.png", alt: "创建机器人", class: "mt-3 w-full max-w-lg rounded-xl" }),
        /* @__PURE__ */ jsxDEV("p", { class: "mt-3", children: [
          /* @__PURE__ */ jsxDEV("strong", { children: "设定名称 (Name)" }),
          ": 这是你的机器人显示的昵称(例如: My Assistant),可以随时更改。"
        ] }),
        /* @__PURE__ */ jsxDEV("img", { src: "/assets/image-4.png", alt: "设置名称", class: "mt-3 w-full max-w-lg rounded-xl" }),
        /* @__PURE__ */ jsxDEV("p", { class: "mt-3", children: [
          /* @__PURE__ */ jsxDEV("strong", { children: "设定用户名 (Username)" }),
          ": 这是用户搜索你的机器人时使用的唯一 ID。必须以 ",
          /* @__PURE__ */ jsxDEV("code", { class: "rounded bg-slate-200 px-2 py-1 text-xs", children: "bot" }),
          " 结尾(例如: my_assistant_2026_bot),且不能与他人重复。"
        ] }),
        /* @__PURE__ */ jsxDEV("img", { src: "/assets/image-5.png", alt: "设置用户名", class: "mt-3 w-full max-w-lg rounded-xl" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("h4", { class: "font-semibold text-slate-700", children: "3. 复制 Token" }),
        /* @__PURE__ */ jsxDEV("p", { class: "mt-2", children: [
          "完成上述步骤后,BotFather 会发送一条包含 ",
          /* @__PURE__ */ jsxDEV("strong", { children: "HTTP API Token" }),
          " 的消息。"
        ] }),
        /* @__PURE__ */ jsxDEV("p", { class: "mt-2", children: [
          "Token 的格式通常类似于: ",
          /* @__PURE__ */ jsxDEV("code", { class: "rounded bg-slate-200 px-2 py-1 text-xs", children: "123456789:ABCDefghIJKLmnopQRSTuvwxYZ" })
        ] }),
        /* @__PURE__ */ jsxDEV("p", { class: "mt-2", children: "直接点击该 Token 即可复制。" }),
        /* @__PURE__ */ jsxDEV("img", { src: "/assets/image-6.png", alt: "复制 Token", class: "mt-3 w-full max-w-lg rounded-xl" }),
        props.withTokenInput ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { class: "mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-amber-700 font-semibold", children: "在这里输入 Token" }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-3", children: [
            /* @__PURE__ */ jsxDEV("label", { for: "tg-token", class: "mb-2 block text-sm font-medium text-slate-600", children: "Telegram Bot Token" }),
            props.alpineTokenModel ? /* @__PURE__ */ jsxDEV("input", { type: "text", "x-model": props.alpineTokenModel, name: props.inputName, placeholder: props.tokenPlaceholder || "请输入 Bot Token", class: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" }) : /* @__PURE__ */ jsxDEV("input", { type: "text", id: "tg-token", name: props.inputName, placeholder: props.tokenPlaceholder || "请输入 Bot Token", class: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" })
          ] })
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("h4", { class: "font-semibold text-slate-700", children: "4. 绑定 TG 用户 ID" }),
        /* @__PURE__ */ jsxDEV("p", { class: "mt-2", children: [
          "在 Telegram 搜索机器人 ",
          /* @__PURE__ */ jsxDEV("strong", { children: "@username_to_id_bot" }),
          ",发送消息获取你的用户 ID。"
        ] }),
        /* @__PURE__ */ jsxDEV("img", { src: "/assets/image-7.png", alt: "获取用户 ID", class: "mt-3 w-full max-w-lg rounded-xl" })
      ] })
    ] })
  ] });
}
const wizardAlpine = `
document.addEventListener('alpine:init', () => {
  Alpine.data('wizard', () => ({
    step: 1,
    provider: '',
    minimaxToken: '',
    customBaseUrl: '',
    customApiKey: '',
    customModelId: '',
    customInputTypes: ['text'],
    customSetDefault: false,
    tgToken: '',
    tgUserId: '',
    tgLoaded: false,
    loading: false,
    alert: null,
    _alertTimer: null,
    oauth: { show: false, title: '', output: '', showOpen: false, showDone: false, openUrl: '', ws: null },

    init() {
      this.$watch('step', (val) => {
        if (val === 2) this.loadTelegramConfig();
      });
    },

    get canStep1() {
      if (this.provider === 'minimax') return !!this.minimaxToken;
      if (this.provider === 'custom') return !!this.customBaseUrl.trim() && !!this.customApiKey.trim() && !!this.customModelId.trim();
      return !!this.provider;
    },
    get canStep2() {
      return !!this.tgToken.trim() && !!this.tgUserId.trim();
    },
    get step1Class() {
      return this.step > 1 || this.step === 'success' ? 'text-emerald-300' : (this.step === 1 ? 'text-indigo-300' : 'text-slate-300');
    },
    get step1NumClass() {
      return this.step > 1 || this.step === 'success' ? 'bg-emerald-500 text-white' : (this.step === 1 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-100');
    },
    get step2Class() {
      return this.step === 'success' ? 'text-emerald-300' : (this.step === 2 ? 'text-indigo-300' : 'text-slate-300');
    },
    get step2NumClass() {
      return this.step === 'success' ? 'bg-emerald-500 text-white' : (this.step === 2 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-100');
    },

    showAlert(type, message) {
      if (this._alertTimer) clearTimeout(this._alertTimer);
      this.alert = { type, message };
      this._alertTimer = setTimeout(() => { this.alert = null; }, 5000);
    },

    closeOAuth() {
      this.oauth.show = false;
      if (this.oauth.ws) { this.oauth.ws.close(); this.oauth.ws = null; }
    },

    async submitStep1() {
      if (!this.canStep1) return;
      this.loading = true;
      try {
        const payload = { provider: this.provider, token: this.minimaxToken || undefined };
        if (this.provider === 'custom') {
          payload.custom = {
            baseUrl: this.customBaseUrl.trim(),
            apiKey: this.customApiKey.trim(),
            modelId: this.customModelId.trim(),
            inputTypes: this.customInputTypes.length > 0 ? this.customInputTypes : ['text'],
            setDefault: this.customSetDefault
          };
        }
        const res = await fetch('/api/config/model', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        this.loading = false;
        if (result.success && result.data.requiresOAuth) {
          if (result.data.oauthMode === 'auto') this.startGptOAuth();
          else if (result.data.oauthMode === 'device') this.startQwenDevice();
          else if (result.data.manualOAuth) this.showManualOAuth(result.data.command);
          else this.startWsOAuth(this.provider);
        } else if (result.success) {
          this.showAlert('success', '模型配置成功!');
          setTimeout(() => this.step = 2, 1000);
        } else {
          this.showAlert('error', result.error || '配置失败');
        }
      } catch (err) {
        this.loading = false;
        this.showAlert('error', '网络错误: ' + err.message);
      }
    },

    async startGptOAuth() {
      this.oauth = { show: true, title: 'GPT OAuth 登录', output: '正在启动 GPT OAuth 授权...', showOpen: true, showDone: false, openUrl: '', ws: null };
      try {
        const res = await fetch('/api/config/gpt-oauth/start', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const result = await res.json();
        if (!result.success) { this.oauth.output = '<div class="text-red-400">✗ ' + (result.error || '启动失败') + '</div>'; return; }
        const { sessionId, authUrl } = result.data;
        this.oauth.openUrl = authUrl;
        this.oauth.output = '<div style="color:#fbbf24;font-weight:bold;margin-bottom:12px">⏳ 等待授权中...</div>\\n请在浏览器中打开以下链接完成授权：\\n\\n' + authUrl + '\\n\\n<div style="color:#10b981;font-weight:bold;margin-top:12px">✓ 授权完成后将自动跳转到下一步</div>';
        window.open(authUrl, '_blank');
        this.pollOAuth('/api/config/gpt-oauth/poll', sessionId, 2000);
      } catch (err) { this.oauth.output = '<div class="text-red-400">✗ 网络错误: ' + err.message + '</div>'; }
    },

    async startQwenDevice() {
      this.oauth = { show: true, title: '千问 OAuth 登录', output: '正在请求授权链接...', showOpen: true, showDone: false, openUrl: '', ws: null };
      try {
        const res = await fetch('/api/config/qwen-oauth/start', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const result = await res.json();
        if (!result.success) { this.oauth.output = '<div class="text-red-400">✗ ' + (result.error || '启动失败') + '</div>'; return; }
        const { sessionId, verificationUrl, userCode, interval } = result.data;
        this.oauth.openUrl = verificationUrl;
        this.oauth.output = '<div style="color:#fbbf24;font-weight:bold;margin-bottom:12px">⏳ 等待授权中...</div>\\n\\n请在浏览器打开以下链接完成授权：\\n\\n' + verificationUrl + '\\n\\n<div style="color:#8b5cf6;font-weight:bold;margin:12px 0">验证码：' + userCode + '</div>\\n\\n<div style="color:#10b981;font-weight:bold;margin-top:12px">✓ 授权完成后将自动跳转到下一步</div>';
        window.open(verificationUrl, '_blank');
        this.pollOAuth('/api/config/qwen-oauth/poll', sessionId, Math.max(2000, (interval || 2) * 1000));
      } catch (err) { this.oauth.output = '<div class="text-red-400">✗ 网络错误: ' + err.message + '</div>'; }
    },

    async pollOAuth(url, sessionId, ms) {
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
        const r = await res.json();
        if (r.success && r.data?.status === 'pending') { setTimeout(() => this.pollOAuth(url, sessionId, ms), ms); return; }
        if (r.success && r.data?.status === 'success') {
          this.oauth.output += '\\n<div class="text-emerald-400">✓ 登录成功</div>';
          setTimeout(() => { this.closeOAuth(); this.showAlert('success', '模型配置成功!'); setTimeout(() => this.step = 2, 1000); }, 1000);
          return;
        }
        this.oauth.output += '\\n<div class="text-red-400">✗ ' + (r.error || '登录失败') + '</div>';
      } catch { this.oauth.output += '\\n<div class="text-red-400">✗ 轮询失败</div>'; }
    },

    showManualOAuth(command) {
      this.oauth = { show: true, title: 'OAuth 登录', output: '当前环境无法创建交互式终端。\\n请在你的本地终端执行以下命令完成登录：\\n\\n' + (command || '') + '\\n\\n完成后点击"已完成登录"。', showOpen: false, showDone: true, openUrl: '', ws: null };
    },
    manualOAuthDone() {
      this.closeOAuth();
      this.showAlert('success', '模型配置完成，请继续下一步');
      setTimeout(() => this.step = 2, 500);
    },

    startWsOAuth(provider) {
      const label = provider === 'gpt' ? 'GPT' : '千问';
      this.oauth = { show: true, title: label + ' OAuth 登录', output: '正在启动 ' + label + ' OAuth 登录...\\n\\n', showOpen: false, showDone: false, openUrl: '', ws: null };
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(protocol + '//' + window.location.host + '/ws/oauth-login');
      this.oauth.ws = ws;
      ws.onopen = () => ws.send(JSON.stringify({ provider }));
      ws.onmessage = (e) => {
        const d = JSON.parse(e.data);
        if (d.type === 'output') this.oauth.output += d.data;
        else if (d.type === 'success') {
          this.oauth.output += '\\n<div class="text-emerald-400">✓ ' + d.message + '</div>';
          setTimeout(() => { this.closeOAuth(); this.showAlert('success', '模型配置成功!'); setTimeout(() => this.step = 2, 1000); }, 2000);
        } else if (d.type === 'error') {
          this.oauth.output += '\\n<div class="text-red-400">✗ ' + d.message + '</div>';
          setTimeout(() => { this.closeOAuth(); this.showAlert('error', '登录失败: ' + d.message); }, 2000);
        }
      };
      ws.onerror = () => {
        this.oauth.output += '\\n<div class="text-red-400">✗ 连接错误</div>';
        setTimeout(() => { this.closeOAuth(); this.showAlert('error', 'WebSocket 连接失败'); }, 2000);
      };
    },

    async loadTelegramConfig() {
      if (this.tgLoaded) return;
      this.tgLoaded = true;
      try {
        const res = await fetch('/api/config/telegram');
        const r = await res.json();
        if (r.success && r.data.configured) {
          this.tgToken = r.data.botToken || '';
          this.tgUserId = r.data.userId || '';
        }
      } catch {}
    },

    async submitStep2() {
      if (!this.tgToken.trim() || !this.tgUserId.trim()) return;
      this.loading = true;
      try {
        const res = await fetch('/api/config/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: this.tgToken.trim(), userId: this.tgUserId.trim() }) });
        const r = await res.json();
        if (r.success) { this.showAlert('success', 'Telegram 配置成功!'); setTimeout(() => this.step = 'success', 1000); }
        else this.showAlert('error', r.error || '配置失败');
      } catch (err) { this.showAlert('error', '网络错误: ' + err.message); }
      finally { this.loading = false; }
    },

    async skipTelegram() {
      this.loading = true;
      try {
        const res = await fetch('/api/config/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skip: true }) });
        const r = await res.json();
        if (r.success) { this.showAlert('success', '已跳过 Telegram 配置'); setTimeout(() => this.step = 'success', 1000); }
        else this.showAlert('error', r.error || '操作失败');
      } catch (err) { this.showAlert('error', '网络错误: ' + err.message); }
      finally { this.loading = false; }
    },

    async openDashboard() {
      try {
        const res = await fetch('/api/config/status');
        const r = await res.json();
        if (r.success && r.data.gatewayRunning) {
          let url = 'http://127.0.0.1:18789';
          if (r.data.gatewayToken) url += '?token=' + encodeURIComponent(r.data.gatewayToken);
          window.open(url, '_blank');
        } else {
          this.showAlert('error', 'Gateway 未运行,请先启动 Gateway');
        }
      } catch { window.open('http://127.0.0.1:18789', '_blank'); }
    }
  }))
})
`;
var __freeze = Object.freeze;
var __defProp2 = Object.defineProperty;
var __template = (cooked, raw2) => __freeze(__defProp2(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const index = createRoute(async (c) => {
  const status = await getOpenClawStatus();
  if (status.defaultModel && status.telegramConfigured) {
    return c.redirect("/config");
  }
  const tgGuide = TelegramGuide({ withTokenInput: true, alpineTokenModel: "tgToken" });
  return c.render(
    html(_a || (_a = __template([`
    <div x-data="wizard">

      <!-- OAuth 弹窗 -->
      <div x-show="oauth.show" x-cloak class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70">
        <div class="w-full max-w-2xl rounded-2xl bg-slate-900 text-slate-100 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-700 px-5 py-3">
            <div class="text-sm" x-text="oauth.title"></div>
            <button class="text-xl text-slate-400 hover:text-white" @click="closeOAuth()">×</button>
          </div>
          <div class="max-h-[520px] overflow-y-auto px-5 py-4 font-mono text-sm">
            <div class="whitespace-pre-wrap" x-html="oauth.output"></div>
            <div class="mt-4 flex justify-end gap-2">
              <button x-show="oauth.showOpen" @click="window.open(oauth.openUrl,'_blank')" class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">打开授权页面</button>
              <button x-show="oauth.showDone" @click="manualOAuthDone()" class="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-400">已完成登录</button>
            </div>
          </div>
        </div>
      </div>

      <div class="h-screen w-full flex items-center justify-center p-6 overflow-hidden">
        <div class="w-full max-w-5xl rounded-3xl bg-white/95 p-10 shadow-2xl overflow-y-auto max-h-[calc(100vh-3rem)]">

          <!-- 标题 -->
          <div class="text-center">
            <h1 class="text-3xl font-semibold text-indigo-500">OpenClaw 配置助手</h1>
            <p class="mt-2 text-sm text-slate-500">按照步骤完成模型和 Telegram 配置</p>
          </div>

          <!-- 步骤指示器 -->
          <div class="mt-10 flex items-center justify-center gap-6 text-sm">
            <div class="flex items-center gap-3" :class="step1Class">
              <div class="flex h-10 w-10 items-center justify-center rounded-full" :class="step1NumClass">1</div>
              <span>选择模型</span>
            </div>
            <div class="h-[2px] w-12 bg-slate-200"></div>
            <div class="flex items-center gap-3" :class="step2Class">
              <div class="flex h-10 w-10 items-center justify-center rounded-full" :class="step2NumClass">2</div>
              <span>配置 Telegram</span>
            </div>
          </div>

          <!-- 提示 -->
          <div x-show="alert && alert.type === 'error'" x-cloak x-text="alert?.message" class="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"></div>
          <div x-show="alert && alert.type === 'success'" x-cloak x-text="alert?.message" class="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"></div>

          <!-- Loading -->
          <div x-show="loading" x-cloak class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40">
            <div class="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
              <div class="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></div>
              <p class="text-sm text-slate-600">正在配置中,请稍候...</p>
            </div>
          </div>

          <!-- 步骤 1: 选择模型 -->
          <div x-show="step === 1" class="mt-10">
            <h2 class="mb-6 text-xl font-semibold text-slate-700">步骤 1: 选择模型</h2>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-600">选择模型提供商</label>
              <select x-model="provider" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none">
                <option value="">-- 请选择 --</option>
                <option value="minimax">MiniMax (需要 API Key)</option>
                <option value="gpt">GPT (通过 OAuth 登录)</option>
                <option value="qwen">千问 (通过 OAuth 登录)</option>
                <option value="custom">第三方模型 (OpenAI 兼容 API)</option>
              </select>
            </div>
            <div x-show="provider === 'minimax'" x-cloak class="mt-6">
              <label class="mb-2 block text-sm font-medium text-slate-600">MiniMax API Key</label>
              <input type="text" x-model="minimaxToken" placeholder="请输入 MiniMax API Key" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
            </div>
            <!-- 第三方模型表单 -->
            <div x-show="provider === 'custom'" x-cloak class="mt-6 space-y-4">
              <div class="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p class="text-sm text-blue-700">支持任何兼容 OpenAI Chat Completions API 的第三方服务，例如 Gemini、Moonshot、DeepSeek 等。</p>
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-600">API Base URL <span class="text-red-400">*</span></label>
                <input type="text" x-model="customBaseUrl" placeholder="例如：https://gptproto.com/v1" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-600">API Key <span class="text-red-400">*</span></label>
                <input type="password" x-model="customApiKey" placeholder="请输入 API Key" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-600">模型 ID <span class="text-red-400">*</span></label>
                <input type="text" x-model="customModelId" placeholder="例如：gemini-3-pro-preview、deepseek-chat" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-600">支持的输入类型</label>
                <div class="flex flex-wrap gap-4 mt-2">
                  <label class="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" value="text" x-model="customInputTypes" class="rounded" /> 文本</label>
                  <label class="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" value="image" x-model="customInputTypes" class="rounded" /> 图片</label>
                  <label class="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" value="audio" x-model="customInputTypes" class="rounded" /> 音频</label>
                </div>
              </div>
              <div>
                <label class="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" x-model="customSetDefault" class="rounded" />
                  设为默认模型
                </label>
              </div>
            </div>
            <div class="mt-8 flex justify-end">
              <button @click="submitStep1()" :disabled="!canStep1" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400">下一步</button>
            </div>
          </div>

          <!-- 步骤 2: 配置 Telegram -->
          <div x-show="step === 2" x-cloak class="mt-10">
            <h2 class="mb-6 text-xl font-semibold text-slate-700">步骤 2: 配置 Telegram 机器人</h2>
            `, `
            <div class="mt-6">
              <label class="mb-2 block text-sm font-medium text-slate-600">Telegram 用户 ID</label>
              <input type="text" x-model="tgUserId" placeholder="请输入用户 ID" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
            </div>
            <div class="mt-8 flex justify-between gap-3">
              <button @click="step = 1" class="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100">上一步</button>
              <div class="flex gap-3">
                <button @click="skipTelegram()" class="rounded-lg bg-slate-100 px-5 py-2 text-sm text-slate-600 hover:bg-slate-200">跳过</button>
                <button @click="submitStep2()" :disabled="!tgToken.trim() || !tgUserId.trim()" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400">完成配置</button>
              </div>
            </div>
          </div>

          <!-- 配置完成 -->
          <div x-show="step === 'success'" x-cloak class="mt-10">
            <div class="text-center">
              <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white">✓</div>
              <h2 class="mt-4 text-2xl font-semibold text-slate-700">配置完成!</h2>
              <p class="mt-2 text-sm text-slate-500">OpenClaw 已成功配置并启动。</p>
              <p class="mt-3 text-sm font-semibold text-slate-600">现在可以打开 OpenClaw 页面，并在 Telegram 里向机器人发送消息测试。</p>
              <div class="mx-auto mt-6 max-w-md text-left text-sm text-slate-500">
                <p class="mb-2">✓ 打开 OpenClaw Dashboard 开始使用</p>
                <p class="mb-2">✓ 在 Telegram 中向您的机器人发送消息测试</p>
                <p>✓ 查看日志: <code class="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">tail -f ~/.openclaw/logs/gateway.log</code></p>
              </div>
              <div class="mt-6 flex flex-wrap justify-center gap-3">
                <button @click="openDashboard()" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400">开始体验 OpenClaw</button>
                <a class="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100" href="/config">更多配置指引</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <script>`, "<\/script>\n    "])), tgGuide, raw(wizardAlpine)),
    { title: "OpenClaw 配置助手" }
  );
});
const __vite_glob_4_1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index
}, Symbol.toStringTag, { value: "Module" }));
const IMPORTING_ISLANDS_ID = "__importing_islands";
const contextStorage = new AsyncLocalStorage();
const filePathToPath = (filePath) => {
  filePath = filePath.replace(/\.tsx?$/g, "").replace(/\.mdx?$/g, "").replace(/^\/?index$/, "/").replace(/\/index$/, "").replace(/\[\.{3}.+\]/, "*").replace(/\((.+?)\)/g, "").replace(/\[(.+?)\]/g, ":$1").replace(/\/\/+/g, "/");
  return filePath.startsWith("/") ? filePath : "/" + filePath;
};
const groupByDirectory = (files) => {
  const organizedFiles = {};
  for (const [path2, content] of Object.entries(files)) {
    const pathParts = path2.split("/");
    const fileName = pathParts.pop();
    const directory = pathParts.join("/");
    if (!organizedFiles[directory]) {
      organizedFiles[directory] = {};
    }
    if (fileName) {
      organizedFiles[directory][fileName] = content;
    }
  }
  for (const [directory, files2] of Object.entries(organizedFiles)) {
    const sortedEntries = Object.entries(files2).sort(([keyA], [keyB]) => {
      if (keyA[0] === "[" && keyB[0] !== "[") {
        return 1;
      }
      if (keyA[0] !== "[" && keyB[0] === "[") {
        return -1;
      }
      return keyA.localeCompare(keyB);
    });
    organizedFiles[directory] = Object.fromEntries(sortedEntries);
  }
  return organizedFiles;
};
const sortDirectoriesByDepth = (directories) => {
  const sortedKeys = Object.keys(directories).sort((a, b) => {
    const depthA = a.split("/").length;
    const depthB = b.split("/").length;
    return depthA - depthB || b.localeCompare(a);
  });
  return sortedKeys.map((key) => ({
    [key]: directories[key]
  }));
};
const listByDirectory = (files) => {
  const organizedFiles = {};
  for (const path2 of Object.keys(files)) {
    const pathParts = path2.split("/");
    pathParts.pop();
    const directory = pathParts.join("/");
    if (!organizedFiles[directory]) {
      organizedFiles[directory] = [];
    }
    if (!organizedFiles[directory].includes(path2)) {
      organizedFiles[directory].push(path2);
    }
  }
  const directories = Object.keys(organizedFiles).sort((a, b) => b.length - a.length);
  for (const dir of directories) {
    for (const subDir of directories) {
      if (subDir.startsWith(dir) && subDir !== dir) {
        const uniqueFiles = /* @__PURE__ */ new Set([...organizedFiles[subDir], ...organizedFiles[dir]]);
        organizedFiles[subDir] = [...uniqueFiles];
      }
    }
  }
  return organizedFiles;
};
const NOTFOUND_FILENAME = "_404.tsx";
const ERROR_FILENAME = "_error.tsx";
const METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"];
const createApp$1 = (options) => {
  var _a3;
  const root = options.root;
  const rootRegExp = new RegExp(`^${root}`);
  const getRootPath = (dir) => filePathToPath(dir.replace(rootRegExp, ""));
  const app2 = options.app ?? new Hono();
  const trailingSlash = options.trailingSlash ?? false;
  const appliedMiddlewaresByDirectory = /* @__PURE__ */ new Map();
  const processedNotFoundResponses = /* @__PURE__ */ new WeakSet();
  const processedRendererRequests = /* @__PURE__ */ new WeakMap();
  const processedMiddlewareRequests = /* @__PURE__ */ new WeakMap();
  app2.use(async function ShareContext(c, next) {
    await contextStorage.run(c, () => next());
  });
  if (options.init) {
    options.init(app2);
  }
  const NOT_FOUND_FILE = options.NOT_FOUND;
  const notFoundMap = groupByDirectory(NOT_FOUND_FILE);
  const ERROR_FILE = options.ERROR;
  const errorMap = groupByDirectory(ERROR_FILE);
  const RENDERER_FILE = options.RENDERER;
  const rendererList = listByDirectory(RENDERER_FILE);
  const MIDDLEWARE_FILE = options.MIDDLEWARE;
  const ROUTES_FILE = options.ROUTES;
  const routesMap = sortDirectoriesByDepth(groupByDirectory(ROUTES_FILE));
  const getPaths = (currentDirectory, fileList) => {
    let paths = fileList[currentDirectory] ?? [];
    const getChildPaths = (childDirectories) => {
      paths = fileList[childDirectories.join("/")];
      if (!paths) {
        childDirectories.pop();
        if (childDirectories.length) {
          getChildPaths(childDirectories);
        }
      }
      return paths ?? [];
    };
    const renderDirPaths = currentDirectory.split("/");
    paths = getChildPaths(renderDirPaths);
    paths.sort((a, b) => a.split("/").length - b.split("/").length);
    return paths;
  };
  const errorHandlerMap = {};
  for (const map of routesMap) {
    for (const [dir, content] of Object.entries(map)) {
      const subApp = new Hono();
      let hasIslandComponent = false;
      const notFoundHandler2 = getNotFoundHandler(dir, notFoundMap);
      if (notFoundHandler2) {
        subApp.use(async (c, next) => {
          await next();
          if (c.res.status === 404 && !processedNotFoundResponses.has(c.res)) {
            const notFoundResponse = await notFoundHandler2(c);
            const res = new Response(notFoundResponse.body, {
              status: 404,
              headers: notFoundResponse.headers
            });
            c.res = res;
            processedNotFoundResponses.add(c.res);
          }
        });
      }
      const escapeDir = (directory) => directory.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("(", "\\(").replaceAll(")", "\\)");
      const findMiddleware2 = (directory) => Object.keys(MIDDLEWARE_FILE).find(
        (x) => new RegExp(escapeDir(directory) + "/_middleware.tsx?").test(x)
      );
      const isMiddlewareAppliedToAncestor = (middlewarePath, currentDir) => {
        const dirParts = currentDir.split("/");
        const ancestorDirs = [];
        for (let i = dirParts.length - 1; i > 0; i--) {
          ancestorDirs.push(dirParts.slice(0, i).join("/"));
        }
        return ancestorDirs.some(
          (ancestorDir) => {
            var _a4;
            return (_a4 = appliedMiddlewaresByDirectory.get(ancestorDir)) == null ? void 0 : _a4.has(middlewarePath);
          }
        );
      };
      const applyExtraHandlersForRouting = (handlers) => {
        const rootPath2 = dir.replace(rootRegExp, "");
        const isRootLevel = !rootPath2.includes("/");
        const isSimpleStructure = !Object.keys(content).some((f) => f.includes("/"));
        if (Object.keys(content).length > 0 && isRootLevel && isSimpleStructure) {
          subApp.use("/", ...handlers);
          Object.keys(content).forEach((filename) => {
            const path2 = filePathToPath(filename);
            if (path2 !== "/" && !path2.includes("[") && !path2.includes("*")) {
              subApp.use(path2, ...handlers);
            }
          });
        }
      };
      const rendererPaths = getPaths(dir, rendererList);
      rendererPaths.map((path2) => {
        const renderer = RENDERER_FILE[path2];
        const importingIslands = renderer[IMPORTING_ISLANDS_ID];
        if (importingIslands) {
          hasIslandComponent = true;
        }
        const rendererDefault = renderer.default;
        if (rendererDefault) {
          if (!processedRendererRequests.has(rendererDefault)) {
            processedRendererRequests.set(rendererDefault, /* @__PURE__ */ new WeakSet());
          }
          const processedRequests = processedRendererRequests.get(rendererDefault);
          const wrappedRenderer = createMiddleware(async (c, next) => {
            if (!processedRequests.has(c.req.raw)) {
              processedRequests.add(c.req.raw);
              return rendererDefault(c, next);
            }
            return next();
          });
          subApp.use("*", wrappedRenderer);
          applyExtraHandlersForRouting([wrappedRenderer]);
        }
      });
      let middlewareFile = findMiddleware2(dir);
      if (!middlewareFile) {
        const dirParts = dir.split("/");
        for (let i = dirParts.length - 1; i >= 0; i--) {
          const parentDir = dirParts.slice(0, i).join("/");
          if (!parentDir.includes(root)) {
            break;
          }
          const parentMiddleware = findMiddleware2(parentDir);
          if (!parentMiddleware) continue;
          if (isMiddlewareAppliedToAncestor(parentMiddleware, dir)) continue;
          middlewareFile = parentMiddleware;
          break;
        }
      }
      if (middlewareFile) {
        const middleware = MIDDLEWARE_FILE[middlewareFile];
        const middlewareDir = middlewareFile.replace("/_middleware.tsx", "").replace("/_middleware.ts", "");
        const shouldApply = middlewareDir === dir || dir.startsWith(middlewareDir + "/");
        if (middleware.default && shouldApply) {
          const wrappedMiddleware = middleware.default.map((mw) => {
            if (!processedMiddlewareRequests.has(mw)) {
              processedMiddlewareRequests.set(mw, /* @__PURE__ */ new WeakSet());
            }
            const processedRequests = processedMiddlewareRequests.get(mw);
            return createMiddleware(async (c, next) => {
              if (!processedRequests.has(c.req.raw)) {
                processedRequests.add(c.req.raw);
                return mw(c, next);
              }
              return next();
            });
          });
          subApp.use("*", ...wrappedMiddleware);
          applyExtraHandlersForRouting(wrappedMiddleware);
          if (!appliedMiddlewaresByDirectory.has(dir)) {
            appliedMiddlewaresByDirectory.set(dir, /* @__PURE__ */ new Set());
          }
          (_a3 = appliedMiddlewaresByDirectory.get(dir)) == null ? void 0 : _a3.add(middlewareFile);
        }
      }
      for (const [filename, route] of Object.entries(content)) {
        const importingIslands = route[IMPORTING_ISLANDS_ID];
        const setInnerMeta = createMiddleware(async function innerMeta(c, next) {
          c.set(IMPORTING_ISLANDS_ID, importingIslands ? true : hasIslandComponent);
          await next();
        });
        const routeDefault = route.default;
        const path2 = filePathToPath(filename);
        if (routeDefault && "fetch" in routeDefault) {
          subApp.use(setInnerMeta);
          subApp.route(path2, routeDefault);
        }
        for (const m of METHODS) {
          const handlers = route[m];
          if (handlers) {
            subApp.on(m, path2, setInnerMeta);
            subApp.on(m, path2, ...handlers);
          }
        }
        if (routeDefault && Array.isArray(routeDefault)) {
          subApp.get(path2, setInnerMeta);
          subApp.get(path2, ...routeDefault);
        }
        if (typeof routeDefault === "function") {
          subApp.get(path2, setInnerMeta);
          subApp.get(path2, async (c) => {
            const result = await routeDefault(c);
            if (result instanceof Response) {
              return result;
            }
            return c.render(result, route);
          });
        }
      }
      const errorHandler2 = getErrorHandler(dir, errorMap);
      if (errorHandler2) {
        errorHandlerMap[dir] = errorHandler2;
      }
      for (const [path2, errorHandler22] of Object.entries(errorHandlerMap)) {
        const regExp = new RegExp(`^${path2}`);
        if (regExp.test(dir) && errorHandler22) {
          subApp.onError(errorHandler22);
        }
      }
      let rootPath = getRootPath(dir);
      if (trailingSlash) {
        rootPath = rootPath.endsWith("/") ? rootPath : rootPath + "/";
      }
      app2.route(rootPath, subApp);
    }
  }
  for (const map of routesMap.reverse()) {
    const dir = Object.entries(map)[0][0];
    const subApp = new Hono();
    applyNotFound(subApp, dir, notFoundMap, processedNotFoundResponses);
    const rootPath = getRootPath(dir);
    app2.route(rootPath, subApp);
  }
  return app2;
};
function getNotFoundHandler(dir, map) {
  for (const [mapDir, content] of Object.entries(map)) {
    if (dir === mapDir) {
      const notFound = content[NOTFOUND_FILENAME];
      if (notFound) {
        return notFound.default;
      }
    }
  }
}
function applyNotFound(app2, dir, map, processedNotFoundResponses) {
  for (const [mapDir, content] of Object.entries(map)) {
    if (dir === mapDir) {
      const notFound = content[NOTFOUND_FILENAME];
      if (notFound) {
        const notFoundHandler2 = notFound.default;
        const importingIslands = notFound[IMPORTING_ISLANDS_ID];
        if (importingIslands) {
          app2.use("*", (c, next) => {
            c.set(IMPORTING_ISLANDS_ID, true);
            return next();
          });
        }
        app2.get("*", async (c, next) => {
          await next();
          if (processedNotFoundResponses.has(c.res)) {
            c.status(404);
            processedNotFoundResponses.add(c.res);
            c.res = await notFoundHandler2(c);
          }
        });
      }
    }
  }
}
function getErrorHandler(dir, map) {
  for (const [mapDir, content] of Object.entries(map)) {
    if (dir === mapDir) {
      const errorFile = content[ERROR_FILENAME];
      if (errorFile) {
        const matchedErrorHandler = errorFile.default;
        if (matchedErrorHandler) {
          const errorHandler2 = async (error, c) => {
            const importingIslands = errorFile[IMPORTING_ISLANDS_ID];
            if (importingIslands) {
              c.set(IMPORTING_ISLANDS_ID, importingIslands);
            }
            c.status(500);
            return matchedErrorHandler(error, c);
          };
          return errorHandler2;
        }
      }
    }
  }
}
const createApp = (options) => {
  const newOptions = {
    root: (options == null ? void 0 : options.root) ?? "/app/routes",
    app: options == null ? void 0 : options.app,
    init: options == null ? void 0 : options.init,
    trailingSlash: options == null ? void 0 : options.trailingSlash,
    // Avoid extglobs for rolldown-vite compatibility
    // ref: https://github.com/vitejs/rolldown-vite/issues/365
    NOT_FOUND: (options == null ? void 0 : options.NOT_FOUND) ?? /* @__PURE__ */ Object.assign({}),
    ERROR: (options == null ? void 0 : options.ERROR) ?? /* @__PURE__ */ Object.assign({}),
    RENDERER: (options == null ? void 0 : options.RENDERER) ?? /* @__PURE__ */ Object.assign({
      "/app/routes/_renderer.tsx": __vite_glob_2_0
    }),
    MIDDLEWARE: (options == null ? void 0 : options.MIDDLEWARE) ?? /* @__PURE__ */ Object.assign({}),
    ROUTES: (options == null ? void 0 : options.ROUTES) ?? /* @__PURE__ */ Object.assign({
      "/app/routes/config.tsx": __vite_glob_4_0,
      "/app/routes/index.tsx": __vite_glob_4_1
    })
  };
  return createApp$1(newOptions);
};
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    var _a3;
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if ((_a3 = opts.exposeHeaders) == null ? void 0 : _a3.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!(headers == null ? void 0 : headers.length)) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers == null ? void 0 : headers.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};
async function callGatewayMethod(method, params = {}, timeoutMs = 6e4) {
  try {
    const { stdout } = await execa("openclaw", [
      "gateway",
      "call",
      method,
      "--params",
      JSON.stringify(params),
      "--json",
      "--timeout",
      String(timeoutMs)
    ]);
    const result = extractJson(stdout);
    if (result === null) {
      throw new Error("Gateway 返回了无效的响应");
    }
    return result;
  } catch (error) {
    const stderr = error.stderr || "";
    const stdout = error.stdout || "";
    const combined = stderr + "\n" + stdout;
    const errorMatch = combined.match(/Error:\s*(.+)/i);
    if (errorMatch) {
      throw new Error(errorMatch[1].trim());
    }
    throw new Error(error.message || "Gateway 调用失败");
  }
}
const configRouter = new Hono();
const QWEN_OAUTH_BASE_URL = "https://chat.qwen.ai";
const QWEN_OAUTH_DEVICE_CODE_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/device/code`;
const QWEN_OAUTH_TOKEN_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/token`;
const QWEN_OAUTH_CLIENT_ID = "f0304373b74a44d2b584a3fb70ca9e56";
const QWEN_OAUTH_SCOPE = "openid profile email model.completion";
const QWEN_OAUTH_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";
const QWEN_DEFAULT_BASE_URL = "https://portal.qwen.ai/v1";
const QWEN_DEFAULT_MODEL = "qwen-portal/coder-model";
const OPENAI_CODEX_DEFAULT_MODEL = "openai-codex/gpt-5.2";
const qwenDeviceSessions = /* @__PURE__ */ new Map();
const gptOAuthSessions = /* @__PURE__ */ new Map();
let _loginOpenAICodex = null;
const PI_AI_REL = "node_modules/@mariozechner/pi-ai/dist/utils/oauth/openai-codex.js";
async function resolveOpenclawRoot() {
  const home = process.env.HOME || "";
  try {
    const { stdout: whichOut } = await execa("which", ["openclaw"]);
    const binPath = whichOut.trim();
    try {
      const content = fs.readFileSync(binPath, "utf-8");
      const execMatch = content.match(/exec\s+(.+?)\/bin\/openclaw/);
      if (execMatch) {
        const nodePrefix = execMatch[1].trim();
        const root = path.join(nodePrefix, "lib/node_modules/openclaw");
        if (fs.existsSync(root)) return root;
      }
    } catch {
    }
    try {
      const realBin = fs.realpathSync(binPath);
      const root = path.resolve(path.dirname(realBin), "..", "lib/node_modules/openclaw");
      if (fs.existsSync(root)) return root;
    } catch {
    }
  } catch {
  }
  const nvmDir = path.join(home, ".nvm/versions/node");
  try {
    if (fs.existsSync(nvmDir)) {
      const versions2 = fs.readdirSync(nvmDir).sort().reverse();
      for (const v of versions2) {
        const root = path.join(nvmDir, v, "lib/node_modules/openclaw");
        if (fs.existsSync(root)) return root;
      }
    }
  } catch {
  }
  const fallbacks = [
    path.join(home, ".local/lib/node_modules/openclaw"),
    "/usr/local/lib/node_modules/openclaw",
    "/usr/lib/node_modules/openclaw"
  ];
  for (const root of fallbacks) {
    if (fs.existsSync(root)) return root;
  }
  return null;
}
async function getLoginOpenAICodex() {
  if (_loginOpenAICodex) return _loginOpenAICodex;
  const openclawRoot = await resolveOpenclawRoot();
  if (!openclawRoot) {
    throw new Error("无法找到 openclaw 安装目录，请确认 openclaw 已正确安装");
  }
  const modulePath = path.join(openclawRoot, PI_AI_REL);
  if (!fs.existsSync(modulePath)) {
    throw new Error(`找到 openclaw 目录 (${openclawRoot}) 但缺少 pi-ai 模块: ${modulePath}`);
  }
  try {
    const mod = await import(
      /* @vite-ignore */
      `file://${modulePath}`
    );
    _loginOpenAICodex = mod.loginOpenAICodex;
    console.log(`已加载 loginOpenAICodex from: ${modulePath}`);
    return _loginOpenAICodex;
  } catch (err) {
    throw new Error(`加载 loginOpenAICodex 失败: ${err.message}`);
  }
}
function writeOpenAICodexCredentials(creds) {
  var _a3, _b2;
  const home = process.env.HOME || process.cwd();
  const agentDir = ((_a3 = process.env.OPENCLAW_AGENT_DIR) == null ? void 0 : _a3.trim()) || path.join(home, ".openclaw", "agents", "main", "agent");
  const authProfilePath = path.join(agentDir, "auth-profiles.json");
  let store = { version: 1, profiles: {} };
  try {
    if (fs.existsSync(authProfilePath)) {
      store = JSON.parse(fs.readFileSync(authProfilePath, "utf-8"));
    }
  } catch {
  }
  const profileId = `openai-codex:${((_b2 = creds.email) == null ? void 0 : _b2.trim()) || "default"}`;
  store.profiles[profileId] = {
    type: "oauth",
    provider: "openai-codex",
    ...creds
  };
  const dir = path.dirname(authProfilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(authProfilePath, JSON.stringify(store, null, 2));
  console.log(`OpenAI Codex 凭据已写入 ${authProfilePath} (profile: ${profileId})`);
}
async function applyOpenAICodexConfig() {
  await mergeDefaultModels({
    [OPENAI_CODEX_DEFAULT_MODEL]: {}
  });
  await execa("openclaw", [
    "config",
    "set",
    "--json",
    "agents.defaults.model",
    JSON.stringify({ primary: OPENAI_CODEX_DEFAULT_MODEL })
  ]);
}
function toFormUrlEncoded(data) {
  return Object.entries(data).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}
function generatePkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
function normalizeBaseUrl(value) {
  const raw2 = (value == null ? void 0 : value.trim()) || QWEN_DEFAULT_BASE_URL;
  const withProtocol = raw2.startsWith("http") ? raw2 : `https://${raw2}`;
  return withProtocol.endsWith("/v1") ? withProtocol : `${withProtocol.replace(/\/+$/, "")}/v1`;
}
async function requestQwenDeviceCode(params) {
  const response = await fetch(QWEN_OAUTH_DEVICE_CODE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "x-request-id": randomUUID()
    },
    body: toFormUrlEncoded({
      client_id: QWEN_OAUTH_CLIENT_ID,
      scope: QWEN_OAUTH_SCOPE,
      code_challenge: params.challenge,
      code_challenge_method: "S256"
    })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Qwen device authorization failed: ${text || response.statusText}`);
  }
  const payload = await response.json();
  if (!payload.device_code || !payload.user_code || !payload.verification_uri) {
    throw new Error(
      payload.error ?? "Qwen device authorization returned an incomplete payload (missing user_code or verification_uri)."
    );
  }
  return payload;
}
async function pollQwenToken(params) {
  const response = await fetch(QWEN_OAUTH_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: toFormUrlEncoded({
      grant_type: QWEN_OAUTH_GRANT_TYPE,
      client_id: QWEN_OAUTH_CLIENT_ID,
      device_code: params.deviceCode,
      code_verifier: params.verifier
    })
  });
  if (!response.ok) {
    let payload;
    try {
      payload = await response.json();
    } catch {
      const text = await response.text();
      return { status: "error", message: text || response.statusText };
    }
    if ((payload == null ? void 0 : payload.error) === "authorization_pending") {
      return { status: "pending" };
    }
    if ((payload == null ? void 0 : payload.error) === "slow_down") {
      return { status: "pending", slowDown: true };
    }
    return {
      status: "error",
      message: (payload == null ? void 0 : payload.error_description) || (payload == null ? void 0 : payload.error) || response.statusText
    };
  }
  const tokenPayload = await response.json();
  if (!tokenPayload.access_token || !tokenPayload.refresh_token || !tokenPayload.expires_in) {
    return { status: "error", message: "Qwen OAuth returned incomplete token payload." };
  }
  return {
    status: "success",
    token: {
      access: tokenPayload.access_token,
      refresh: tokenPayload.refresh_token,
      expires: Date.now() + tokenPayload.expires_in * 1e3,
      resourceUrl: tokenPayload.resource_url
    }
  };
}
function resolveOAuthPath() {
  const home = process.env.HOME || process.cwd();
  const dir = process.env.OPENCLAW_OAUTH_DIR || path.join(home, ".openclaw", "credentials");
  return path.join(dir, "oauth.json");
}
function resolveRemoteSupportPath$1() {
  const home = process.env.HOME || process.cwd();
  return path.join(home, ".openclaw-helper", "remote-support.json");
}
async function mergeDefaultModels(newEntries) {
  let existing = {};
  try {
    const { stdout } = await execa("openclaw", ["config", "get", "--json", "agents.defaults.models"]);
    existing = extractJson(stdout) || {};
  } catch {
    existing = {};
  }
  const merged = { ...existing, ...newEntries };
  await execa("openclaw", [
    "config",
    "set",
    "--json",
    "agents.defaults.models",
    JSON.stringify(merged)
  ]);
}
function writeQwenOAuthToken(token) {
  const oauthPath = resolveOAuthPath();
  const dir = path.dirname(oauthPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(oauthPath, "utf-8"));
  } catch {
    data = {};
  }
  data["qwen-portal"] = {
    access: token.access,
    refresh: token.refresh,
    expires: token.expires,
    ...token.resourceUrl ? { resourceUrl: token.resourceUrl } : {}
  };
  fs.writeFileSync(oauthPath, JSON.stringify(data, null, 2));
}
async function applyQwenConfig(resourceUrl) {
  const baseUrl = normalizeBaseUrl(resourceUrl);
  await execa("openclaw", [
    "config",
    "set",
    "--json",
    "models.providers.qwen-portal",
    JSON.stringify({
      baseUrl,
      apiKey: "qwen-oauth",
      api: "openai-completions",
      models: [
        {
          id: "coder-model",
          name: "Qwen Coder",
          reasoning: false,
          input: ["text"],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 128e3,
          maxTokens: 8192
        },
        {
          id: "vision-model",
          name: "Qwen Vision",
          reasoning: false,
          input: ["text", "image"],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 128e3,
          maxTokens: 8192
        }
      ]
    })
  ]);
  await mergeDefaultModels({
    "qwen-portal/coder-model": { alias: "qwen" },
    "qwen-portal/vision-model": {}
  });
  await execa("openclaw", [
    "config",
    "set",
    "--json",
    "agents.defaults.model",
    JSON.stringify({ primary: QWEN_DEFAULT_MODEL })
  ]);
}
configRouter.post("/model", async (c) => {
  try {
    const { provider, token, custom } = await c.req.json();
    if (!provider) {
      return c.json({ success: false, error: "请选择模型提供商" }, 400);
    }
    let result;
    switch (provider) {
      case "minimax":
        if (!token) {
          return c.json({ success: false, error: "请提供 MiniMax API Key" }, 400);
        }
        process.env.MINIMAX_API_KEY = token;
        await execa("openclaw", [
          "config",
          "set",
          "--json",
          "models.providers.minimax",
          JSON.stringify({
            baseUrl: "https://api.minimax.io/anthropic",
            api: "anthropic-messages",
            apiKey: "${MINIMAX_API_KEY}",
            models: [
              {
                id: "MiniMax-M2.1",
                name: "MiniMax M2.1",
                reasoning: false,
                input: ["text"],
                cost: {
                  input: 15,
                  output: 60,
                  cacheRead: 2,
                  cacheWrite: 10
                },
                contextWindow: 2e5,
                maxTokens: 8192
              }
            ]
          })
        ]);
        await mergeDefaultModels({
          "minimax/MiniMax-M2.1": {}
        });
        await execa("openclaw", [
          "config",
          "set",
          "--json",
          "agents.defaults.model",
          JSON.stringify({ primary: "minimax/MiniMax-M2.1" })
        ]);
        const configFile = `${process.env.HOME}/.profile`;
        const configLine = `export MINIMAX_API_KEY="${token}"`;
        try {
          const { stdout } = await execa("grep", ["-q", "MINIMAX_API_KEY", configFile]);
        } catch {
          await execa("sh", [
            "-c",
            `echo '' >> ${configFile} && echo '# OpenClaw MiniMax API Key' >> ${configFile} && echo '${configLine}' >> ${configFile}`
          ]);
        }
        result = { provider: "minimax", model: "MiniMax-M2.1" };
        break;
      case "gpt":
        result = {
          provider: "gpt",
          requiresOAuth: true,
          oauthMode: "auto"
        };
        break;
      case "qwen":
        await execa("openclaw", ["plugins", "enable", "qwen-portal-auth"]);
        result = {
          provider: "qwen",
          requiresOAuth: true,
          oauthMode: "device"
        };
        break;
      case "custom": {
        if (!custom || !custom.baseUrl || !custom.apiKey || !custom.modelId) {
          return c.json({ success: false, error: "请填写 API Base URL、API Key 和模型 ID" }, 400);
        }
        const {
          baseUrl,
          apiKey,
          modelId,
          inputTypes = ["text"],
          setDefault = false
        } = custom;
        let providerName;
        try {
          const hostname = new URL(baseUrl).hostname;
          const parts = hostname.split(".");
          if (parts.length >= 2) {
            providerName = parts.length > 2 ? parts[parts.length - 2] : parts[0];
          } else {
            providerName = parts[0];
          }
          providerName = providerName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
        } catch {
          return c.json({ success: false, error: "API Base URL 格式不正确" }, 400);
        }
        if (!providerName) {
          return c.json({ success: false, error: "无法从 URL 中提取提供商名称，请检查 API Base URL" }, 400);
        }
        const modelKey = `${providerName}/${modelId}`;
        await execa("openclaw", [
          "config",
          "set",
          "--json",
          `models.providers.${providerName}`,
          JSON.stringify({
            baseUrl,
            apiKey,
            api: "openai-completions",
            models: [
              {
                id: modelId,
                name: modelId,
                reasoning: false,
                input: Array.isArray(inputTypes) && inputTypes.length > 0 ? inputTypes : ["text"],
                cost: {
                  input: 0,
                  output: 0,
                  cacheRead: 0,
                  cacheWrite: 0
                },
                contextWindow: 2e5,
                maxTokens: 8192
              }
            ]
          })
        ]);
        await mergeDefaultModels({
          [modelKey]: {}
        });
        if (setDefault) {
          await execa("openclaw", [
            "config",
            "set",
            "--json",
            "agents.defaults.model",
            JSON.stringify({ primary: modelKey })
          ]);
        }
        result = { provider: providerName, model: modelId };
        break;
      }
      default:
        return c.json({ success: false, error: "不支持的模型提供商" }, 400);
    }
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("配置模型失败:", error);
    return c.json(
      {
        success: false,
        error: "配置失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.post("/qwen-oauth/start", async (c) => {
  try {
    const { verifier, challenge } = generatePkce();
    const device = await requestQwenDeviceCode({ challenge });
    const sessionId = randomUUID();
    const expiresAt = Date.now() + device.expires_in * 1e3;
    const intervalMs = (device.interval ?? 2) * 1e3;
    qwenDeviceSessions.set(sessionId, {
      sessionId,
      deviceCode: device.device_code,
      verifier,
      expiresAt,
      intervalMs
    });
    return c.json({
      success: true,
      data: {
        sessionId,
        verificationUrl: device.verification_uri_complete || device.verification_uri,
        userCode: device.user_code,
        expiresIn: device.expires_in,
        interval: device.interval ?? 2
      }
    });
  } catch (error) {
    console.error("启动千问 OAuth 失败:", error);
    return c.json(
      {
        success: false,
        error: "启动千问 OAuth 失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.post("/gpt-oauth/start", async (c) => {
  try {
    const loginOpenAICodex = await getLoginOpenAICodex();
    const sessionId = randomUUID();
    const session = {
      sessionId,
      status: "pending",
      startedAt: Date.now()
    };
    gptOAuthSessions.set(sessionId, session);
    loginOpenAICodex({
      onAuth: (info) => {
        const currentSession = gptOAuthSessions.get(sessionId);
        if (currentSession) {
          currentSession.authUrl = info.url;
        }
      },
      onPrompt: async (prompt) => {
        console.log("OpenAI OAuth prompt:", prompt.message);
        return "";
      },
      onProgress: (msg) => {
        console.log("OpenAI OAuth progress:", msg);
      }
    }).then(async (creds) => {
      const currentSession = gptOAuthSessions.get(sessionId);
      if (currentSession) {
        try {
          writeOpenAICodexCredentials(creds);
          await applyOpenAICodexConfig();
          currentSession.status = "success";
          console.log("OpenAI Codex OAuth 认证成功");
        } catch (err) {
          currentSession.status = "error";
          currentSession.error = "保存凭据失败: " + (err.message || "未知错误");
          console.error("保存 OpenAI Codex 凭据失败:", err);
        }
      }
    }).catch((err) => {
      const currentSession = gptOAuthSessions.get(sessionId);
      if (currentSession) {
        currentSession.status = "error";
        currentSession.error = "ChatGPT OAuth 失败: " + (err.message || "未知错误");
      }
      console.error("OpenAI Codex OAuth 失败:", err);
    });
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    const authUrl = session.authUrl || "";
    if (!authUrl) {
      await new Promise((resolve) => setTimeout(resolve, 2e3));
    }
    return c.json({
      success: true,
      data: {
        sessionId,
        authUrl: session.authUrl || "https://chatgpt.com",
        message: "请在浏览器中完成 ChatGPT 授权"
      }
    });
  } catch (error) {
    console.error("启动 GPT OAuth 失败:", error);
    return c.json(
      {
        success: false,
        error: "启动 GPT OAuth 失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.post("/gpt-oauth/poll", async (c) => {
  try {
    const { sessionId } = await c.req.json();
    const session = gptOAuthSessions.get(sessionId);
    if (!session) {
      return c.json({ success: false, error: "无效的会话，请重新开始登录" }, 400);
    }
    if (Date.now() - session.startedAt > 5 * 60 * 1e3) {
      gptOAuthSessions.delete(sessionId);
      return c.json({ success: false, error: "登录已超时，请重新开始" }, 400);
    }
    if (session.status === "pending") {
      return c.json({ success: true, data: { status: "pending" } });
    }
    if (session.status === "error") {
      gptOAuthSessions.delete(sessionId);
      return c.json({ success: false, error: session.error || "认证失败" }, 500);
    }
    gptOAuthSessions.delete(sessionId);
    return c.json({ success: true, data: { status: "success" } });
  } catch (error) {
    console.error("轮询 GPT OAuth 失败:", error);
    return c.json(
      {
        success: false,
        error: "轮询失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.post("/qwen-oauth/poll", async (c) => {
  try {
    const { sessionId } = await c.req.json();
    const session = qwenDeviceSessions.get(sessionId);
    if (!session) {
      return c.json({ success: false, error: "无效的会话，请重新开始登录" }, 400);
    }
    if (Date.now() > session.expiresAt) {
      qwenDeviceSessions.delete(sessionId);
      return c.json({ success: false, error: "登录已过期，请重新开始" }, 400);
    }
    const result = await pollQwenToken({
      deviceCode: session.deviceCode,
      verifier: session.verifier
    });
    if (result.status === "pending") {
      return c.json({ success: true, data: { status: "pending" } });
    }
    if (result.status === "error") {
      return c.json({ success: false, error: result.message }, 500);
    }
    writeQwenOAuthToken(result.token);
    await applyQwenConfig(result.token.resourceUrl);
    qwenDeviceSessions.delete(sessionId);
    return c.json({ success: true, data: { status: "success" } });
  } catch (error) {
    console.error("轮询千问 OAuth 失败:", error);
    return c.json(
      {
        success: false,
        error: "轮询千问 OAuth 失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.get("/telegram", async (c) => {
  try {
    let botToken = "";
    let userId = "";
    try {
      const { stdout } = await execa("openclaw", ["config", "get", "channels.telegram.botToken"]);
      botToken = extractPlainValue(stdout).replace(/^"|"$/g, "");
    } catch {
    }
    try {
      const { stdout } = await execa("openclaw", ["config", "get", "--json", "channels.telegram.allowFrom"]);
      const parsed = extractJson(stdout);
      if (Array.isArray(parsed) && parsed.length > 0) {
        userId = String(parsed[0]);
      }
    } catch {
    }
    return c.json({
      success: true,
      data: {
        configured: !!(botToken && userId),
        botToken,
        userId
      }
    });
  } catch (error) {
    return c.json({ success: true, data: { configured: false, botToken: "", userId: "" } });
  }
});
configRouter.post("/telegram", async (c) => {
  try {
    const { token, userId, skip } = await c.req.json();
    if (skip) {
      return c.json({ success: true, skipped: true });
    }
    if (!token || !userId) {
      return c.json({ success: false, error: "请提供 Telegram Bot Token 和用户 ID" }, 400);
    }
    await execa("openclaw", ["config", "set", "--json", "channels.telegram.botToken", JSON.stringify(token)]);
    await execa("openclaw", [
      "config",
      "set",
      "--json",
      "channels.telegram.allowFrom",
      JSON.stringify([userId])
    ]);
    try {
      await execa("pkill", ["-f", "openclaw.*gateway"]);
      await new Promise((resolve) => setTimeout(resolve, 2e3));
    } catch {
    }
    const logFile = `${process.env.HOME}/.openclaw/logs/gateway.log`;
    execa("sh", [
      "-c",
      `nohup openclaw gateway run --bind loopback --port 18789 > ${logFile} 2>&1 &`
    ]);
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    return c.json({
      success: true,
      data: {
        token: token.substring(0, 10) + "...",
        userId
      }
    });
  } catch (error) {
    console.error("配置 Telegram 失败:", error);
    return c.json(
      {
        success: false,
        error: "配置失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.get("/status", async (c) => {
  try {
    const config2 = await getOpenClawStatus();
    return c.json({ success: true, data: config2 });
  } catch (error) {
    console.error("获取状态失败:", error);
    return c.json(
      {
        success: false,
        error: "获取状态失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.get("/models", async (c) => {
  try {
    const { stdout: providersRaw } = await execa("openclaw", ["config", "get", "--json", "models.providers"]);
    const providersJson = extractJson(providersRaw) || {};
    let defaultModel = null;
    try {
      const { stdout } = await execa("openclaw", ["config", "get", "agents.defaults.model.primary"]);
      defaultModel = extractPlainValue(stdout) || null;
    } catch {
      defaultModel = null;
    }
    const models = [];
    Object.entries(providersJson).forEach(([providerId, provider]) => {
      const list = Array.isArray(provider == null ? void 0 : provider.models) ? provider.models : [];
      list.forEach((model) => {
        const id = (model == null ? void 0 : model.id) || (model == null ? void 0 : model.name) || "unknown";
        const name = (model == null ? void 0 : model.name) || (model == null ? void 0 : model.id) || id;
        models.push({
          key: `${providerId}/${id}`,
          label: `${name} (${providerId})`
        });
      });
    });
    return c.json({ success: true, data: { models, defaultModel } });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "获取模型列表失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.post("/models/default", async (c) => {
  try {
    const { model } = await c.req.json();
    if (!model) {
      return c.json({ success: false, error: "缺少模型参数" }, 400);
    }
    await execa("openclaw", [
      "config",
      "set",
      "--json",
      "agents.defaults.model",
      JSON.stringify({ primary: model })
    ]);
    return c.json({ success: true });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "切换默认模型失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.get("/channels", async (c) => {
  try {
    const { stdout } = await execa("openclaw", ["config", "get", "--json", "channels"]);
    const channelsJson = extractJson(stdout) || {};
    const channels = Object.entries(channelsJson).map(([id, value]) => ({
      id,
      label: id.toUpperCase(),
      enabled: (value == null ? void 0 : value.enabled) !== false
    }));
    return c.json({ success: true, data: { channels } });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "获取渠道配置失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.post("/whatsapp/link/start", async (c) => {
  try {
    try {
      console.log("WhatsApp: 正在注销旧会话...");
      const logoutResult = await callGatewayMethod(
        "channels.logout",
        { channel: "whatsapp", accountId: "default" },
        15e3
      );
      console.log("WhatsApp: 注销结果:", JSON.stringify(logoutResult));
    } catch (logoutErr) {
      console.log("WhatsApp: 注销跳过 (可能无旧会话):", logoutErr.message);
    }
    console.log("WhatsApp: 正在生成 QR 码...");
    const result = await callGatewayMethod(
      "web.login.start",
      {
        accountId: "default",
        force: true,
        timeoutMs: 3e4,
        verbose: false
      },
      45e3
    );
    return c.json({
      success: true,
      data: {
        qrDataUrl: result.qrDataUrl,
        message: result.message || "请使用 WhatsApp 扫描二维码"
      }
    });
  } catch (error) {
    console.error("WhatsApp QR 链接启动失败:", error);
    return c.json(
      {
        success: false,
        error: "WhatsApp 链接启动失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.post("/whatsapp/link/poll", async (c) => {
  try {
    const result = await callGatewayMethod(
      "web.login.wait",
      {
        accountId: "default",
        timeoutMs: 8e3
      },
      15e3
    );
    return c.json({
      success: true,
      data: {
        connected: !!result.connected,
        message: result.message || ""
      }
    });
  } catch (error) {
    console.error("WhatsApp QR 链接轮询失败:", error);
    return c.json(
      {
        success: false,
        error: "WhatsApp 链接状态查询失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.get("/remote-support", async (c) => {
  try {
    const filePath = resolveRemoteSupportPath$1();
    if (!fs.existsSync(filePath)) {
      return c.json({ success: true, data: { sshKey: "", cpolarToken: "", region: "en" } });
    }
    const raw2 = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw2);
    return c.json({
      success: true,
      data: {
        sshKey: data.sshKey || "",
        cpolarToken: data.cpolarToken || "",
        region: data.region || "en"
      }
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "读取远程支持配置失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.post("/remote-support", async (c) => {
  try {
    const { sshKey, cpolarToken, region } = await c.req.json();
    const filePath = resolveRemoteSupportPath$1();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          sshKey: sshKey || "",
          cpolarToken: cpolarToken || "",
          region: region || "en"
        },
        null,
        2
      )
    );
    return c.json({ success: true });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "保存远程支持配置失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
configRouter.post("/remote-support/start", async (c) => {
  try {
    const { sshKey, cpolarToken, region } = await c.req.json();
    if (!sshKey || !cpolarToken) {
      return c.json({ success: false, error: "请填写 SSH Key 和 cpolar AuthToken" }, 400);
    }
    const mappedRegion = region === "en" ? "eu" : region;
    await execa("cpolar", ["authtoken", cpolarToken]);
    await execa("sh", [
      "-c",
      `nohup cpolar tcp -region=${mappedRegion} 22 > ${process.env.HOME}/.openclaw/logs/cpolar.log 2>&1 &`
    ]);
    return c.json({ success: true });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "启动远程支持失败: " + (error.message || "未知错误")
      },
      500
    );
  }
});
const partialsRouter = new Hono();
function asciiJson(obj) {
  return JSON.stringify(obj).replace(/[\u0080-\uffff]/g, (ch) => {
    return "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0");
  });
}
function parseInput(raw2) {
  if (Array.isArray(raw2)) return raw2;
  if (typeof raw2 === "string" && raw2) return raw2.split("+").map((s) => s.trim()).filter(Boolean);
  return ["text"];
}
async function fetchModels() {
  let models = [];
  try {
    const { stdout: modelsRaw } = await execa("openclaw", ["models", "list", "--json"]);
    const modelsJson = extractJson(modelsRaw);
    if (modelsJson && Array.isArray(modelsJson.models)) {
      models = modelsJson.models.map((m) => ({
        key: m.key || "unknown",
        label: `${m.name || m.key} (${(m.key || "").split("/")[0]})`,
        input: parseInput(m.input)
      }));
    }
  } catch {
    try {
      const { stdout: providersRaw } = await execa("openclaw", ["config", "get", "--json", "models.providers"]);
      const providersJson = extractJson(providersRaw) || {};
      Object.entries(providersJson).forEach(([providerId, provider]) => {
        const list = Array.isArray(provider == null ? void 0 : provider.models) ? provider.models : [];
        list.forEach((model) => {
          const id = (model == null ? void 0 : model.id) || (model == null ? void 0 : model.name) || "unknown";
          const name = (model == null ? void 0 : model.name) || (model == null ? void 0 : model.id) || id;
          models.push({
            key: `${providerId}/${id}`,
            label: `${name} (${providerId})`,
            input: parseInput(model == null ? void 0 : model.input)
          });
        });
      });
    } catch {
    }
  }
  let defaultModel = null;
  try {
    const { stdout } = await execa("openclaw", ["config", "get", "agents.defaults.model.primary"]);
    defaultModel = extractPlainValue(stdout) || null;
  } catch {
    defaultModel = null;
  }
  return { models, defaultModel };
}
const INPUT_LABELS = {
  text: "文本",
  image: "图片",
  audio: "音频",
  video: "视频"
};
function ModelCard(props) {
  return /* @__PURE__ */ jsxDEV("div", { class: `rounded-xl border ${props.isDefault ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"} p-4`, children: [
    /* @__PURE__ */ jsxDEV("strong", { class: "text-sm text-slate-700", children: props.model.label }),
    /* @__PURE__ */ jsxDEV("div", { class: "mt-1.5 text-xs text-slate-500", children: props.model.key }),
    /* @__PURE__ */ jsxDEV("div", { class: "mt-2 flex flex-wrap gap-1", children: props.model.input.map((t) => /* @__PURE__ */ jsxDEV("span", { class: "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600", children: INPUT_LABELS[t] || t })) }),
    /* @__PURE__ */ jsxDEV("div", { class: "mt-3 flex flex-wrap gap-2", children: /* @__PURE__ */ jsxDEV(
      "button",
      {
        class: "rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed",
        "hx-post": "/api/partials/models/default",
        "hx-vals": JSON.stringify({ model: props.model.key }),
        "hx-target": "#model-list",
        "hx-swap": "innerHTML",
        "hx-disabled-elt": "this",
        children: [
          /* @__PURE__ */ jsxDEV("span", { class: "hx-ready", children: props.isDefault ? "✓ 当前默认" : "设为默认" }),
          /* @__PURE__ */ jsxDEV("span", { class: "hx-loading items-center gap-1", children: [
            /* @__PURE__ */ jsxDEV("svg", { class: "animate-spin h-3 w-3", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
              /* @__PURE__ */ jsxDEV("circle", { class: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", "stroke-width": "4" }),
              /* @__PURE__ */ jsxDEV("path", { class: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
            ] }),
            "切换中…"
          ] })
        ]
      }
    ) })
  ] });
}
function ModelList(props) {
  var _a3;
  if (!props.models.length) {
    return /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-slate-500", children: "暂无已配置模型" });
  }
  const defaultLabel = props.defaultModel ? ((_a3 = props.models.find((m) => m.key === props.defaultModel)) == null ? void 0 : _a3.label) || props.defaultModel : null;
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { class: "col-span-full mb-1 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3", children: [
      /* @__PURE__ */ jsxDEV("span", { class: "text-sm text-slate-600", children: "当前默认模型：" }),
      defaultLabel ? /* @__PURE__ */ jsxDEV("strong", { class: "text-sm text-indigo-700", children: defaultLabel }) : /* @__PURE__ */ jsxDEV("span", { class: "text-sm text-slate-400", children: "未设置" })
    ] }),
    props.models.map((model) => /* @__PURE__ */ jsxDEV(ModelCard, { model, isDefault: model.key === props.defaultModel }))
  ] });
}
partialsRouter.get("/models", async (c) => {
  try {
    const { models, defaultModel } = await fetchModels();
    return c.html(/* @__PURE__ */ jsxDEV(ModelList, { models, defaultModel }));
  } catch {
    return c.html(/* @__PURE__ */ jsxDEV("p", { class: "text-sm text-red-500", children: "无法读取模型配置" }));
  }
});
partialsRouter.post("/models/default", async (c) => {
  const body = await c.req.parseBody();
  const model = body.model;
  if (!model) return c.html(/* @__PURE__ */ jsxDEV("p", { class: "text-sm text-red-500", children: "缺少模型参数" }), 400);
  try {
    await execa("openclaw", ["config", "set", "--json", "agents.defaults.model", JSON.stringify({ primary: model })]);
    const { models, defaultModel } = await fetchModels();
    c.header("HX-Trigger", asciiJson({ "show-alert": { type: "success", message: "已切换默认模型" } }));
    return c.html(/* @__PURE__ */ jsxDEV(ModelList, { models, defaultModel }));
  } catch (err) {
    c.header("HX-Trigger", asciiJson({ "show-alert": { type: "error", message: "切换失败: " + err.message } }));
    try {
      const { models, defaultModel } = await fetchModels();
      return c.html(/* @__PURE__ */ jsxDEV(ModelList, { models, defaultModel }));
    } catch {
      return c.html(/* @__PURE__ */ jsxDEV("p", { class: "text-sm text-red-500", children: "切换失败" }), 500);
    }
  }
});
const ALL_CHANNELS = [
  { id: "telegram", label: "Telegram", description: "通过 Telegram 机器人接收和发送消息" },
  { id: "whatsapp", label: "WhatsApp", description: "通过 WhatsApp Business 接收和发送消息" }
];
function isChannelEnabled(id, value) {
  if (id === "whatsapp") {
    const accounts = (value == null ? void 0 : value.accounts) || {};
    const ids = Object.keys(accounts);
    if (ids.length === 0) return false;
    return ids.some((aid) => {
      var _a3;
      return ((_a3 = accounts[aid]) == null ? void 0 : _a3.enabled) !== false;
    });
  }
  return (value == null ? void 0 : value.enabled) !== false;
}
function isWhatsAppLinked(accountId = "default") {
  try {
    const home = os.homedir();
    const credDir = path.join(home, ".openclaw", "credentials", "whatsapp", accountId);
    if (!fs.existsSync(credDir)) return false;
    const files = fs.readdirSync(credDir).filter((f) => !f.startsWith("."));
    return files.length > 0;
  } catch {
    return false;
  }
}
async function fetchChannels() {
  const { stdout } = await execa("openclaw", ["config", "get", "--json", "channels"]);
  const channelsJson = extractJson(stdout) || {};
  return Object.entries(channelsJson).map(([id, value]) => {
    const enabled = isChannelEnabled(id, value);
    const linked = id === "whatsapp" ? isWhatsAppLinked() : void 0;
    return { id, label: id.toUpperCase(), enabled, linked, config: value };
  });
}
async function fetchChannelConfig(channelId) {
  try {
    const { stdout } = await execa("openclaw", ["config", "get", "--json", `channels.${channelId}`]);
    return extractJson(stdout) || {};
  } catch {
    return {};
  }
}
function getChannelStatus(ch) {
  if (ch.id === "whatsapp") {
    if (!ch.linked) return { text: "未链接", badgeCls: "bg-amber-100 text-amber-700", cardCls: "border-amber-200 bg-amber-50/50" };
    if (ch.enabled) return { text: "已链接", badgeCls: "bg-emerald-100 text-emerald-700", cardCls: "border-emerald-200 bg-emerald-50" };
    return { text: "已关闭", badgeCls: "bg-slate-100 text-slate-500", cardCls: "border-slate-200 bg-white" };
  }
  if (ch.enabled) return { text: "已启用", badgeCls: "bg-emerald-100 text-emerald-700", cardCls: "border-emerald-200 bg-emerald-50" };
  return { text: "已关闭", badgeCls: "bg-slate-100 text-slate-500", cardCls: "border-slate-200 bg-white" };
}
function ChannelList(props) {
  if (!props.channels.length) {
    return /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-slate-500", children: "暂无已配置渠道" });
  }
  return /* @__PURE__ */ jsxDEV(Fragment, { children: props.channels.map((ch) => {
    const status = getChannelStatus(ch);
    const isWhatsAppUnlinked = ch.id === "whatsapp" && !ch.linked;
    return /* @__PURE__ */ jsxDEV("div", { class: `rounded-xl border p-4 ${status.cardCls}`, children: [
      /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDEV("strong", { class: "text-sm text-slate-700", children: ch.label }),
        /* @__PURE__ */ jsxDEV("span", { class: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.badgeCls}`, children: status.text })
      ] }),
      isWhatsAppUnlinked && /* @__PURE__ */ jsxDEV("p", { class: "mt-2 text-xs text-amber-600", children: "尚未扫描二维码完成链接，请点击下方「添加 WhatsApp」开始配置。" }),
      /* @__PURE__ */ jsxDEV("div", { class: "mt-3 flex flex-wrap gap-2", children: [
        !isWhatsAppUnlinked && /* @__PURE__ */ jsxDEV(
          "button",
          {
            class: "rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100",
            "hx-get": `/api/partials/channels/${ch.id}/edit`,
            "hx-target": "#channel-form-area",
            "hx-swap": "innerHTML show:#channel-form-area:top",
            children: "编辑"
          }
        ),
        isWhatsAppUnlinked ? /* @__PURE__ */ jsxDEV(
          "button",
          {
            class: "rounded-lg border border-emerald-200 px-3 py-1 text-xs text-emerald-600 hover:bg-emerald-50",
            "hx-get": "/api/partials/channels/add/whatsapp",
            "hx-target": "#channel-form-area",
            "hx-swap": "innerHTML show:#channel-form-area:top",
            children: "扫码链接"
          }
        ) : /* @__PURE__ */ jsxDEV(
          "button",
          {
            class: `rounded-lg border px-3 py-1 text-xs ${ch.enabled ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`,
            "hx-post": `/api/partials/channels/${ch.id}/toggle`,
            "hx-target": "#channel-list",
            "hx-swap": "innerHTML",
            "hx-disabled-elt": "this",
            children: [
              /* @__PURE__ */ jsxDEV("span", { class: "hx-ready", children: ch.enabled ? "关闭" : "启用" }),
              /* @__PURE__ */ jsxDEV("span", { class: "hx-loading items-center gap-1", children: [
                /* @__PURE__ */ jsxDEV("svg", { class: "animate-spin h-3 w-3 inline-block", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsxDEV("circle", { class: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", "stroke-width": "4" }),
                  /* @__PURE__ */ jsxDEV("path", { class: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
                ] }),
                "处理中…"
              ] })
            ]
          }
        )
      ] })
    ] });
  }) });
}
function AvailableChannelButtons(props) {
  if (!props.available.length) {
    return /* @__PURE__ */ jsxDEV("p", { class: "mt-4 text-sm text-slate-500", children: "所有支持的渠道均已配置" });
  }
  return /* @__PURE__ */ jsxDEV("div", { class: "mt-4 flex flex-wrap gap-3", children: props.available.map((ch) => /* @__PURE__ */ jsxDEV(
    "button",
    {
      class: "rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-400",
      "hx-get": `/api/partials/channels/add/${ch.id}`,
      "hx-target": "#channel-form-area",
      "hx-swap": "innerHTML show:#channel-form-area:top",
      children: [
        "添加 ",
        ch.label
      ]
    }
  )) });
}
partialsRouter.get("/channels", async (c) => {
  try {
    const channels = await fetchChannels();
    return c.html(/* @__PURE__ */ jsxDEV(ChannelList, { channels }));
  } catch {
    return c.html(/* @__PURE__ */ jsxDEV("p", { class: "text-sm text-red-500", children: "无法读取渠道配置" }));
  }
});
partialsRouter.get("/channels/available", async (c) => {
  try {
    const configured = await fetchChannels();
    const configuredIds = new Set(configured.map((ch) => ch.id));
    const available = ALL_CHANNELS.filter((ch) => !configuredIds.has(ch.id));
    return c.html(/* @__PURE__ */ jsxDEV(AvailableChannelButtons, { available }));
  } catch {
    return c.html(/* @__PURE__ */ jsxDEV("p", { class: "text-sm text-red-500", children: "无法获取可用渠道" }));
  }
});
partialsRouter.get("/channels/add/:type", async (c) => {
  const type = c.req.param("type");
  if (type === "telegram") {
    const tgGuide = TelegramGuide({ withTokenInput: true, inputName: "botToken" });
    return c.html(
      /* @__PURE__ */ jsxDEV("div", { class: "rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDEV("h4", { class: "text-lg font-semibold text-slate-800", children: "添加 Telegram 渠道" }),
          /* @__PURE__ */ jsxDEV("button", { onclick: "document.getElementById('channel-form-area').innerHTML=''", class: "rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100", children: "✕ 关闭" })
        ] }),
        /* @__PURE__ */ jsxDEV("form", { class: "mt-4", "hx-post": "/api/partials/channels/add/telegram", "hx-target": "#channel-list", "hx-swap": "innerHTML", children: [
          /* @__PURE__ */ jsxDEV("div", { children: tgGuide }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-6", children: [
            /* @__PURE__ */ jsxDEV("label", { class: "mb-2 block text-sm font-medium text-slate-600", children: "Telegram 用户 ID" }),
            /* @__PURE__ */ jsxDEV("input", { type: "text", name: "userId", placeholder: "请输入用户 ID", class: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-6 flex justify-end gap-3", children: [
            /* @__PURE__ */ jsxDEV("button", { type: "button", onclick: "document.getElementById('channel-form-area').innerHTML=''", class: "rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100", children: "取消" }),
            /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400", children: "添加渠道" })
          ] })
        ] })
      ] })
    );
  }
  if (type === "whatsapp") {
    return c.html(
      /* @__PURE__ */ jsxDEV("div", { class: "rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6", "x-data": "whatsappLinker", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDEV("h4", { class: "text-lg font-semibold text-slate-800", children: "添加 WhatsApp 渠道" }),
          /* @__PURE__ */ jsxDEV("button", { "x-on:click": "close()", class: "rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100", children: "✕ 关闭" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { "x-show": "state === 'idle'", class: "mt-4", children: [
          /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-slate-600", children: "通过扫描二维码将 WhatsApp 连接到 OpenClaw。" }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3", children: [
            /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-amber-700 font-medium", children: "准备工作" }),
            /* @__PURE__ */ jsxDEV("ul", { class: "mt-1.5 text-sm text-amber-600 list-disc list-inside space-y-1", children: [
              /* @__PURE__ */ jsxDEV("li", { children: "确保 OpenClaw Gateway 已启动运行" }),
              /* @__PURE__ */ jsxDEV("li", { children: "准备好你的手机，打开 WhatsApp" }),
              /* @__PURE__ */ jsxDEV("li", { children: "建议使用备用手机号 + eSIM 注册 WhatsApp" })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-6 flex justify-end gap-3", children: [
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "close()", class: "rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100", children: "取消" }),
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "startLinking()", class: "rounded-lg bg-emerald-500 px-5 py-2 text-sm text-white hover:bg-emerald-400", children: "开始连接 WhatsApp" })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { "x-show": "state === 'loading'", "x-cloak": true, class: "mt-6 flex flex-col items-center py-8", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" }),
          /* @__PURE__ */ jsxDEV("p", { class: "mt-4 text-sm text-slate-600 font-medium", "x-text": "loadingStep" }),
          /* @__PURE__ */ jsxDEV("p", { class: "mt-1 text-xs text-slate-400", children: "整个过程可能需要 10-30 秒" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { "x-show": "state === 'qr'", "x-cloak": true, class: "mt-4", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "flex flex-col items-center", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "rounded-2xl bg-white p-4 shadow-lg", children: /* @__PURE__ */ jsxDEV("img", { "x-bind:src": "qrDataUrl", alt: "WhatsApp QR Code", class: "h-64 w-64" }) }),
            /* @__PURE__ */ jsxDEV("div", { class: "mt-4 text-center", children: [
              /* @__PURE__ */ jsxDEV("p", { class: "text-sm font-medium text-slate-700", children: "请使用手机扫描上方二维码" }),
              /* @__PURE__ */ jsxDEV("p", { class: "mt-1 text-xs text-slate-500", children: "WhatsApp → 设置 → 已关联的设备 → 关联设备" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "mt-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "h-2 w-2 animate-pulse rounded-full bg-indigo-500" }),
              /* @__PURE__ */ jsxDEV("span", { class: "text-sm text-indigo-600", children: "等待扫码中..." })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-6 flex justify-center gap-3", children: [
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "startLinking()", class: "rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100", children: "刷新二维码" }),
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "close()", class: "rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100", children: "取消" })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { "x-show": "state === 'success'", "x-cloak": true, class: "mt-6 flex flex-col items-center py-8", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100", children: /* @__PURE__ */ jsxDEV("svg", { class: "h-8 w-8 text-emerald-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDEV("path", { "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", d: "M5 13l4 4L19 7" }) }) }),
          /* @__PURE__ */ jsxDEV("p", { class: "mt-4 text-lg font-semibold text-emerald-700", children: "WhatsApp 连接成功！" }),
          /* @__PURE__ */ jsxDEV("p", { class: "mt-1 text-sm text-slate-500", children: "你的 WhatsApp 已链接到 OpenClaw" }),
          /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "close()", class: "mt-6 rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400", children: "完成" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { "x-show": "state === 'error'", "x-cloak": true, class: "mt-4", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "rounded-xl border border-red-200 bg-red-50 px-4 py-3", children: [
            /* @__PURE__ */ jsxDEV("p", { class: "text-sm font-medium text-red-700", children: "连接失败" }),
            /* @__PURE__ */ jsxDEV("p", { class: "mt-1 text-sm text-red-600", "x-text": "errorMsg" })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3", children: [
            /* @__PURE__ */ jsxDEV("p", { class: "text-xs font-medium text-slate-600", children: "排查建议" }),
            /* @__PURE__ */ jsxDEV("ul", { class: "mt-1 text-xs text-slate-500 list-disc list-inside space-y-0.5", children: [
              /* @__PURE__ */ jsxDEV("li", { children: [
                "确认 Gateway 已启动：",
                /* @__PURE__ */ jsxDEV("code", { class: "bg-slate-200 px-1 rounded", children: "pgrep -f 'openclaw.*gateway'" })
              ] }),
              /* @__PURE__ */ jsxDEV("li", { children: "确认 WhatsApp 渠道插件已安装" }),
              /* @__PURE__ */ jsxDEV("li", { children: [
                "查看 Gateway 日志：",
                /* @__PURE__ */ jsxDEV("code", { class: "bg-slate-200 px-1 rounded", children: "tail -f ~/.openclaw/logs/gateway.log" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-6 flex justify-end gap-3", children: [
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "close()", class: "rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100", children: "取消" }),
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "startLinking()", class: "rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400", children: "重试" })
          ] })
        ] })
      ] })
    );
  }
  return c.html(/* @__PURE__ */ jsxDEV("p", { class: "text-sm text-red-500", children: "不支持的渠道类型" }), 400);
});
partialsRouter.post("/channels/add/telegram", async (c) => {
  try {
    const body = await c.req.parseBody();
    const botToken = (body.botToken || "").trim();
    const userId = (body.userId || "").trim();
    if (!botToken || !userId) {
      c.header("HX-Trigger", asciiJson({ "show-alert": { type: "error", message: "请填写 Bot Token 和用户 ID" } }));
      const channels2 = await fetchChannels();
      return c.html(/* @__PURE__ */ jsxDEV(ChannelList, { channels: channels2 }));
    }
    await execa("openclaw", ["config", "set", "--json", "channels.telegram.botToken", JSON.stringify(botToken)]);
    await execa("openclaw", ["config", "set", "--json", "channels.telegram.allowFrom", JSON.stringify([userId])]);
    try {
      await execa("pkill", ["-f", "openclaw.*gateway"]);
      await new Promise((r) => setTimeout(r, 2e3));
    } catch {
    }
    const logFile = `${process.env.HOME}/.openclaw/logs/gateway.log`;
    execa("sh", ["-c", `nohup openclaw gateway run --bind loopback --port 18789 > ${logFile} 2>&1 &`]);
    await new Promise((r) => setTimeout(r, 3e3));
    const channels = await fetchChannels();
    const configuredIds = new Set(channels.map((ch) => ch.id));
    const available = ALL_CHANNELS.filter((ch) => !configuredIds.has(ch.id));
    c.header("HX-Trigger", asciiJson({ "show-alert": { type: "success", message: "Telegram 渠道配置成功！" } }));
    return c.html(
      /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV(ChannelList, { channels }),
        /* @__PURE__ */ jsxDEV("div", { id: "channel-form-area", "hx-swap-oob": "innerHTML" }),
        /* @__PURE__ */ jsxDEV("div", { id: "available-channels", "hx-swap-oob": "innerHTML", children: /* @__PURE__ */ jsxDEV(AvailableChannelButtons, { available }) })
      ] })
    );
  } catch (err) {
    c.header("HX-Trigger", asciiJson({ "show-alert": { type: "error", message: "配置失败: " + err.message } }));
    try {
      const channels = await fetchChannels();
      return c.html(/* @__PURE__ */ jsxDEV(ChannelList, { channels }));
    } catch {
      return c.html(/* @__PURE__ */ jsxDEV("p", { class: "text-sm text-red-500", children: "配置失败" }), 500);
    }
  }
});
partialsRouter.get("/channels/:id/edit", async (c) => {
  const channelId = c.req.param("id");
  if (channelId === "telegram") {
    const config2 = await fetchChannelConfig("telegram");
    const botToken = config2.botToken || "";
    const userId = Array.isArray(config2.allowFrom) ? config2.allowFrom[0] || "" : "";
    const tgGuide = TelegramGuide({ withTokenInput: false });
    return c.html(
      /* @__PURE__ */ jsxDEV("div", { class: "rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDEV("h4", { class: "text-lg font-semibold text-slate-800", children: "编辑 Telegram 渠道" }),
          /* @__PURE__ */ jsxDEV("button", { onclick: "document.getElementById('channel-form-area').innerHTML=''", class: "rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100", children: "✕ 关闭" })
        ] }),
        /* @__PURE__ */ jsxDEV("form", { class: "mt-4", "hx-post": "/api/partials/channels/telegram/save", "hx-target": "#channel-list", "hx-swap": "innerHTML", children: [
          /* @__PURE__ */ jsxDEV("details", { class: "mt-2", children: [
            /* @__PURE__ */ jsxDEV("summary", { class: "cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-500", children: "查看配置指南" }),
            /* @__PURE__ */ jsxDEV("div", { class: "mt-2", children: tgGuide })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-6", children: [
            /* @__PURE__ */ jsxDEV("label", { class: "mb-2 block text-sm font-medium text-slate-600", children: "Telegram Bot Token" }),
            /* @__PURE__ */ jsxDEV("input", { type: "text", name: "botToken", value: botToken, placeholder: "请输入 Bot Token", class: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-4", children: [
            /* @__PURE__ */ jsxDEV("label", { class: "mb-2 block text-sm font-medium text-slate-600", children: "Telegram 用户 ID" }),
            /* @__PURE__ */ jsxDEV("input", { type: "text", name: "userId", value: userId, placeholder: "请输入用户 ID", class: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-6 flex justify-end gap-3", children: [
            /* @__PURE__ */ jsxDEV("button", { type: "button", onclick: "document.getElementById('channel-form-area').innerHTML=''", class: "rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100", children: "取消" }),
            /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400", children: "保存修改" })
          ] })
        ] })
      ] })
    );
  }
  if (channelId === "whatsapp") {
    const config2 = await fetchChannelConfig("whatsapp");
    const linked = isWhatsAppLinked();
    return c.html(
      /* @__PURE__ */ jsxDEV("div", { class: "rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6", "x-data": "whatsappLinker", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDEV("h4", { class: "text-lg font-semibold text-slate-800", children: "WhatsApp 渠道管理" }),
          /* @__PURE__ */ jsxDEV("button", { "x-on:click": "close()", class: "rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100", children: "✕ 关闭" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-sm text-slate-600", children: "链接状态" }),
            /* @__PURE__ */ jsxDEV("span", { class: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${linked ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`, children: linked ? "已链接" : "未链接" })
          ] }),
          config2.dmPolicy && /* @__PURE__ */ jsxDEV("div", { class: "mt-2 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-sm text-slate-600", children: "DM 策略" }),
            /* @__PURE__ */ jsxDEV("span", { class: "text-sm text-slate-800", children: config2.dmPolicy })
          ] }),
          Array.isArray(config2.allowFrom) && config2.allowFrom.length > 0 && /* @__PURE__ */ jsxDEV("div", { class: "mt-2 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-sm text-slate-600", children: "允许号码" }),
            /* @__PURE__ */ jsxDEV("span", { class: "text-sm text-slate-800", children: config2.allowFrom.join(", ") })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { "x-show": "state === 'idle'", class: "mt-4", children: [
          /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-slate-500", children: linked ? "如需更换手机号或重新绑定，可点击下方按钮生成新的二维码。" : "尚未完成链接，请扫描二维码绑定 WhatsApp。" }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-6 flex justify-end gap-3", children: [
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "close()", class: "rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100", children: "取消" }),
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "startLinking()", class: "rounded-lg bg-emerald-500 px-5 py-2 text-sm text-white hover:bg-emerald-400", children: linked ? "重新链接" : "扫码链接" })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { "x-show": "state === 'loading'", "x-cloak": true, class: "mt-6 flex flex-col items-center py-8", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" }),
          /* @__PURE__ */ jsxDEV("p", { class: "mt-4 text-sm text-slate-600 font-medium", "x-text": "loadingStep" }),
          /* @__PURE__ */ jsxDEV("p", { class: "mt-1 text-xs text-slate-400", children: "整个过程可能需要 10-30 秒" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { "x-show": "state === 'qr'", "x-cloak": true, class: "mt-4", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "flex flex-col items-center", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "rounded-2xl bg-white p-4 shadow-lg", children: /* @__PURE__ */ jsxDEV("img", { "x-bind:src": "qrDataUrl", alt: "WhatsApp QR Code", class: "h-64 w-64" }) }),
            /* @__PURE__ */ jsxDEV("div", { class: "mt-4 text-center", children: [
              /* @__PURE__ */ jsxDEV("p", { class: "text-sm font-medium text-slate-700", children: "请使用手机扫描上方二维码" }),
              /* @__PURE__ */ jsxDEV("p", { class: "mt-1 text-xs text-slate-500", children: "WhatsApp → 设置 → 已关联的设备 → 关联设备" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "mt-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "h-2 w-2 animate-pulse rounded-full bg-indigo-500" }),
              /* @__PURE__ */ jsxDEV("span", { class: "text-sm text-indigo-600", children: "等待扫码中..." })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-6 flex justify-center gap-3", children: [
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "startLinking()", class: "rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100", children: "刷新二维码" }),
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "close()", class: "rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100", children: "取消" })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { "x-show": "state === 'success'", "x-cloak": true, class: "mt-6 flex flex-col items-center py-8", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100", children: /* @__PURE__ */ jsxDEV("svg", { class: "h-8 w-8 text-emerald-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDEV("path", { "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", d: "M5 13l4 4L19 7" }) }) }),
          /* @__PURE__ */ jsxDEV("p", { class: "mt-4 text-lg font-semibold text-emerald-700", children: "WhatsApp 链接成功！" }),
          /* @__PURE__ */ jsxDEV("p", { class: "mt-1 text-sm text-slate-500", children: "你的 WhatsApp 已链接到 OpenClaw" }),
          /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "close()", class: "mt-6 rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400", children: "完成" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { "x-show": "state === 'error'", "x-cloak": true, class: "mt-4", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "rounded-xl border border-red-200 bg-red-50 px-4 py-3", children: [
            /* @__PURE__ */ jsxDEV("p", { class: "text-sm font-medium text-red-700", children: "连接失败" }),
            /* @__PURE__ */ jsxDEV("p", { class: "mt-1 text-sm text-red-600", "x-text": "errorMsg" })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-6 flex justify-end gap-3", children: [
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "close()", class: "rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100", children: "取消" }),
            /* @__PURE__ */ jsxDEV("button", { type: "button", "x-on:click": "startLinking()", class: "rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400", children: "重试" })
          ] })
        ] })
      ] })
    );
  }
  return c.html(/* @__PURE__ */ jsxDEV("p", { class: "text-sm text-red-500", children: "不支持编辑此渠道" }), 400);
});
partialsRouter.post("/channels/:id/save", async (c) => {
  const channelId = c.req.param("id");
  if (channelId !== "telegram") {
    return c.html(/* @__PURE__ */ jsxDEV("p", { class: "text-sm text-red-500", children: "不支持编辑此渠道" }), 400);
  }
  try {
    const body = await c.req.parseBody();
    const botToken = (body.botToken || "").trim();
    const userId = (body.userId || "").trim();
    if (!botToken || !userId) {
      c.header("HX-Trigger", asciiJson({ "show-alert": { type: "error", message: "请填写 Bot Token 和用户 ID" } }));
      const channels2 = await fetchChannels();
      return c.html(/* @__PURE__ */ jsxDEV(ChannelList, { channels: channels2 }));
    }
    await execa("openclaw", ["config", "set", "--json", "channels.telegram.botToken", JSON.stringify(botToken)]);
    await execa("openclaw", ["config", "set", "--json", "channels.telegram.allowFrom", JSON.stringify([userId])]);
    try {
      await execa("pkill", ["-f", "openclaw.*gateway"]);
      await new Promise((r) => setTimeout(r, 2e3));
    } catch {
    }
    const logFile = `${process.env.HOME}/.openclaw/logs/gateway.log`;
    execa("sh", ["-c", `nohup openclaw gateway run --bind loopback --port 18789 > ${logFile} 2>&1 &`]);
    await new Promise((r) => setTimeout(r, 3e3));
    const channels = await fetchChannels();
    c.header("HX-Trigger", asciiJson({ "show-alert": { type: "success", message: "Telegram 渠道已更新" } }));
    return c.html(
      /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV(ChannelList, { channels }),
        /* @__PURE__ */ jsxDEV("div", { id: "channel-form-area", "hx-swap-oob": "innerHTML" })
      ] })
    );
  } catch (err) {
    c.header("HX-Trigger", asciiJson({ "show-alert": { type: "error", message: "保存失败: " + err.message } }));
    try {
      const channels = await fetchChannels();
      return c.html(/* @__PURE__ */ jsxDEV(ChannelList, { channels }));
    } catch {
      return c.html(/* @__PURE__ */ jsxDEV("p", { class: "text-sm text-red-500", children: "保存失败" }), 500);
    }
  }
});
partialsRouter.post("/channels/:id/toggle", async (c) => {
  var _a3;
  const channelId = c.req.param("id");
  try {
    const channels = await fetchChannels();
    const channel = channels.find((ch) => ch.id === channelId);
    if (!channel) {
      c.header("HX-Trigger", asciiJson({ "show-alert": { type: "error", message: "渠道不存在" } }));
      return c.html(/* @__PURE__ */ jsxDEV(ChannelList, { channels }));
    }
    const newEnabled = !channel.enabled;
    if (channelId === "whatsapp") {
      const accounts = ((_a3 = channel.config) == null ? void 0 : _a3.accounts) || {};
      const accountIds = Object.keys(accounts);
      const targetAccount = accountIds.length > 0 ? accountIds[0] : "default";
      await execa("openclaw", ["config", "set", "--json", `channels.whatsapp.accounts.${targetAccount}.enabled`, String(newEnabled)]);
    } else {
      await execa("openclaw", ["config", "set", `channels.${channelId}.enabled`, String(newEnabled)]);
    }
    try {
      await execa("pkill", ["-f", "openclaw.*gateway"]);
      await new Promise((r) => setTimeout(r, 2e3));
    } catch {
    }
    const logFile = `${process.env.HOME}/.openclaw/logs/gateway.log`;
    execa("sh", ["-c", `nohup openclaw gateway run --bind loopback --port 18789 > ${logFile} 2>&1 &`]);
    await new Promise((r) => setTimeout(r, 3e3));
    const updatedChannels = await fetchChannels();
    c.header("HX-Trigger", asciiJson({ "show-alert": { type: "success", message: `${channel.label} 已${newEnabled ? "启用" : "关闭"}` } }));
    return c.html(/* @__PURE__ */ jsxDEV(ChannelList, { channels: updatedChannels }));
  } catch (err) {
    c.header("HX-Trigger", asciiJson({ "show-alert": { type: "error", message: "操作失败: " + err.message } }));
    try {
      const channels = await fetchChannels();
      return c.html(/* @__PURE__ */ jsxDEV(ChannelList, { channels }));
    } catch {
      return c.html(/* @__PURE__ */ jsxDEV("p", { class: "text-sm text-red-500", children: "操作失败" }), 500);
    }
  }
});
function resolveRemoteSupportPath() {
  const home = process.env.HOME || process.cwd();
  return path.join(home, ".openclaw-helper", "remote-support.json");
}
partialsRouter.get("/remote-support/form", async (c) => {
  let data = { sshKey: "", cpolarToken: "", region: "en" };
  try {
    const filePath = resolveRemoteSupportPath();
    if (fs.existsSync(filePath)) {
      data = { ...data, ...JSON.parse(fs.readFileSync(filePath, "utf-8")) };
    }
  } catch {
  }
  const alpineInit = JSON.stringify({ sshKey: data.sshKey || "", cpolarToken: data.cpolarToken || "", region: data.region || "en" });
  return c.html(
    /* @__PURE__ */ jsxDEV("form", { "x-data": alpineInit, id: "remote-form-inner", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "mt-4", children: [
        /* @__PURE__ */ jsxDEV("label", { for: "ssh-key", class: "mb-2 block text-sm font-medium text-slate-600", children: "SSH Key" }),
        /* @__PURE__ */ jsxDEV("textarea", { id: "ssh-key", name: "sshKey", rows: 4, "x-model": "sshKey", placeholder: "粘贴 SSH 公钥", class: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "mt-4", children: [
        /* @__PURE__ */ jsxDEV("label", { for: "cpolar-token", class: "mb-2 block text-sm font-medium text-slate-600", children: "cpolar AuthToken" }),
        /* @__PURE__ */ jsxDEV("input", { type: "text", id: "cpolar-token", name: "cpolarToken", "x-model": "cpolarToken", placeholder: "输入 cpolar Authtoken", class: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "mt-4", children: [
        /* @__PURE__ */ jsxDEV("label", { for: "region-select", class: "mb-2 block text-sm font-medium text-slate-600", children: "区域" }),
        /* @__PURE__ */ jsxDEV("select", { id: "region-select", name: "region", "x-model": "region", class: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none", children: [
          /* @__PURE__ */ jsxDEV("option", { value: "cn", children: "中国 (cn)" }),
          /* @__PURE__ */ jsxDEV("option", { value: "uk", children: "美国 (uk)" }),
          /* @__PURE__ */ jsxDEV("option", { value: "en", children: "欧洲 (en)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "mt-6 flex flex-wrap gap-3", id: "remote-alert" }),
      /* @__PURE__ */ jsxDEV("div", { class: "mt-4 flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxDEV("button", { type: "button", "hx-post": "/api/partials/remote-support/save", "hx-include": "#remote-form-inner", "hx-target": "#remote-alert", "hx-swap": "innerHTML", class: "rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100", children: "保存配置" }),
        /* @__PURE__ */ jsxDEV("button", { type: "button", "hx-post": "/api/partials/remote-support/start", "hx-include": "#remote-form-inner", "hx-target": "#remote-alert", "hx-swap": "innerHTML", "x-bind": "{ disabled: !sshKey.trim() || !cpolarToken.trim() }", class: "rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400", children: "打开远程支持" })
      ] })
    ] })
  );
});
partialsRouter.post("/remote-support/save", async (c) => {
  try {
    const body = await c.req.parseBody();
    const filePath = resolveRemoteSupportPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ sshKey: body.sshKey || "", cpolarToken: body.cpolarToken || "", region: body.region || "en" }, null, 2));
    return c.html(/* @__PURE__ */ jsxDEV("div", { class: "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700", children: "已保存远程支持配置" }));
  } catch (err) {
    return c.html(/* @__PURE__ */ jsxDEV("div", { class: "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700", children: [
      "保存失败: ",
      err.message
    ] }));
  }
});
partialsRouter.post("/remote-support/start", async (c) => {
  try {
    const body = await c.req.parseBody();
    const sshKey = (body.sshKey || "").trim();
    const cpolarToken = (body.cpolarToken || "").trim();
    const region = body.region || "en";
    if (!sshKey || !cpolarToken) {
      return c.html(/* @__PURE__ */ jsxDEV("div", { class: "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700", children: "请填写 SSH Key 和 cpolar AuthToken" }));
    }
    const filePath = resolveRemoteSupportPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ sshKey, cpolarToken, region }, null, 2));
    const mappedRegion = region === "en" ? "eu" : region;
    await execa("cpolar", ["authtoken", cpolarToken]);
    await execa("sh", ["-c", `nohup cpolar tcp -region=${mappedRegion} 22 > ${process.env.HOME}/.openclaw/logs/cpolar.log 2>&1 &`]);
    return c.html(/* @__PURE__ */ jsxDEV("div", { class: "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700", children: "远程支持已启动" }));
  } catch (err) {
    return c.html(/* @__PURE__ */ jsxDEV("div", { class: "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700", children: [
      "启动失败: ",
      err.message
    ] }));
  }
});
const base = new Hono();
base.use("/*", cors());
base.route("/api/config", configRouter);
base.route("/api/partials", partialsRouter);
base.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
const app = createApp({ app: base });
app.use("/assets/*", serveStatic({ root: "./public" }));
app.use("/tailwind.css", serveStatic({ path: "./public/tailwind.css" }));
const PORT = 17543;
console.log(`🚀 OpenClaw Helper 服务启动中...`);
console.log(`📍 监听端口: ${PORT}`);
console.log(`🌐 访问地址: http://127.0.0.1:${PORT}`);
const server = createServer(async (req, res) => {
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const response = await app.fetch(
    new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: hasBody ? req : void 0,
      ...hasBody ? { duplex: "half" } : {}
    })
  );
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
});
setupWebSocket(server);
server.listen(PORT, () => {
  console.log("✅ 服务已启动 (WebSocket 支持已启用)");
});
