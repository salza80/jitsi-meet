// @flow

import { jitsiLocalStorage } from '@jitsi/js-utils';
import _ from 'lodash';

import { parseURLParams } from '../util';

import CONFIG_WHITELIST from './configWhitelist';
import { _CONFIG_STORE_PREFIX } from './constants';
import INTERFACE_CONFIG_WHITELIST from './interfaceConfigWhitelist';
import logger from './logger';

// XXX The function getRoomName is split out of
// functions.js because it is bundled in both app.bundle and
// do_external_connect, webpack 1 does not support tree shaking, and we don't
// want all functions to be bundled in do_external_connect.
export { default as getRoomName } from './getRoomName';

/**
 * Create a "fake" configuration object for the given base URL. This is used in case the config
 * couldn't be loaded in the welcome page, so at least we have something to try with.
 *
 * @param {string} baseURL - URL of the deployment for which we want the fake config.
 * @returns {Object}
 */
export function createFakeConfig(baseURL: string) {
    const url = new URL(baseURL);

    return {
        hosts: {
            domain: url.hostname,
            muc: `conference.${url.hostname}`
        },
        bosh: `${baseURL}http-bind`,
        clientNode: 'https://jitsi.org/jitsi-meet',
        p2p: {
            enabled: true
        }
    };
}

/* eslint-disable max-params, no-shadow */

/**
 * Overrides JSON properties in {@code config} and
 * {@code interfaceConfig} Objects with the values from {@code newConfig}.
 * Overrides only the whitelisted keys.
 *
 * @param {Object} config - The config Object in which we'll be overriding
 * properties.
 * @param {Object} interfaceConfig - The interfaceConfig Object in which we'll
 * be overriding properties.
 * @param {Object} loggingConfig - The loggingConfig Object in which we'll be
 * overriding properties.
 * @param {Object} json - Object containing configuration properties.
 * Destination object is selected based on root property name:
 * {
 *     config: {
 *         // config.js properties here
 *     },
 *     interfaceConfig: {
 *         // interface_config.js properties here
 *     },
 *     loggingConfig: {
 *         // logging_config.js properties here
 *     }
 * }.
 * @returns {void}
 */




