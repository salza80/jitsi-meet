/* global APP  */

import Logger from 'jitsi-meet-logger';

import { MEDIA_TYPE, VIDEO_TYPE } from '../../../react/features/base/media';
import {
    getLocalParticipant as getLocalParticipantFromStore,
    getPinnedParticipant,
    getParticipantById,
    pinParticipant
} from '../../../react/features/base/participants';
import { getTrackByMediaTypeAndParticipant } from '../../../react/features/base/tracks';
import UIEvents from '../../../service/UI/UIEvents';
import { SHARED_VIDEO_CONTAINER_TYPE } from '../shared_video/SharedVideo';
import SharedVideoThumb from '../shared_video/SharedVideoThumb';

import LargeVideoManager from './LargeVideoManager';
import LocalVideo from './LocalVideo';
import RemoteVideo from './RemoteVideo';
import { VIDEO_CONTAINER_TYPE } from './VideoContainer';

const logger = Logger.getLogger(__filename);

const remoteVideos = {};
const remoteStreams={};
let localVideoThumbnail = null;

let eventEmitter = null;

let largeVideo;

/**
 * flipX state of the localVideo
 */
let localFlipX = null;

/**
 * Handler for local flip X changed event.
 * @param {Object} val
 */
function onLocalFlipXChanged(val) {
    localFlipX = val;
    if (largeVideo) {
        largeVideo.onLocalFlipXChange(val);
    }
}

export function getAllVisibleThumbnails() {
    let thumbs = [];
    if (localVideoThumbnail && localVideoThumbnail.isVisible()) {
        thumbs.push(localVideoThumbnail)
    }
    for (const key in remoteVideos) {
      if (remoteVideos[key].isVisible()) {
        thumbs.push(remoteVideos[key])
      }
    }
    return [...thumbs];
}

/**
 * Returns an array of all thumbnails in the filmstrip.
 *
 * @private
 * @returns {Array}
 */
function getAllThumbnails() {
    return [
        ...localVideoThumbnail ? [ localVideoThumbnail ] : [],
        ...Object.values(remoteVideos)
    ];
}

/**
 * Private helper to get the redux representation of the local participant.
 *
 * @private
 * @returns {Object}
 */
function getLocalParticipant() {
    return getLocalParticipantFromStore(APP.store.getState());
}

