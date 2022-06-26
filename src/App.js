// import "./styles.css";
import axios from "axios";
import { OpenVidu } from "openvidu-browser";
import React, { Component, useCallback } from "react";
import UserAudioComponent from "./UserVideoComponent";
import green from "./bigreen.png";
import red from "./red.png";
import muteIcon from "./mute.png";
import unmuteIcon from "./unmute.png";
import "./test.css";

// import UserVideoComponent from "./UserVideoComponent";
// const OPENVIDU_SERVER_URL = "http://3.38.230.215:4443";
const OPENVIDU_SERVER_URL = "https://" + window.location.hostname + ":4443";
const OPENVIDU_SERVER_SECRET = "MY_SECRET";
const nickname = "Participant" + Math.floor(Math.random() * 100);
// const nickname = "ksw";
export default function App() {
  const [mySessionId, setMySessionId] = React.useState("SessionA");
  const [session, setSession] = React.useState(undefined);
  const [mainStreamManager, setMainStreamManager] = React.useState(undefined);
  const [publisher, setPublisher] = React.useState(undefined);
  const [subscribers, setSubscribers] = React.useState([]);
  const [mute, setMute] = React.useState(false);
  const [target, setTarget] = React.useState(true);
  const leaveSession = useCallback(() => {
    if (target) {
      setTarget(false);
      console.log("오픈비두 세션종료");

      if (session) {
        session.disconnect();
      }
      setSession(undefined);
      setSubscribers([]);
      setMySessionId("");
      setPublisher(undefined);
      setMainStreamManager(undefined);
      deleteSubscriber();
      setMute(false);
      setTarget(true);
    }
  }, [target]);

  const onbeforeunload = (event) => {
    leaveSession();
  };

  const handleChangeSessionId = (e) => {
    this.setState({
      mySessionId: e.target.value,
    });
  };

  const handleChangeUserName = (e) => {
    this.setState({
      myUserName: e.target.value,
    });
  };

  const handleMainVideoStream = (stream) => {
    if (mainStreamManager !== stream) {
      setMainStreamManager(stream);
    }
  };

  const deleteSubscriber = (streamManager) => {
    console.log("ddddeeeellllltttt");
    let subscriberss = subscribers;
    let index = subscriberss.indexOf(streamManager, 0);
    if (index > -1) {
      subscriberss.splice(index, 1);
      console.log(subscriberss);
      setSubscribers([...subscriberss]);
    }
  };

  const createSession = (sessionId) => {
    return new Promise((resolve, reject) => {
      var data = JSON.stringify({ customSessionId: sessionId });
      axios
        .post(OPENVIDU_SERVER_URL + "/openvidu/api/sessions", data, {
          headers: {
            Authorization:
              "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log("CREATE SESION", response);
          resolve(response.data.id);
        })
        .catch((response) => {
          var error = Object.assign({}, response);
          if (error?.response?.status === 409) {
            resolve(sessionId);
          } else {
            console.log(error);
            console.warn(
              "No connection to OpenVidu Server. This may be a certificate error at " +
                OPENVIDU_SERVER_URL
            );
            if (
              window.confirm(
                'No connection to OpenVidu Server. This may be a certificate error at "' +
                  OPENVIDU_SERVER_URL +
                  '"\n\nClick OK to navigate and accept it. ' +
                  'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                  OPENVIDU_SERVER_URL +
                  '"'
              )
            ) {
              window.location.assign(
                OPENVIDU_SERVER_URL + "/accept-certificate"
              );
            }
          }
        });
    });
  };

  const createToken = (sessionId) => {
    console.log("SIISISISIBBALLALALAL");
    return new Promise((resolve, reject) => {
      var data = {};
      axios
        .post(
          OPENVIDU_SERVER_URL +
            "/openvidu/api/sessions/" +
            sessionId +
            "/connection",
          data,
          {
            headers: {
              Authorization:
                "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => {
          console.log("TOKEN", response);
          resolve(response.data.token);
        })
        .catch((error) => reject(error));
    });
  };

  const getToken = useCallback(() => {
    return createSession(mySessionId).then((sessionId) =>
      createToken(sessionId)
    );
    // return new Promise((resolve, reject) => {
    //   axios
    //     .post("http://3.38.230.215:5000/api/v1/webrtc/get-token", {
    //       sessionName: "test123",
    //       email: "ksw",
    //     })
    //     .then((response) => {
    //       console.log("TOKEN", response);
    //       resolve(response.data.token);
    //     })
    //     .catch((error) => reject(error));
    // });
  }, []);

  //세션 연결 및 커넥트
  const joinSession = useCallback(() => {
    if (target) {
      setTarget(false);
      window.addEventListener("beforeunload", onbeforeunload);

      const OV = new OpenVidu();

      var mySession = OV.initSession();
      console.log(mySession);
      setSession(mySession);

      mySession.on("streamCreated", (event) => {
        var subscriber = mySession.subscribe(event.stream, undefined);
        console.log(subscriber);
        var subscriberList = subscribers;
        subscriberList.push(subscriber);
        setTarget(subscriber);
        setSubscribers([...subscriberList]);
        // subscriber.subscribeToAudio(true);
      });

      mySession.on("streamDestroyed", (event) => {
        // Remove the stream from 'subscribers' array
        deleteSubscriber(event.stream.streamManager);
      });

      mySession.on("exception", (exception) => {
        console.warn(exception);
      });

      getToken().then((tt) => {
        console.log(tt);
        mySession
          .connect(tt, { clientData: nickname })
          .then(async () => {
            var devices = await OV.getDevices();
            var videoDevices = devices.filter(
              (device) => device.kind === "videoinput"
            );

            let publisher = OV.initPublisher(undefined, {
              audioSource: undefined,
              videoSource: undefined,
              publishAudio: true,
              publishVideo: false,
              resolution: "640x480",
              frameRate: 30,
              insertMode: "APPEND",
              mirror: false,
            });
            console.log(publisher);
            mySession.publish(publisher);
            setMainStreamManager(publisher);
            setPublisher(publisher);
            publisher.publishAudio(true);
          })
          .catch((err) => {
            console.log("커넥팅 실패", err.code, err.message);
          });
      });
      setTarget(true);
    }
  }, [session, target]);
  console.log(subscribers);
  return (
    <div className="container" style={{ backgroundColor: "#f4f4f4" }}>
      {session === undefined ? (
        <img
          className="greenbutton"
          alt=""
          src={green}
          onClick={joinSession}
        ></img>
      ) : (
        // <div id="join">
        //   <div id="img-div">
        //     <img
        //       className="hi"
        //       src="resources/images/openvidu_grey_bg_transp_cropped.png"
        //       alt="OpenVidu logo"
        //     />
        //   </div>
        //   <div id="join-dialog" className="jumbotron vertical-center">
        //     <h1> Join a video session </h1>
        //     <form className="form-group" onSubmit={joinSession}>
        //       <p>
        //         <label>Participant: </label>
        //         <input
        //           className="form-control"
        //           type="text"
        //           id="userName"
        //           value={nickname}
        //           onChange={handleChangeUserName}
        //           required
        //         />
        //       </p>
        //       <p>
        //         <label> Session: </label>
        //         <input
        //           className="form-control"
        //           type="text"
        //           id="sessionId"
        //           value={mySessionId}
        //           onChange={handleChangeSessionId}
        //           required
        //         />
        //       </p>
        //       <p className="text-center">
        //         <input
        //           className="btn btn-lg btn-success"
        //           name="commit"
        //           type="submit"
        //           value="JOIN"
        //         />
        //       </p>
        //     </form>
        //   </div>
        // </div>
        <img
          className="greenbutton"
          alt=""
          src={red}
          onClick={leaveSession}
        ></img>
      )}

      {session !== undefined ? (
        <div id="session">
          <div id="session-header">
            {/* <h1 id="session-title">{mySessionId}</h1> */}
            {/* <div>session</div> */}
            {/* <input
                className="btn btn-large btn-danger"
                type="button"
                id="buttonLeaveSession"
                onClick={this.leaveSession}
                value="Leave sessionsss"
              /> */}
          </div>

          {mainStreamManager !== undefined ? (
            <div id="main-video" className="col-md-6">
              {/* <div>mainStreamManager</div> */}
              {/* <UserVideoComponent
                  streamManager={this.state.mainStreamManager}
                /> */}
              {/* <input
                  className="btn btn-large btn-success"
                  type="button"
                  id="buttonSwitchCamera"
                  onClick={this.switchCamera}
                  value="Switch Camera"
                /> */}
            </div>
          ) : null}
          <div id="video-container" className="hi">
            {publisher !== undefined ? (
              <div
                className="stream-container"
                onClick={() => handleMainVideoStream(publisher)}
              >
                <UserAudioComponent streamManager={publisher} />
              </div>
            ) : null}
            {subscribers.map((sub, i) => {
              return (
                <div key={i} onClick={() => handleMainVideoStream(sub)}>
                  {/* <div>ssss</div> */}
                  <UserAudioComponent streamManager={sub} />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      <img
        className="greenbutton"
        alt=""
        src={mute ? muteIcon : unmuteIcon}
        onClick={() => {
          console.log("mute");
          publisher.publishAudio(mute);
          // target.subscribeToAudio(mute);
          setMute(!mute);
        }}
      ></img>
    </div>
  );
}