var interfaceConfig = {
    APP_NAME: 'Audi',
    AUDIO_LEVEL_PRIMARY_COLOR: 'rgba(255,255,255,0.4)',
    AUDIO_LEVEL_SECONDARY_COLOR: 'rgba(255,255,255,0.2)',

    /**
     * A UX mode where the last screen share participant is automatically
     * pinned. Valid values are the string "remote-only" so remote participants
     * get pinned but not local, otherwise any truthy value for all participants,
     * and any falsy value to disable the feature.
     *
     * Note: this mode is experimental and subject to breakage.
     */
    AUTO_PIN_LATEST_SCREEN_SHARE: 'remote-only',
    BRAND_WATERMARK_LINK: '',

    CLOSE_PAGE_GUEST_HINT: false, // A html text to be shown to guests on the close page, false disables it
    /**
     * Whether the connection indicator icon should hide itself based on
     * connection strength. If true, the connection indicator will remain
     * displayed while the participant has a weak connection and will hide
     * itself after the CONNECTION_INDICATOR_HIDE_TIMEOUT when the connection is
     * strong.
     *
     * @type {boolean}
     */
    CONNECTION_INDICATOR_AUTO_HIDE_ENABLED: true,

    /**
     * How long the connection indicator should remain displayed before hiding.
     * Used in conjunction with CONNECTION_INDICATOR_AUTOHIDE_ENABLED.
     *
     * @type {number}
     */
    CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT: 5000,

    /**
     * If true, hides the connection indicators completely.
     *
     * @type {boolean}
     */
    CONNECTION_INDICATOR_DISABLED: false,

    DEFAULT_BACKGROUND: '#474747',
    DEFAULT_LOCAL_DISPLAY_NAME: 'me',
    DEFAULT_LOGO_URL: 'images/watermark.png',
    DEFAULT_REMOTE_DISPLAY_NAME: 'Fellow Jitster',
    DEFAULT_WELCOME_PAGE_LOGO_URL: 'images/watermark.png',

    DISABLE_DOMINANT_SPEAKER_INDICATOR: false,

    DISABLE_FOCUS_INDICATOR: false,

    /**
     * If true, notifications regarding joining/leaving are no longer displayed.
     */
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,

    /**
     * If true, presence status: busy, calling, connected etc. is not displayed.
     */
    DISABLE_PRESENCE_STATUS: false,

    /**
     * Whether the ringing sound in the call/ring overlay is disabled. If
     * {@code undefined}, defaults to {@code false}.
     *
     * @type {boolean}
     */
    DISABLE_RINGING: false,

    /**
     * Whether the speech to text transcription subtitles panel is disabled.
     * If {@code undefined}, defaults to {@code false}.
     *
     * @type {boolean}
     */
    DISABLE_TRANSCRIPTION_SUBTITLES: false,

    /**
     * Whether or not the blurred video background for large video should be
     * displayed on browsers that can support it.
     */
    DISABLE_VIDEO_BACKGROUND: false,

    DISPLAY_WELCOME_PAGE_CONTENT: true,
    DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,

    ENABLE_DIAL_OUT: true,

    ENABLE_FEEDBACK_ANIMATION: false, // Enables feedback star animation.

    FILM_STRIP_MAX_HEIGHT: 120,

    /**
     * Whether to only show the filmstrip (and hide the toolbar).
     */
    filmStripOnly: false,

    GENERATE_ROOMNAMES_ON_WELCOME_PAGE: true,

    /**
     * Hide the logo on the deep linking pages.
     */
    HIDE_DEEP_LINKING_LOGO: true,

    /**
     * Hide the invite prompt in the header when alone in the meeting.
     */
    HIDE_INVITE_MORE_HEADER: true,

    INITIAL_TOOLBAR_TIMEOUT: 20000,
    JITSI_WATERMARK_LINK: 'https://jitsi.org',

    LANG_DETECTION: true, // Allow i18n to detect the system language
    LIVE_STREAMING_HELP_LINK: 'https://jitsi.org/live', // Documentation reference for the live streaming feature.
    LOCAL_THUMBNAIL_RATIO: 16 / 9, // 16:9

    /**
     * Maximum coefficient of the ratio of the large video to the visible area
     * after the large video is scaled to fit the window.
     *
     * @type {number}
     */
    MAXIMUM_ZOOMING_COEFFICIENT: 1.3,

    /**
     * Whether the mobile app Jitsi Meet is to be promoted to participants
     * attempting to join a conference in a mobile Web browser. If
     * {@code undefined}, defaults to {@code true}.
     *
     * @type {boolean}
     */
    MOBILE_APP_PROMO: true,

    NATIVE_APP_NAME: 'Jitsi Meet',

    // Names of browsers which should show a warning stating the current browser
    // has a suboptimal experience. Browsers which are not listed as optimal or
    // unsupported are considered suboptimal. Valid values are:
    // chrome, chromium, edge, electron, firefox, nwjs, opera, safari
    OPTIMAL_BROWSERS: [ 'chrome', 'chromium', 'firefox', 'nwjs', 'electron', 'safari' ],

    POLICY_LOGO: null,
    PROVIDER_NAME: 'Jitsi',

    /**
     * If true, will display recent list
     *
     * @type {boolean}
     */
    RECENT_LIST_ENABLED: false,
    REMOTE_THUMBNAIL_RATIO: 1, // 1:1

    SETTINGS_SECTIONS: [ 'devices', 'language', 'moderator', 'profile', 'calendar' ],
    SHOW_BRAND_WATERMARK: false,

    /**
    * Decides whether the chrome extension banner should be rendered on the landing page and during the meeting.
    * If this is set to false, the banner will not be rendered at all. If set to true, the check for extension(s)
    * being already installed is done before rendering.
    */
    SHOW_CHROME_EXTENSION_BANNER: false,

    SHOW_DEEP_LINKING_IMAGE: false,
    SHOW_JITSI_WATERMARK: false,
    SHOW_POWERED_BY: false,
    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
    SHOW_WATERMARK_FOR_GUESTS: false, // if watermark is disabled by default, it can be shown only for guests

    /*
     * If indicated some of the error dialogs may point to the support URL for
     * help.
     */
    SUPPORT_URL: 'https://community.jitsi.org/',

    TOOLBAR_ALWAYS_VISIBLE: true,

    /**
     * The name of the toolbar buttons to display in the toolbar, including the
     * "More actions" menu. If present, the button will display. Exceptions are
     * "livestreaming" and "recording" which also require being a moderator and
     * some values in config.js to be enabled. Also, the "profile" button will
     * not display for users with a JWT.
     * Notes:
     * - it's impossible to choose which buttons go in the "More actions" menu
     * - it's impossible to control the placement of buttons
     * - 'desktop' controls the "Share your screen" button
     */
    // TOOLBAR_BUTTONS: [
    //     'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
    //     'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
    //     'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
    //     'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
    //     'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
    // ],

    TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'desktop', 'sharedvideo', 'settings', 'videoquality', 'tileview', 'mute-everyone'
    ],

    TOOLBAR_TIMEOUT: 4000,

    // Browsers, in addition to those which do not fully support WebRTC, that
    // are not supported and should show the unsupported browser page.
    UNSUPPORTED_BROWSERS: [],

    /**
     * Whether to show thumbnails in filmstrip as a column instead of as a row.
     */
    VERTICAL_FILMSTRIP: true,

    // Determines how the video would fit the screen. 'both' would fit the whole
    // screen, 'height' would fit the original video height to the height of the
    // screen, 'width' would fit the original video width to the width of the
    // screen respecting ratio.
    VIDEO_LAYOUT_FIT: 'both',

    /**
     * If true, hides the video quality label indicating the resolution status
     * of the current large video.
     *
     * @type {boolean}
     */
    VIDEO_QUALITY_LABEL_DISABLED: false,

    /**
     * When enabled, the kick participant button will not be presented for users without a JWT
     */
    HIDE_KICK_BUTTON_FOR_GUESTS: true,

    /**
     * How many columns the tile view can expand to. The respected range is
     * between 1 and 5.
     */

    TILE_VIEW_MAX_COLUMNS: 2,

    /**
     * Specify custom URL for downloading android mobile app.
     */
    // MOBILE_DOWNLOAD_LINK_ANDROID: 'https://play.google.com/store/apps/details?id=org.jitsi.meet',

    /**
     * Specify URL for downloading ios mobile app.
     */
    // MOBILE_DOWNLOAD_LINK_IOS: 'https://itunes.apple.com/us/app/jitsi-meet/id1165103905',

    /**
     * Specify Firebase dynamic link properties for the mobile apps.
     */
    // MOBILE_DYNAMIC_LINK: {
    //    APN: 'org.jitsi.meet',
    //    APP_CODE: 'w2atb',
    //    CUSTOM_DOMAIN: undefined,
    //    IBI: 'com.atlassian.JitsiMeet.ios',
    //    ISI: '1165103905'
    // },

    /**
     * Specify mobile app scheme for opening the app from the mobile browser.
     */
    // APP_SCHEME: 'org.jitsi.meet',

    /**
     * Specify the Android app package name.
     */
    // ANDROID_APP_PACKAGE: 'org.jitsi.meet',

    /**
     * Override the behavior of some notifications to remain displayed until
     * explicitly dismissed through a user action. The value is how long, in
     * milliseconds, those notifications should remain displayed.
     */
    // ENFORCE_NOTIFICATION_AUTO_DISMISS_TIMEOUT: 15000,

    // List of undocumented settings
    /**
     INDICATOR_FONT_SIZES
     PHONE_NUMBER_REGEX
    */

    // Allow all above example options to include a trailing comma and
    // prevent fear when commenting out the last value.
    // eslint-disable-next-line sort-keys
    makeJsonParserHappy: 'even if last key had a trailing comma'

    // No configuration value should follow this line.
};

