import { ERASE_CIRCLE_SIZE } from "./constants";
import { newImageElement } from "./element";
import { FileId, NonDeletedExcalidrawElement } from "./element/types";
import { AppClassProperties, AppState } from "./types";

export const newEraseDropzoneElement = (
  canvasSize: AppState["canvasSize"],
): NonDeletedExcalidrawElement | null => {
  if (canvasSize.mode !== "fixed") {
    return null;
  }
  return newImageElement({
    type: "image",
    x: canvasSize.width / 2 - ERASE_CIRCLE_SIZE / 2,
    y: canvasSize.height - ERASE_CIRCLE_SIZE * 1.1,
    strokeColor: "red",
    backgroundColor: "rgba(255,0,0,0.01)",
    fillStyle: "solid",
    strokeWidth: 3,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    strokeSharpness: "sharp",
    locked: true,
    width: ERASE_CIRCLE_SIZE,
    height: ERASE_CIRCLE_SIZE,
    fileId: ERASE_CIRCLE_FILE_ID,
  });
};

export const maybeUpdateEraseDropzoneElement = (
  oldState: AppState,
  newState: AppState,
  setState: (state: AppState) => void,
) => {
  if (oldState.canvasSize === newState.canvasSize) {
    return;
  }
  setState({
    ...newState,
    eraseDropzoneElement: newEraseDropzoneElement(newState.canvasSize),
  });
};

export const cacheEraseCircleImage = (
  cache: AppClassProperties["imageCache"],
) => {
  cache.set(ERASE_CIRCLE_FILE_ID, {
    image: eraseCircleImg,
    mimeType: "image/svg+xml",
  });
};

const ERASE_CIRCLE_FILE_ID = "erase_circle" as FileId;

const eraseCircleSVG = `
<svg width="448" height="448" viewBox="0 0 448 448" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_404_119)">
<circle cx="224" cy="224" r="214" fill="black" fill-opacity="0.31" shape-rendering="crispEdges"/>
</g>
<circle cx="223.5" cy="223.5" r="172.5" stroke="white" stroke-width="14"/>
<path d="M142 168.6H160.222M160.222 168.6H306M160.222 168.6L160.222 296.7C160.222 301.553 162.142 306.208 165.559 309.64C168.977 313.072 173.612 315 178.444 315H269.556C274.388 315 279.023 313.072 282.441 309.64C285.858 306.208 287.778 301.553 287.778 296.7V168.6M187.556 168.6V150.3C187.556 145.447 189.475 140.792 192.893 137.36C196.31 133.928 200.945 132 205.778 132H242.222C247.055 132 251.69 133.928 255.107 137.36C258.525 140.792 260.444 145.447 260.444 150.3V168.6M205.778 214.35V269.25M242.222 214.35V269.25" stroke="white" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
<defs>
<filter id="filter0_d_404_119" x="6" y="10" width="436" height="436" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_404_119"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_404_119" result="shape"/>
</filter>
</defs>
</svg>

`;

const eraseCircleImg = (() => {
  const DOMURL = window.URL || window.webkitURL || window;
  const img = new Image();
  const svg = new Blob([eraseCircleSVG], { type: "image/svg+xml" });
  const url = DOMURL.createObjectURL(svg);
  img.src = url;
  return img;
})();
