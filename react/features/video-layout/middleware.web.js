// @flow

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout.js';
import { CONFERENCE_JOINED, CONFERENCE_WILL_LEAVE } from '../base/conference';
import {
    DOMINANT_SPEAKER_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED,
    PIN_PARTICIPANT,
    getParticipantById
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { TRACK_ADDED, TRACK_REMOVED } from '../base/tracks';
import { SET_FILMSTRIP_VISIBLE } from '../filmstrip';
import { clientResized } from '../base/responsive-ui/actions'

import './middleware.any';

declare var APP: Object;

/**
 * Middleware which intercepts actions and updates the legacy component
 * {@code VideoLayout} as needed. The purpose of this middleware is to redux-ify
 * {@code VideoLayout} without having to simultaneously react-ifying it.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    // Purposefully perform additional actions after state update to mimic
    // being connected to the store for updates.
    const result = next(action);

    const {
        innerHeight,
        innerWidth
    } = window;

    switch (action.type) {
    case CONFERENCE_JOINED:
        VideoLayout.mucJoined();
        break;

    case CONFERENCE_WILL_LEAVE:
        VideoLayout.reset();
        break;

    case PARTICIPANT_JOINED:
        console.log("joined")
        console.log(action.participant)
        // Sally - only add participant if they are the trainer
        if (!action.participant.local && action.participant.name === 'trainer') {
            VideoLayout.addRemoteParticipantContainer(
                getParticipantById(store.getState(), action.participant.id));
        }

        // Sally - trigger client resize to force resize of tile view
        store.dispatch(clientResized(innerWidth, innerHeight));

        VideoLayout.resizeVideoArea();
        break;

    case PARTICIPANT_LEFT:
        VideoLayout.removeParticipantContainer(action.participant.id);
        // Sally - trigger client resize to force resize of tile view
        store.dispatch(clientResized(innerWidth, innerHeight));
        VideoLayout.resizeVideoArea();
        break;

    case PARTICIPANT_UPDATED: {
        // Look for actions that triggered a change to connectionStatus. This is
        // done instead of changing the connection status change action to be
        // explicit in order to minimize changes to other code.
        console.log('participant updated')
        console.log(action.participant)
        // Sally - add participant if name = active
        //       - remove participant if name is not active, and not the trainer
        //       - if local - set video visible if active or trainer, and invisable if inactive.

        let p = getParticipantById(store.getState(), action.participant.id);
        console.log(p)
        if (p.local) {
            if (p.name === 'active' || p.name === 'trainer') {
                VideoLayout.setLocalVideoVisible(true);
            } else {
                VideoLayout.setLocalVideoVisible(false);
            }
        } else {
            if (p.name === 'active' || p.name === 'trainer') {
                console.log('add active participant')
                VideoLayout.addRemoteParticipantContainer(p);
            } else if (p.name !== 'trainer') {
                 console.log('remove inactive participant')
                VideoLayout.removeParticipantContainer(action.participant.id);
            }
        }

        if (typeof action.participant.connectionStatus !== 'undefined') {
            VideoLayout.onParticipantConnectionStatusChanged(
                action.participant.id,
                action.participant.connectionStatus);
        }

        // Sally - trigger client resize to force resize of tile view
        store.dispatch(clientResized(innerWidth, innerHeight));
        VideoLayout.resizeVideoArea();
        break;
    }

    case DOMINANT_SPEAKER_CHANGED:
        VideoLayout.onDominantSpeakerChanged(action.participant.id);
        break;

    case PIN_PARTICIPANT:
        VideoLayout.onPinChange(action.participant?.id);
        break;

    case SET_FILMSTRIP_VISIBLE:
        VideoLayout.resizeVideoArea();
        break;

    case TRACK_ADDED:
        if (!action.track.local) {
            VideoLayout.onRemoteStreamAdded(action.track.jitsiTrack);
        }

        break;
    case TRACK_REMOVED:
        if (!action.track.local) {
            VideoLayout.onRemoteStreamRemoved(action.track.jitsiTrack);
        }

        break;
    }

    return result;
});
