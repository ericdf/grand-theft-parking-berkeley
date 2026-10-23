'use strict';
// Voiceover hook-up. The film ships without recorded narration (captions carry every line).
// To add a recorded track, drop audio files in this folder and map them here, either one file per
// scene (played from the scene's start, so scrubbing stays in sync):
//
//   F.AUDIO_TRACKS = { promise: 'audio/01-promise.mp3', ferry: 'audio/02-ferry.mp3' };
//
// or a single file for the whole film:
//
//   F.AUDIO_FILM = 'audio/field-of-schemes.mp3';
//
// When any narration is present, captions start off (viewers can still turn them on with C).
F.AUDIO_TRACKS = {};
F.AUDIO_FILM = null;