/* eslint-enable no-unused-vars, no-var, max-len */


export function overrideConfigJSON(
        config: ?Object, interfaceConfig: ?Object, loggingConfig: ?Object,
        json: Object) {
    for (const configName of Object.keys(json)) {
        let configObj;

        if (configName === 'config') {
            configObj = config;
        } else if (configName === 'interfaceConfig') {
            configObj = interfaceConfig;
        } else if (configName === 'loggingConfig') {
            configObj = loggingConfig;
        }
        if (configObj) {
            const configJSON
                = _getWhitelistedJSON(configName, json[configName]);

            if (!_.isEmpty(configJSON)) {
                logger.info(
                    `Extending ${configName} with: ${
                        JSON.stringify(configJSON)}`);

                // eslint-disable-next-line arrow-body-style
                _.mergeWith(configObj, configJSON, (oldValue, newValue) => {

                    // XXX We don't want to merge the arrays, we want to
                    // overwrite them.
                    return Array.isArray(oldValue) ? newValue : undefined;
                });
            }
        }
    }
}

/* eslint-enable max-params, no-shadow */

/**
 * Apply whitelist filtering for configs with whitelists, skips this for others
 * configs (loggingConfig).
 * Only extracts overridden values for keys we allow to be overridden.
 *
 * @param {string} configName - The config name, one of config,
 * interfaceConfig, loggingConfig.
 * @param {Object} configJSON - The object with keys and values to override.
 * @private
 * @returns {Object} - The result object only with the keys
 * that are whitelisted.
 */


