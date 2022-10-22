import { ExcalidrawPageElement } from "./element/types";
import { getNormalizedZoom } from "./scene";
import { AppProps, AppState } from "./types";

export function maybeAutozoomFixedCanvas(
  state: AppState,
  currentPageElem: ExcalidrawPageElement | null,
  setState: (state: AppState) => void,
  defaultCanvasSize?: AppProps["defaultCanvasSize"],
) {
  if (!currentPageElem || !defaultCanvasSize) {
    return;
  }

  let { width: srcw, height: srch } = currentPageElem || defaultCanvasSize;
  const autoZoom = defaultCanvasSize?.autoZoom;

  const { width: dstw, height: dsth } = state;
  const scale = Math.min(dstw / srcw, dsth / srch);

  [srcw, srch] = [srcw, srch].map((v) => v * scale);

  const scroll = autoZoom
    ? {
        scrollX: dstw > srcw ? (dstw - srcw) / 2 / scale : 0,
        scrollY: dsth > srch ? (dsth - srch) / 2 / scale : 0,
        zoom: {
          value: getNormalizedZoom(scale),
        },
      }
    : {};
  if (
    scroll.scrollX !== state.scrollX ||
    scroll.scrollY !== state.scrollY ||
    scroll.zoom.value !== state.zoom.value
  ) {
    setState({
      ...state,
      ...scroll,
    });
  }
}
