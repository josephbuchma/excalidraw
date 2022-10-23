import React from "react";
import "./PageAwareness.scss";
import clsx from "clsx";
import { ToolButton } from "./ToolButton";
import { addPageIcon, nextPageIcon, prevPageIcon, trash } from "./icons";

export type PageAwarenessMobileProps = {
  pages: readonly string[];
  currentPageId: string;
};

export const PageAwarenessMobile = React.memo(
  ({ pages, currentPageId }: PageAwarenessMobileProps) => {
    let current = 0;
    return (
      <div
        className={clsx("excalidraw-page-awareness-mobile", {
          "many-pages": pages.length > 30,
        })}
      >
        {pages.map((id) => (
          <div
            key={id}
            className={clsx({
              hl: (id === currentPageId ? current++ : current) === 0,
            })}
          />
        ))}
      </div>
    );
  },
);

export type PageAwarenessDesktopProps = {
  pages: readonly string[];
  currentPageId: string;
  onNextPage: () => void;
  onPrevPage: () => void;
  onAddPage: () => void;
  onDeletePage: () => void;
  isViewMode?: boolean;
};

export const PageAwarenessDesktop = React.memo(
  ({
    pages,
    currentPageId,
    onNextPage,
    onPrevPage,
    onAddPage,
    onDeletePage,
    isViewMode,
  }: PageAwarenessDesktopProps) => {
    return (
      <div
        className={clsx("excalidraw-page-awareness-desktop", {
          "many-pages": pages.length > 30,
        })}
      >
        <div className="pages">
          {pages.map((id) => (
            <div
              key={id}
              className={clsx("page", {
                hl: id === currentPageId,
              })}
            />
          ))}
        </div>
        <div className="buttons">
          <ToolButton
            type="button"
            size="small"
            icon={prevPageIcon}
            aria-label="Previous page"
            onClick={onPrevPage}
          />
          {!isViewMode && (
            <>
              <ToolButton
                type="button"
                size="small"
                icon={trash}
                aria-label="Delete current page"
                onClick={onDeletePage}
              />
              <ToolButton
                type="button"
                size="small"
                icon={addPageIcon}
                aria-label="Add new page after this one"
                onClick={onAddPage}
              />
            </>
          )}
          <ToolButton
            type="button"
            size="small"
            icon={nextPageIcon}
            aria-label="Next page"
            onClick={onNextPage}
          />
        </div>
      </div>
    );
  },
);
