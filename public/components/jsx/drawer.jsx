import React from 'react';

export const Drawer = ({contentItem,...props}) => {
  console.log(props, "PROPS")
  const {workingTitle } = contentItem
  return (<div className="configure-columns__new-indicator"> ⚛️ RENDERED IN REACT ⚛️ {workingTitle || "NOTHING"}  </div>)
}