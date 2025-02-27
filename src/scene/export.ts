import rough from "roughjs/bin/rough";
import {
  ExcalidrawPageElement,
  NonDeletedExcalidrawElement,
} from "../element/types";
import { getCommonBounds } from "../element/bounds";
import { renderScene, renderSceneToSvg } from "../renderer/renderScene";
import { distance } from "../utils";
import { AppState, BinaryFiles } from "../types";
import { DEFAULT_EXPORT_PADDING, SVG_NS, THEME_FILTER } from "../constants";
import { getDefaultAppState } from "../appState";
import { serializeAsJSON } from "../data/json";
import {
  getInitializedImageElements,
  updateImageCache,
} from "../element/image";

export const SVG_EXPORT_TAG = `<!-- svg-source:excalidraw -->`;

export const exportToCanvas = async (
  elements: readonly NonDeletedExcalidrawElement[],
  page: ExcalidrawPageElement | null,
  appState: AppState,
  files: BinaryFiles,
  {
    exportBackground,
    exportPadding = DEFAULT_EXPORT_PADDING,
    viewBackgroundColor,
  }: {
    exportBackground: boolean;
    exportPadding?: number;
    viewBackgroundColor: string;
  },
  createCanvas: (
    width: number,
    height: number,
  ) => { canvas: HTMLCanvasElement; scale: number } = (width, height) => {
    const canvas = document.createElement("canvas");
    canvas.width = width * appState.exportScale;
    canvas.height = height * appState.exportScale;
    return { canvas, scale: appState.exportScale };
  },
) => {
  const [minX, minY, width, height] = getCanvasSize(
    elements,
    page,
    exportPadding,
  );

  const { canvas, scale = 1 } = createCanvas(width, height);

  const defaultAppState = getDefaultAppState();

  const { imageCache } = await updateImageCache({
    imageCache: new Map(),
    fileIds: getInitializedImageElements(elements).map(
      (element) => element.fileId,
    ),
    files,
  });

  renderScene({
    elements,
    page: null,
    appState,
    scale,
    rc: rough.canvas(canvas),
    canvas,
    renderConfig: {
      viewBackgroundColor: exportBackground ? viewBackgroundColor : null,
      scrollX: -minX + exportPadding,
      scrollY: -minY + exportPadding,
      zoom: defaultAppState.zoom,
      remotePointerViewportCoords: {},
      remoteSelectedElementIds: {},
      shouldCacheIgnoreZoom: false,
      remotePointerUsernames: {},
      remotePointerUserStates: {},
      theme: appState.exportWithDarkMode ? "dark" : "light",
      imageCache,
      renderScrollbars: false,
      renderSelection: false,
      renderGrid: false,
      isExporting: true,
    },
  });

  return canvas;
};

export const exportToSvg = async (
  elements: readonly NonDeletedExcalidrawElement[],
  page: ExcalidrawPageElement | null,
  appState: {
    exportBackground: boolean;
    exportPadding?: number;
    exportScale?: number;
    viewBackgroundColor: string;
    exportWithDarkMode?: boolean;
    exportEmbedScene?: boolean;
  },
  files: BinaryFiles | null,
): Promise<SVGSVGElement> => {
  const {
    exportPadding = DEFAULT_EXPORT_PADDING,
    viewBackgroundColor,
    exportScale = 1,
    exportEmbedScene,
  } = appState;
  let metadata = "";
  if (exportEmbedScene) {
    try {
      metadata = await (
        await import(/* webpackChunkName: "image" */ "../../src/data/image")
      ).encodeSvgMetadata({
        text: serializeAsJSON(elements, appState, files || {}, "local"),
      });
    } catch (error: any) {
      console.error(error);
    }
  }
  const [minX, minY, width, height] = getCanvasSize(
    elements,
    page,
    exportPadding,
  );

  // initialize SVG root
  const svgRoot = document.createElementNS(SVG_NS, "svg");
  svgRoot.setAttribute("version", "1.1");
  svgRoot.setAttribute("xmlns", SVG_NS);
  svgRoot.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svgRoot.setAttribute("width", `${width * exportScale}`);
  svgRoot.setAttribute("height", `${height * exportScale}`);
  if (appState.exportWithDarkMode) {
    svgRoot.setAttribute("filter", THEME_FILTER);
  }

  let assetPath = "https://excalidraw.com/";

  // Asset path needs to be determined only when using package
  if (process.env.IS_EXCALIDRAW_NPM_PACKAGE) {
    assetPath =
      window.EXCALIDRAW_ASSET_PATH ||
      `https://unpkg.com/${process.env.PKG_NAME}@${process.env.PKG_VERSION}`;

    if (assetPath?.startsWith("/")) {
      assetPath = assetPath.replace("/", `${window.location.origin}/`);
    }
    assetPath = `${assetPath}/dist/excalidraw-assets/`;
  }
  svgRoot.innerHTML = `
  ${SVG_EXPORT_TAG}
  ${metadata}
  <defs>
    <style>
      @font-face {
        font-family: "Virgil";
        src: url("${assetPath}Virgil.woff2");
      }
      @font-face {
        font-family: "Cascadia";
        src: url("${assetPath}Cascadia.woff2");
      }
    </style>
  </defs>
  `;
  // render background rect
  if (appState.exportBackground && viewBackgroundColor) {
    const rect = svgRoot.ownerDocument!.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", `${width}`);
    rect.setAttribute("height", `${height}`);
    rect.setAttribute("fill", viewBackgroundColor);
    svgRoot.appendChild(rect);
  }

  const rsvg = rough.svg(svgRoot);
  renderSceneToSvg(elements, page, rsvg, svgRoot, files || {}, {
    offsetX: -minX + exportPadding,
    offsetY: -minY + exportPadding,
    exportWithDarkMode: appState.exportWithDarkMode,
  });

  return svgRoot;
};

// calculate smallest area to fit the contents in
const getCanvasSize = (
  elements: readonly NonDeletedExcalidrawElement[],
  page: ExcalidrawPageElement | null,
  exportPadding: number,
): [number, number, number, number] => {
  if (page) {
    return [0, 0, page.width, page.height];
  }

  const [minX, minY, maxX, maxY] = getCommonBounds(elements);
  const width = distance(minX, maxX) + exportPadding * 2;
  const height = distance(minY, maxY) + exportPadding + exportPadding;

  return [minX, minY, width, height];
};

export const getExportSize = (
  elements: readonly NonDeletedExcalidrawElement[],
  page: ExcalidrawPageElement | null,
  exportPadding: number,
  scale: number,
): [number, number] => {
  const [, , width, height] = getCanvasSize(elements, page, exportPadding).map(
    (dimension) => Math.trunc(dimension * scale),
  );
  return [width, height];
};