function _getWhitelistedJSON(configName, configJSON) {
    if (configName === 'interfaceConfig') {
        return _.pick(interfaceConfig, INTERFACE_CONFIG_WHITELIST);
    } else if (configName === 'config') {
        return _.pick(configJSON, CONFIG_WHITELIST);
    }

    return configJSON;
}

/**
 * Restores a Jitsi Meet config.js from {@code localStorage} if it was
 * previously downloaded from a specific {@code baseURL} and stored with
 * {@link storeConfig}.
 *
 * @param {string} baseURL - The base URL from which the config.js was
 * previously downloaded and stored with {@code storeConfig}.
 * @returns {?Object} The Jitsi Meet config.js which was previously downloaded
 * from {@code baseURL} and stored with {@code storeConfig} if it was restored;
 * otherwise, {@code undefined}.
 */
export function restoreConfig(baseURL: string): ?Object {
    const key = `${_CONFIG_STORE_PREFIX}/${baseURL}`;
    const config = jitsiLocalStorage.getItem(key);

    if (config) {
        try {
            return JSON.parse(config) || undefined;
        } catch (e) {
            // Somehow incorrect data ended up in the storage. Clean it up.
            jitsiLocalStorage.removeItem(key);
        }
    }

    return undefined;
}

/* eslint-disable max-params */

/**
 * Inspects the hash part of the location URI and overrides values specified
 * there in the corresponding config objects given as the arguments. The syntax
 * is: {@code https://server.com/room#config.debug=true
 * &interfaceConfig.showButton=false&loggingConfig.something=1}.
 *
 * In the hash part each parameter will be parsed to JSON and then the root
 * object will be matched with the corresponding config object given as the
 * argument to this function.
 *
 * @param {Object} config - This is the general config.
 * @param {Object} interfaceConfig - This is the interface config.
 * @param {Object} loggingConfig - The logging config.
 * @param {URI} location - The new location to which the app is navigating to.
 * @returns {void}
 */
export function setConfigFromURLParams(
        config: ?Object,
        interfaceConfig: ?Object,
        loggingConfig: ?Object,
        location: Object) {
    const params = parseURLParams(location);
    const json = {};

    // At this point we have:
    // params = {
    //     "config.disableAudioLevels": false,
    //     "config.channelLastN": -1,
    //     "interfaceConfig.APP_NAME": "Jitsi Meet"
    // }
    // We want to have:
    // json = {
    //     config: {
    //         "disableAudioLevels": false,
    //         "channelLastN": -1
    //     },
    //     interfaceConfig: {
    //         "APP_NAME": "Jitsi Meet"
    //     }
    // }
    config && (json.config = {});
    interfaceConfig && (json.interfaceConfig = {});
    loggingConfig && (json.loggingConfig = {});

    for (const param of Object.keys(params)) {
        let base = json;
        const names = param.split('.');
        const last = names.pop();

        for (const name of names) {
            base = base[name] = base[name] || {};
        }

        base[last] = params[param];
    }

    overrideConfigJSON(config, interfaceConfig, loggingConfig, json);
}

/* eslint-enable max-params */
