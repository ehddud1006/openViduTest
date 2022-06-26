import React, { Component } from "react";
import OpenViduAudioComponent from "./OvVideo";
import styled from "styled-components";

function UserAudioComponent(props) {
  console.log("유저 비디오 프롭스", props);
  // const getNicknameTag = () => {
  //   // Gets the nickName of the user
  //   return JSON.parse(props.streamManager.stream.connection.data).clientData;
  // };
  return (
    <div>
      {props.streamManager !== undefined ? (
        <OuterCircle>
          <OpenViduAudioComponent streamManager={props.streamManager} />
        </OuterCircle>
      ) : null}
    </div>
  );
}

export default UserAudioComponent;

const OuterCircle = styled.div`
  --size: 40px;
  width: var(--size);
  height: var(--size);
  border-radius: var(--size);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 4px solid #948a9e;
  background-color: #fff;
  position: relative;
`;

const InnerCircle = styled.div`
  --size: 40px;
  width: var(--size);
  height: var(--size);
  border-radius: var(--size);
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => props.color};
  position: absolute;
`;
