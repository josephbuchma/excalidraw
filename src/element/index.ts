import {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
  NonDeleted,
  ExcalidrawPageElements,
  ExcalidrawPageElement,
} from "./types";
import { isInvisiblySmallElement } from "./sizeHelpers";
import { isLinearElementType } from "./typeChecks";
import { newElementWith } from "./mutateElement";

export {
  newElement,
  newTextElement,
  updateTextElement,
  newLinearElement,
  newImageElement,
  duplicateElement,
} from "./newElement";
export {
  getElementAbsoluteCoords,
  getElementBounds,
  getCommonBounds,
  getDiamondPoints,
  getArrowheadPoints,
  getClosestElementBounds,
} from "./bounds";

export {
  OMIT_SIDES_FOR_MULTIPLE_ELEMENTS,
  getTransformHandlesFromCoords,
  getTransformHandles,
} from "./transformHandles";
export {
  hitTest,
  isHittingElementBoundingBoxWithoutHittingElement,
} from "./collision";
export {
  resizeTest,
  getCursorForResizingElement,
  getElementWithTransformHandleType,
  getTransformHandleTypeFromCoords,
} from "./resizeTest";
export {
  transformElements,
  getResizeOffsetXY,
  getResizeArrowDirection,
} from "./resizeElements";
export {
  dragSelectedElements,
  getDragOffsetXY,
  dragNewElement,
} from "./dragElements";
export { isTextElement, isExcalidrawElement } from "./typeChecks";
export { textWysiwyg } from "./textWysiwyg";
export { redrawTextBoundingBox } from "./textElement";
export {
  getPerfectElementSize,
  getLockedLinearCursorAlignSize,
  isInvisiblySmallElement,
  resizePerfectLineForNWHandler,
  getNormalizedDimensions,
} from "./sizeHelpers";
export { showSelectedShapeActions } from "./showSelectedShapeActions";

export const getSceneVersion = (elements: readonly ExcalidrawElement[]) =>
  elements.reduce((acc, el) => acc + el.version, 0);

export const getVisibleElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(
    (el) => !el.isDeleted && !isInvisiblySmallElement(el),
  ) as readonly NonDeletedExcalidrawElement[];

export const getNonDeletedElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(
    (element) => !element.isDeleted,
  ) as readonly NonDeletedExcalidrawElement[];

export const findPageElement = (
  id: string | null,
  elements: readonly ExcalidrawElement[],
): ExcalidrawPageElement | null => {
  if (!id) {
    return null;
  }
  const p = elements.filter(
    (el) => el.id === id && el.type === "page",
  ) as unknown as ExcalidrawPageElement;
  return p || null;
};

export const getElementsOnPage = (
  pageId: string | null,
  elements: readonly ExcalidrawElement[],
  includePageElement?: boolean,
): ExcalidrawPageElements => {
  let pageElIdx: number = -1;
  const sliceAdjust = includePageElement ? 0 : 1;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (pageElIdx < 0 && el.type === "page" && el.id === pageId) {
      pageElIdx = i;
      continue;
    }
    if (pageElIdx > -1 && el.type === "page") {
      return elements.slice(
        pageElIdx + sliceAdjust,
        i,
      ) as ExcalidrawPageElements;
    }
  }
  return elements.slice(pageElIdx + sliceAdjust) as ExcalidrawPageElements;
};

export const replaceElementsOnPage = (
  pageId: string | null,
  newElements: ExcalidrawPageElements,
  allElements: readonly ExcalidrawElement[],
) => {
  let start: number = -1;
  const ret = [];
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    if (start < 0) {
      ret.push(el);
    }
    if (start < 0 && el.type === "page" && el.id === pageId) {
      start = i;
      ret.push(...newElements);
      continue;
    }
    if (start > -1 && el.type === "page") {
      ret.push(...allElements.slice(i));
      return ret;
    }
  }
  return ret;
};

export const addPage = (
  page: ExcalidrawPageElement,
  afterPageId: string,
  allElements: readonly ExcalidrawElement[],
): readonly ExcalidrawElement[] => {
  let foundPrevPage = false;
  const spliceIdx = allElements.findIndex((el) => {
    foundPrevPage = el.id === afterPageId || foundPrevPage;
    return (
      foundPrevPage &&
      el.id !== afterPageId &&
      el.type === "page" &&
      !el.isDeleted
    );
  });
  if (spliceIdx > 0) {
    const ret = allElements.slice();
    ret.splice(spliceIdx, 0, page);
    return ret;
  }
  return [...allElements, page];
};

export const isFixedSizePage = (page: ExcalidrawPageElement) => {
  return (page.width || 0) + (page.height || 0) > 0;
};

export const deletePage = (
  pageId: string,
  allElements: readonly ExcalidrawElement[],
  onlyClearElementsOnPage?: boolean,
): readonly ExcalidrawElement[] => {
  let isOnThePage = false;
  return allElements.map((el, idx) => {
    if (isOnThePage && el.type === "page") {
      isOnThePage = false;
    } else if (el.id === pageId) {
      isOnThePage = true;
      if (onlyClearElementsOnPage) {
        return el;
      }
    }
    if (isOnThePage) {
      return newElementWith(el, { isDeleted: true });
    }
    return el;
  });
};

export const findSubstituteForDeletedPage = (
  deletedPageId: string,
  elements: readonly ExcalidrawElement[],
): string | null => {
  let ret = null;
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].id === deletedPageId) {
      if (ret) {
        return ret;
      }
      return (
        elements.slice(i).find((el) => el.type === "page" && !el.isDeleted)
          ?.id || null
      );
    }
    if (elements[i].type === "page" && !elements[i].isDeleted) {
      ret = elements[i].id;
    }
  }
  return ret;
};

export const hasPageBefore = (
  pageId: string,
  elements: readonly ExcalidrawElement[],
): boolean => {
  return (
    elements.find((el) => el.type === "page" && !el.isDeleted)?.id !== pageId
  );
};

export const hasPageAfter = (
  pageId: string,
  elements: readonly ExcalidrawElement[],
): boolean => {
  return (
    elements
      .slice()
      .reverse()
      .find((el) => el.type === "page" && !el.isDeleted)?.id !== pageId
  );
};

export const hasSingleEmptyPage = (elements: readonly ExcalidrawElement[]) => {
  const { pages, elems } = elements.reduce(
    (acc, el) => {
      el.type === "page" && !el.isDeleted && acc.pages++;
      el.type !== "page" && !el.isDeleted && acc.elems++;
      return acc;
    },
    { pages: 0, elems: 0 },
  );
  return pages === 1 && elems === 0;
};

export const isNonDeletedElement = <T extends ExcalidrawElement>(
  element: T,
): element is NonDeleted<T> => !element.isDeleted;

const _clearElements = (
  elements: readonly ExcalidrawElement[],
): ExcalidrawElement[] =>
  getNonDeletedElements(elements).map((element) =>
    isLinearElementType(element.type)
      ? { ...element, lastCommittedPoint: null }
      : element,
  );

export const clearElementsForDatabase = (
  elements: readonly ExcalidrawElement[],
) => _clearElements(elements);

export const clearElementsForExport = (
  elements: readonly ExcalidrawElement[],
) => _clearElements(elements);

export const clearElementsForLocalStorage = (
  elements: readonly ExcalidrawElement[],
) => _clearElements(elements);
