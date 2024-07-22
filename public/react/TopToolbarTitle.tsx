import React, { CSSProperties } from "react";
import { dashboardSidebarWidth, fontTitle, palette } from "./style";
import { css } from "@emotion/react";

interface Props {
  title: string;
}

const titlePartCommon: CSSProperties = {
  display: "inline-block",
  textAlign: "center",
  lineHeight: "55px",
};

const titleStyle = css({
  height: '100%',
  width: dashboardSidebarWidth,
  minWidth: dashboardSidebarWidth,
  fontSize: 18,
  margin: 0,
  display: "flex",
  backgroundColor: palette.GREY[350],
  borderRight: palette.GREY[400],
  ...fontTitle,

  "& >div": {
    ...titlePartCommon,
    borderRight: `1px solid ${palette.GREY[300]}`,
    padding: "0 10px",
    fontSize: "20px",
    flex: "0 0 50px",
  },

  "& >h1": {
    ...titlePartCommon,
    flex: "1 1 auto",
    fontSize: 18,
    margin: 0,
  },
});

export const TopToolbarTitle: React.FunctionComponent<Props> = ({ title }) => {
  return (
    <div css={titleStyle}>
      <div>
        <span>W</span>
      </div>
      <h1>
        <span>{title}</span>
      </h1>
    </div>
  );
};