const VideoLayout = {
    init(emitter) {

        //Sally - add local video but set it invisible unless trainer
        eventEmitter = emitter;

        localVideoThumbnail = new LocalVideo(
            VideoLayout,
            emitter,
            this._updateLargeVideoIfDisplayed.bind(this));
            let lp = getLocalParticipant()

            // Sally - make video invisible in init except for the trainer
            if (lp.name !== 'trainer') {
                this.setLocalVideoVisible(false)
            } else {this.setLocalVideoVisible(true)}

        this.registerListeners();
        this.hideStats();
    },

    /**
     * Registering listeners for UI events in Video layout component.
     *
     * @returns {void}
     */
    registerListeners() {
        eventEmitter.addListener(UIEvents.LOCAL_FLIPX_CHANGED,
            onLocalFlipXChanged);
    },

    /**
     * Cleans up state of this singleton {@code VideoLayout}.
     *
     * @returns {void}
     */
    reset() {
        this._resetLargeVideo();
        this._resetFilmstrip();
    },

    initLargeVideo() {
        this._resetLargeVideo();

        largeVideo = new LargeVideoManager(eventEmitter);
        if (localFlipX) {
            largeVideo.onLocalFlipXChange(localFlipX);
        }
        largeVideo.updateContainerSize();
    },

    /**
     * Sets the audio level of the video elements associated to the given id.
     *
     * @param id the video identifier in the form it comes from the library
     * @param lvl the new audio level to update to
     */
    setAudioLevel(id, lvl) {
        const smallVideo = this.getSmallVideo(id);

        if (smallVideo) {
            smallVideo.updateAudioLevelIndicator(lvl);
        }

        if (largeVideo && id === largeVideo.id) {
            largeVideo.updateLargeVideoAudioLevel(lvl);
        }
    },

    changeLocalVideo(stream) {
        const localId = getLocalParticipant().id;
        localVideoThumbnail.changeVideo(stream);
        this.onVideoTypeChanged(localId, stream.videoType);

        this._updateLargeVideoIfDisplayed(localId);
        localVideoThumbnail.updateView();
    },

    /**
     * Get's the localID of the conference and set it to the local video
     * (small one). This needs to be called as early as possible, when muc is
     * actually joined. Otherwise events can come with information like email
     * and setting them assume the id is already set.
     */
    mucJoined() {
        // FIXME: replace this call with a generic update call once SmallVideo
        // only contains a ReactElement. Then remove this call once the
        // Filmstrip is fully in React.
        localVideoThumbnail.updateIndicators();
    },

    /**
     * Shows/hides local video.
     * @param {boolean} true to make the local video visible, false - otherwise
     */
    setLocalVideoVisible(visible) {
        if (localVideoThumbnail) {
            localVideoThumbnail.setVisible(visible);
        }
    },

    onRemoteStreamAdded(stream) {
        const id = stream.getParticipantId();

        // keep streams (id: { type: stream}})
        let rs = remoteStreams[id] || {};
        rs[stream.getType()] = stream
        remoteStreams[id]=rs

        const remoteVideo = remoteVideos[id];

        logger.debug(`Received a new ${stream.getType()} stream for ${id}`);

        if (!remoteVideo) {
            logger.debug('No remote video element to add stream');

            return;
        }

        remoteVideo.addRemoteStreamElement(stream);

        // Make sure track's muted state is reflected
        if (stream.getType() !== 'audio') {
            this.onVideoMute(id);
            remoteVideo.updateView();
        }
        remoteVideo.updateView();
    },

    onRemoteStreamRemoved(stream) {
        const id = stream.getParticipantId();
        const remoteVideo = remoteVideos[id];

        // Remote stream may be removed after participant left the conference.

        if (remoteVideo) {
            remoteVideo.removeRemoteStreamElement(stream);
            remoteVideo.updateView();
        }

        this.updateMutedForNoTracks(id, stream.getType());
    },

    /**
     * FIXME get rid of this method once muted indicator are reactified (by
     * making sure that user with no tracks is displayed as muted )
     *
     * If participant has no tracks will make the UI display muted status.
     * @param {string} participantId
     * @param {string} mediaType 'audio' or 'video'
     */
    updateMutedForNoTracks(participantId, mediaType) {
        const participant = APP.conference.getParticipantById(participantId);

        if (participant && !participant.getTracksByMediaType(mediaType).length) {
            if (mediaType === 'audio') {
                APP.UI.setAudioMuted(participantId, true);
            } else if (mediaType === 'video') {
                APP.UI.setVideoMuted(participantId);
            } else {
                logger.error(`Unsupported media type: ${mediaType}`);
            }
        }
    },

    /**
     * Return the type of the remote video.
     * @param id the id for the remote video
     * @returns {String} the video type video or screen.
     */
    getRemoteVideoType(id) {
        const state = APP.store.getState();
        const participant = getParticipantById(state, id);

        if (participant?.isFakeParticipant) {
            return SHARED_VIDEO_CONTAINER_TYPE;
        }

        const videoTrack = getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, id);

        return videoTrack?.videoType;
    },

    isPinned(id) {
        return id === this.getPinnedId();
    },

    getPinnedId() {
        const { id } = getPinnedParticipant(APP.store.getState()) || {};

        return id || null;
    },

    /**
     * Triggers a thumbnail to pin or unpin itself.
     *
     * @param {number} videoNumber - The index of the video to toggle pin on.
     * @private
     */
    togglePin(videoNumber) {
        const videos = getAllThumbnails();
        const videoView = videos[videoNumber];

        videoView && videoView.togglePin();
    },

    /**
     * Callback invoked to update display when the pin participant has changed.
     *
     * @paramn {string|null} pinnedParticipantID - The participant ID of the
     * participant that is pinned or null if no one is pinned.
     * @returns {void}
     */
    onPinChange(pinnedParticipantID) {
        getAllThumbnails().forEach(thumbnail =>
            thumbnail.focus(pinnedParticipantID === thumbnail.getId()));
    },

    /**
     * Creates a participant container for the given id.
     *
     * @param {Object} participant - The redux representation of a remote
     * participant.
     * @returns {void}
     */
    addRemoteParticipantContainer(participant) {

        // Sally - if remote video already exists, don't add it
        if (remoteVideos[participant.id]) {
            return;
        }
        if (!participant || participant.local) {
            return;
        } else if (participant.isFakeParticipant) {
            const sharedVideoThumb = new SharedVideoThumb(
                participant,
                SHARED_VIDEO_CONTAINER_TYPE,
                VideoLayout);

            this.addRemoteVideoContainer(participant.id, sharedVideoThumb);

            return;
        }



        const id = participant.id;
        const jitsiParticipant = APP.conference.getParticipantById(id);
        const remoteVideo = new RemoteVideo(jitsiParticipant, VideoLayout);

        this.addRemoteVideoContainer(id, remoteVideo);

        this.updateMutedForNoTracks(id, 'audio');
        this.updateMutedForNoTracks(id, 'video');
        this.hideStats();

    },

    /**
     * Adds remote video container for the given id and <tt>SmallVideo</tt>.
     *
     * @param {string} the id of the video to add
     * @param {SmallVideo} smallVideo the small video instance to add as a
     * remote video
     */
    addRemoteVideoContainer(id, remoteVideo) {
        remoteVideos[id] = remoteVideo;

        // Initialize the view
        // Sally - ensure video and audio streams are added for subsequent adds
        this.addSavedRemoteStreams(id);
        this.setRemoteVideoOrder(id);
        remoteVideo.updateView();
    },

    // FIXME: what does this do???
    // remoteVideoActive(videoElement, resourceJid) {
    //     logger.info(`${resourceJid} video is now active`, videoElement);
    //     if (videoElement) {
    //         $(videoElement).show();
    //     }
    //     this._updateLargeVideoIfDisplayed(resourceJid, true);
    // },
    //Sally  add all saved remote streams to the remotevideo
    addSavedRemoteStreams(id) {
        let rs = remoteStreams[id] || [];
        for (const streamType in rs) {
            this.onRemoteStreamAdded(rs[streamType]);
        }
    },
    /**
     * On video muted event.
     */
    onVideoMute(id) {
        if (APP.conference.isLocalId(id)) {
            localVideoThumbnail && localVideoThumbnail.updateView();
        } else {
            const remoteVideo = remoteVideos[id];

            if (remoteVideo) {
                remoteVideo.updateView();
            }
        }

        // large video will show avatar instead of muted stream
        this._updateLargeVideoIfDisplayed(id, true);
    },

    /**
     * Display name changed.
     */
    onDisplayNameChanged(id) {
        if (id === 'localVideoContainer'
            || APP.conference.isLocalId(id)) {
            localVideoThumbnail.updateDisplayName();
        } else {
            const remoteVideo = remoteVideos[id];

            if (remoteVideo) {
              remoteVideo.updateDisplayName();
              this.setRemoteVideoOrder(id);
            }
            
           
        }
    },

    // Sally - Add function to set the order of a remote video (flex order css)
    // Sally - this makes sure trainer and active remote video will always be in the correct order, and correct side of localvideo

    setRemoteVideoOrder(id) {
      const remoteVideo = remoteVideos[id];
      if (!remoteVideo) {
        return;
      }
      const state = APP.store.getState();
      const participant = getParticipantById(state, id);

      if(!participant.name) { return };
      if (participant.name === 'trainer') {
        remoteVideo.updateOrderCss(-1);
      } else { remoteVideo.updateOrderCss(2); }
    },
    /**
     * On dominant speaker changed event.
     *
     * @param {string} id - The participant ID of the new dominant speaker.
     * @returns {void}
     */
    onDominantSpeakerChanged(id) {
        // Sally - do not show dominant speaker
        return;
        getAllThumbnails().forEach(thumbnail =>
            thumbnail.showDominantSpeakerIndicator(id === thumbnail.getId()));
    },

    /**
     * Shows/hides warning about a user's connectivity issues.
     *
     * @param {string} id - The ID of the remote participant(MUC nickname).
     * @returns {void}
     */
    onParticipantConnectionStatusChanged(id) {
        if (APP.conference.isLocalId(id)) {

            return;
        }

        // We have to trigger full large video update to transition from
        // avatar to video on connectivity restored.
        this._updateLargeVideoIfDisplayed(id, true);

        const remoteVideo = remoteVideos[id];

        if (remoteVideo) {
            remoteVideo.updateView();
        }
    },

    /**
     * On last N change event.
     *
     * @param endpointsLeavingLastN the list currently leaving last N
     * endpoints
     * @param endpointsEnteringLastN the list currently entering last N
     * endpoints
     */
    onLastNEndpointsChanged(endpointsLeavingLastN, endpointsEnteringLastN) {
        if (endpointsLeavingLastN) {
            endpointsLeavingLastN.forEach(this._updateRemoteVideo, this);
        }

        if (endpointsEnteringLastN) {
            endpointsEnteringLastN.forEach(this._updateRemoteVideo, this);
        }
    },

    /**
     * Updates remote video by id if it exists.
     * @param {string} id of the remote video
     * @private
     */
    _updateRemoteVideo(id) {
        const remoteVideo = remoteVideos[id];

        if (remoteVideo) {
            remoteVideo.updateView();
            this._updateLargeVideoIfDisplayed(id);
        }
    },

    /**
     * Hides all the indicators
     */
    hideStats() {
        for (const video in remoteVideos) { // eslint-disable-line guard-for-in
            const remoteVideo = remoteVideos[video];

            if (remoteVideo) {
                remoteVideo.removeConnectionIndicator();
            }
        }
        localVideoThumbnail.removeConnectionIndicator();
    },

    removeParticipantContainer(id) {
        // Unlock large video
        if (this.getPinnedId() === id) {
            logger.info('Focused video owner has left the conference');
            APP.store.dispatch(pinParticipant(null));
        }

        const remoteVideo = remoteVideos[id];

        if (remoteVideo) {
            // Remove remote video
            logger.info(`Removing remote video: ${id}`);
            delete remoteVideos[id];
            remoteVideo.remove();
        } else {
            logger.warn(`No remote video for ${id}`);
        }
    },

    onVideoTypeChanged(id, newVideoType) {
        const remoteVideo = remoteVideos[id];

        if (!remoteVideo) {
          return;
        }

        logger.info('Peer video type changed: ', id, newVideoType);
        remoteVideo.updateView();
    },

    /**
     * Resizes the video area.
     */
    resizeVideoArea() {
        if (largeVideo) {
            largeVideo.updateContainerSize();
            largeVideo.resize(false);
        }
    },

    getSmallVideo(id) {
        if (APP.conference.isLocalId(id)) {
            return localVideoThumbnail;
        }

        return remoteVideos[id];

    },

    changeUserAvatar(id, avatarUrl) {
        const smallVideo = VideoLayout.getSmallVideo(id);

        if (smallVideo) {
            smallVideo.initializeAvatar();
        } else {
            logger.warn(
                `Missed avatar update - no small video yet for ${id}`
            );
        }
        if (this.isCurrentlyOnLarge(id)) {
            largeVideo.updateAvatar(avatarUrl);
        }
    },

    isLargeVideoVisible() {
        return this.isLargeContainerTypeVisible(VIDEO_CONTAINER_TYPE);
    },

    /**
     * @return {LargeContainer} the currently displayed container on large
     * video.
     */
    getCurrentlyOnLargeContainer() {
        return largeVideo.getCurrentContainer();
    },

    isCurrentlyOnLarge(id) {
        return largeVideo && largeVideo.id === id;
    },

    /**
     * Triggers an update of remote video and large video displays so they may
     * pick up any state changes that have occurred elsewhere.
     *
     * @returns {void}
     */
    updateAllVideos() {
        const displayedUserId = this.getLargeVideoID();

        if (displayedUserId) {
            this.updateLargeVideo(displayedUserId, true);
        }

        Object.keys(remoteVideos).forEach(video => {
            remoteVideos[video].updateView();
        });
    },

    updateLargeVideo(id, forceUpdate) {
        if (!largeVideo) {
            return;
        }
        const currentContainer = largeVideo.getCurrentContainer();
        const currentContainerType = largeVideo.getCurrentContainerType();
        const isOnLarge = this.isCurrentlyOnLarge(id);
        const state = APP.store.getState();
        const videoTrack = getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, id);
        const videoStream = videoTrack?.jitsiTrack;

        if (isOnLarge && !forceUpdate
                && LargeVideoManager.isVideoContainer(currentContainerType)
                && videoStream) {
            const currentStreamId = currentContainer.getStreamID();
            const newStreamId = videoStream?.getId() || null;

            // FIXME it might be possible to get rid of 'forceUpdate' argument
            if (currentStreamId !== newStreamId) {
                logger.debug('Enforcing large video update for stream change');
                forceUpdate = true; // eslint-disable-line no-param-reassign
            }
        }

        if (!isOnLarge || forceUpdate) {
            const videoType = this.getRemoteVideoType(id);


            largeVideo.updateLargeVideo(
                id,
                videoStream,
                videoType || VIDEO_TYPE.CAMERA
            ).catch(() => {
                // do nothing
            });
        }
    },

    addLargeVideoContainer(type, container) {
        largeVideo && largeVideo.addContainer(type, container);
    },

    removeLargeVideoContainer(type) {
        largeVideo && largeVideo.removeContainer(type);
    },

    /**
     * @returns Promise
     */
    showLargeVideoContainer(type, show) {
        if (!largeVideo) {
            return Promise.reject();
        }

        const isVisible = this.isLargeContainerTypeVisible(type);

        if (isVisible === show) {
            return Promise.resolve();
        }

        const currentId = largeVideo.id;
        let oldSmallVideo;

        if (currentId) {
            oldSmallVideo = this.getSmallVideo(currentId);
        }

        let containerTypeToShow = type;

        // if we are hiding a container and there is focusedVideo
        // (pinned remote video) use its video type,
        // if not then use default type - large video

        if (!show) {
            const pinnedId = this.getPinnedId();

            if (pinnedId) {
                containerTypeToShow = this.getRemoteVideoType(pinnedId);
            } else {
                containerTypeToShow = VIDEO_CONTAINER_TYPE;
            }
        }

        return largeVideo.showContainer(containerTypeToShow)
            .then(() => {
                if (oldSmallVideo) {
                    oldSmallVideo && oldSmallVideo.updateView();
                }
            });
    },

    isLargeContainerTypeVisible(type) {
        return largeVideo && largeVideo.state === type;
    },

    /**
     * Returns the id of the current video shown on large.
     * Currently used by tests (torture).
     */
    getLargeVideoID() {
        return largeVideo && largeVideo.id;
    },

    /**
     * Returns the the current video shown on large.
     * Currently used by tests (torture).
     */
    getLargeVideo() {
        return largeVideo;
    },

    /**
     * Sets the flipX state of the local video.
     * @param {boolean} true for flipped otherwise false;
     */
    setLocalFlipX(val) {
        this.localFlipX = val;
    },

    /**
     * Returns the wrapper jquery selector for the largeVideo
     * @returns {JQuerySelector} the wrapper jquery selector for the largeVideo
     */
    getLargeVideoWrapper() {
        return this.getCurrentlyOnLargeContainer().$wrapper;
    },

    /**
     * Returns the number of remove video ids.
     *
     * @returns {number} The number of remote videos.
     */
    getRemoteVideosCount() {
        return Object.keys(remoteVideos).length;
    },

    /**
     * Helper method to invoke when the video layout has changed and elements
     * have to be re-arranged and resized.
     *
     * @returns {void}
     */
    refreshLayout() {
        localVideoThumbnail && localVideoThumbnail.updateDOMLocation();
        VideoLayout.resizeVideoArea();

        // Rerender the thumbnails since they are dependant on the layout because of the tooltip positioning.
        localVideoThumbnail && localVideoThumbnail.rerender();
        Object.values(remoteVideos).forEach(remoteVideoThumbnail => remoteVideoThumbnail.rerender());
    },

    /**
     * Cleans up any existing largeVideo instance.
     *
     * @private
     * @returns {void}
     */
    _resetLargeVideo() {
        if (largeVideo) {
            largeVideo.destroy();
        }

        largeVideo = null;
    },

    /**
     * Cleans up filmstrip state. While a separate {@code Filmstrip} exists, its
     * implementation is mainly for querying and manipulating the DOM while
     * state mostly remains in {@code VideoLayout}.
     *
     * @private
     * @returns {void}
     */
    _resetFilmstrip() {
        Object.keys(remoteVideos).forEach(remoteVideoId => {
            this.removeParticipantContainer(remoteVideoId);
            delete remoteVideos[remoteVideoId];
        });

        if (localVideoThumbnail) {
            localVideoThumbnail.remove();
            localVideoThumbnail = null;
        }
    },

    /**
     * Triggers an update of large video if the passed in participant is
     * currently displayed on large video.
     *
     * @param {string} participantId - The participant ID that should trigger an
     * update of large video if displayed.
     * @param {boolean} force - Whether or not the large video update should
     * happen no matter what.
     * @returns {void}
     */
    _updateLargeVideoIfDisplayed(participantId, force = false) {
        if (this.isCurrentlyOnLarge(participantId)) {
            this.updateLargeVideo(participantId, force);
        }
    },

    /**
     * Handles window resizes.
     */
    onResize() {
        VideoLayout.resizeVideoArea();
    }
};

export default VideoLayout;
