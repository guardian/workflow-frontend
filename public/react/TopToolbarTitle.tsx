import React from "react";


interface Props {
  title: string;
}

export const TopToolbarTitle: React.FunctionComponent<Props> = ({
  title,
}) => {
  return (
    <div className="top-toolbar__title">
          <div className="top-toolbar__letter">
              <span className="top-toolbar__letter-text">W</span>
          </div>
          <h1 className="top-toolbar__page-title">
              <span className="top-toolbar__page-title-text">{title}</span>
          </h1>
      </div>
  );
};
